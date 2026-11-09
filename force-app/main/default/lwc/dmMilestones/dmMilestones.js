import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { LAYOUTS } from 'c/dmConfig';
import { raw, num, currentStage } from 'c/dmUtil';

export default class DmMilestones extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;
    openState = {};

    get config() {
        return LAYOUTS[this.layout] || LAYOUTS.newBusiness;
    }

    get fieldList() {
        return this.config.fields;
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: '$fieldList' })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get hasRecord() {
        return !!this.record;
    }

    get groups() {
        const r = this.record;
        if (!r) {
            return [];
        }
        const cur = currentStage(r);
        return this.config.groups.map((g) => {
            const rows = g.items.filter((it) => !it.when || raw(r, it.when) !== false).map((it) => this.buildRow(r, it));
            const isStage = g.stage !== undefined && g.stage !== null;
            let summary = '';
            let isCurrent = false;
            let title = g.title;
            if (isStage) {
                const total = num(r, 'Stage_' + g.stage + '_Total__c');
                const done = num(r, 'Stage_' + g.stage + '_Complete__c') || 0;
                isCurrent = cur === g.stage;
                title = g.title + (isCurrent ? ' (current)' : '');
                summary = total ? done + ' of ' + total + ' complete' : '';
            } else {
                const scored = rows.filter((x) => x.assessed).length;
                summary = scored + ' of ' + rows.length + ' scored';
            }
            const defaultOpen = isStage ? isCurrent : true;
            const open = Object.prototype.hasOwnProperty.call(this.openState, g.key) ? this.openState[g.key] : defaultOpen;
            const overview = g.overview ? raw(r, g.overview) : null;
            return {
                key: g.key,
                title,
                summary,
                open,
                ariaExpanded: open ? 'true' : 'false',
                toggleText: open ? 'Collapse' : 'Expand',
                headClass: isCurrent ? 'ghead ghead-current' : 'ghead',
                rows,
                hasRows: rows.length > 0,
                overview: overview ? this.plain(overview) : '',
                hasOverview: !!overview
            };
        });
    }

    buildRow(r, it) {
        const score = num(r, it.score);
        const max = it.max || null;
        const reason = it.reason ? raw(r, it.reason) : null;
        let pillText = 'Not assessed';
        let tone = 'none';
        if (score !== null) {
            if (score <= 0) {
                pillText = 'Not started';
                tone = 'bad';
            } else if (max === null) {
                // The scale for this field is not recorded, so show the number without a verdict.
                pillText = 'Scored';
                tone = 'info';
            } else if (score >= (it.doneAt || max)) {
                pillText = 'Complete';
                tone = 'good';
            } else {
                pillText = 'In progress';
                tone = 'warn';
            }
        }
        let scoreText = '\u2013';
        if (score !== null) {
            scoreText = max === null ? String(score) : score + ' / ' + max;
        }
        return {
            key: it.score,
            label: it.label,
            assessed: score !== null,
            scoreText,
            pillText,
            pillClass: 'pill pill-' + tone,
            reason: reason || '',
            hasReason: !!reason
        };
    }

    // Overview fields can hold rich text. Strip tags so it shows as plain text.
    plain(text) {
        return String(text)
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    handleToggle(event) {
        const key = event.currentTarget.dataset.key;
        const group = this.groups.find((g) => g.key === key);
        const current = group ? group.open : true;
        this.openState = { ...this.openState, [key]: !current };
    }
}