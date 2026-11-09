import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { stageFields, buildStages } from 'c/dmStages';

export default class DmStageMilestones extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    @api variant = 'list';
    record;
    openState = {};
    openItem = null;

    get fields() {
        return stageFields(this.layout);
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: '$fields' })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get hasRecord() {
        return !!this.record;
    }

    get isBoard() {
        return this.variant === 'board';
    }

    get model() {
        return this.record ? buildStages(this.record, this.layout) : { current: null, stages: [] };
    }

    get totals() {
        const st = this.model.stages;
        const done = st.reduce((a, s) => a + s.done, 0);
        const total = st.reduce((a, s) => a + s.total, 0);
        return done + ' of ' + total + ' milestones complete';
    }

    get title() {
        return this.isBoard ? 'Milestones by stage' : 'Milestones';
    }

    get stages() {
        return this.model.stages.map((s) => {
            const defaultOpen = s.isCurrent || (this.model.current === null && s.stage === 0);
            const open = Object.prototype.hasOwnProperty.call(this.openState, s.key) ? this.openState[s.key] : defaultOpen;
            let summary = s.total ? s.done + ' of ' + s.total + ' complete' : 'No scored milestones at this stage';
            if (s.total && s.inProgress > 0) {
                summary += ' · ' + s.inProgress + ' in progress';
            }
            if (s.isPast && s.open > 0) {
                summary += ' · ' + s.open + ' open';
            }
            const tone = s.total === 0 ? 'none' : s.done === s.total ? 'good' : s.done > 0 || s.inProgress > 0 ? 'warn' : 'bad';
            return {
                ...s,
                title: s.name + (s.isCurrent ? ' (current)' : ''),
                laneTitle: s.name + (s.isCurrent ? ' · now' : ''),
                summary,
                open,
                ariaExpanded: open ? 'true' : 'false',
                toggleText: open ? 'Collapse' : 'Expand',
                headClass: s.isCurrent ? 'ghead ghead-current' : 'ghead',
                laneClass: s.isCurrent ? 'lane lane-current' : 'lane',
                countClass: 'pill pill-' + tone,
                countText: s.done + '/' + s.total + (s.inProgress > 0 ? ' +' + s.inProgress : ''),
                items: s.items.map((x) => ({
                    ...x,
                    showReason: this.openItem === x.key,
                    chipAria: this.openItem === x.key ? 'true' : 'false'
                }))
            };
        });
    }

    handleToggle(event) {
        const key = event.currentTarget.dataset.key;
        const st = this.stages.find((s) => s.key === key);
        this.openState = { ...this.openState, [key]: !(st && st.open) };
    }

    handleChip(event) {
        const key = event.currentTarget.dataset.key;
        this.openItem = this.openItem === key ? null : key;
    }
}