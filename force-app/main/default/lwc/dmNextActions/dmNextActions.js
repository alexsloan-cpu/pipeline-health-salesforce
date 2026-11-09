import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { stageFields, buildStages, val, relVal } from 'c/dmStages';

const EXTRA = ['Suggested_Next_Step__c', 'Opportunity__r.Next_Step__c', 'Opportunity__r.Next_Step_Date__c'];

function clip(t, n) {
    const s = String(t).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 3) + '...' : s;
}

export default class DmNextActions extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;

    get fields() {
        return stageFields(this.layout, EXTRA);
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

    get ownerStep() {
        const s = this.record ? relVal(this.record, 'Opportunity__r.Next_Step__c') : null;
        return s ? clip(s, 220) : '';
    }

    get ownerStepDate() {
        const d = this.record ? relVal(this.record, 'Opportunity__r.Next_Step_Date__c') : null;
        return d ? 'Due ' + d : '';
    }

    get hasOwnerStep() {
        return !!this.ownerStep;
    }

    get actions() {
        const r = this.record;
        if (!r) {
            return [];
        }
        const out = [];
        const sug = val(r, 'Suggested_Next_Step__c');
        if (sug) {
            out.push({ title: clip(sug, 160), why: 'Suggested from the latest calls.' });
        }
        const m = buildStages(r, this.layout);
        const cur = m.stages.find((s) => s.isCurrent);
        const open = cur ? cur.items.filter((x) => !x.done) : [];
        open
            .sort((a, b) => (a.score === null ? -1 : a.score / a.max) - (b.score === null ? -1 : b.score / b.max))
            .slice(0, 2)
            .forEach((x) => {
                out.push({
                    title: 'Close the gap on ' + x.label,
                    why: (x.score === null ? 'Not assessed yet. ' : 'Scored ' + x.shortScore + '. ') + (x.hasReason ? clip(x.reason, 140) : '')
                });
            });
        if (m.current !== null) {
            const past = m.stages.filter((s) => s.stage < m.current && s.open > 0);
            if (past.length) {
                const s = past[0];
                const x = s.items.find((i) => !i.done);
                out.push({ title: 'Go back for ' + x.label, why: s.name + ' was left open when the deal moved on.' });
            }
        }
        return out.slice(0, 4).map((a, i) => ({ ...a, key: 'a' + i, num: i + 1, cls: i === 0 ? 'li li-first' : 'li' }));
    }

    get hasActions() {
        return this.actions.length > 0;
    }
}