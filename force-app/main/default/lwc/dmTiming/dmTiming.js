import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { raw, num, shown } from 'c/dmUtil';

const OBJ = 'Deal_Milestones__c.';
// Display names and questions only. The score fields and the 0 to 5 rubric are unchanged.
const SIGNALS = [
    {
        key: 'buyer', label: 'Buyer momentum', question: 'Is the buyer driving toward a decision by the close date?',
        field: 'Buyer Momentum & Control', score: 'Buyer_Momentum_Control_Score__c', detail: 'Buyer_Momentum__c'
    },
    {
        key: 'objection', label: 'Objections resolved', question: 'Has the buyer confirmed their concerns are closed?',
        field: 'Objection Resolution Status', score: 'Objection_Resolution_Status_Score__c', detail: 'Objection_Status__c'
    },
    {
        key: 'champion', label: 'Champion strength', question: 'Is someone inside actively selling for us?',
        field: 'Champion Involvement', score: 'Champion_Involvement_Score__c', detail: 'Champion_Involvement__c'
    },
    {
        key: 'nextsteps', label: 'Next steps kept', question: 'Are next steps dated, owned, and getting done?',
        field: 'Clear & Missed Next Steps', score: 'Clear_Next_Steps_Score__c', detail: 'ClearMissed_NextSteps__c'
    }
];
const VERDICT = { 5: 'Strong', 4: 'On track', 3: 'Mixed', 2: 'Slipping', 1: 'At risk', 0: 'No evidence' };
const HEALTH = 'Timing_Health_Score__c';
const OVERVIEW = 'Deal_Timing_Details__c';

const FIELDS = [HEALTH, OVERVIEW].concat(SIGNALS.map((s) => s.score), SIGNALS.map((s) => s.detail)).map((f) => OBJ + f);

export default class DmTiming extends LightningElement {
    @api recordId;
    record;
    openState = {};

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get hasRecord() {
        return !!this.record;
    }

    get metaText() {
        if (!this.record) {
            return '';
        }
        const scores = SIGNALS.map((s) => num(this.record, s.score)).filter((x) => x !== null);
        const onTrack = scores.filter((x) => x >= 4).length;
        const h = shown(this.record, HEALTH);
        const lead = scores.length ? onTrack + ' of ' + SIGNALS.length + ' on track' : 'Not scored yet';
        return h !== null && h !== undefined && h !== '' ? lead + ' · Timing Health ' + h : lead;
    }

    get overview() {
        const t = this.record ? raw(this.record, OVERVIEW) : null;
        return t ? String(t).trim() : '';
    }

    get hasOverview() {
        return !!this.overview;
    }

    get groups() {
        const r = this.record;
        if (!r) {
            return [];
        }
        return SIGNALS.map((s) => {
            const score = num(r, s.score);
            const detail = raw(r, s.detail);
            const n = score === null ? null : Math.max(0, Math.min(5, Math.round(score)));
            let tone = 'none';
            if (n !== null) {
                tone = n >= 4 ? 'good' : n === 3 ? 'warn' : 'bad';
            }
            const open = Object.prototype.hasOwnProperty.call(this.openState, s.key) ? this.openState[s.key] : false;
            return {
                key: s.key,
                title: s.label,
                question: s.question,
                fieldName: s.field,
                open,
                ariaExpanded: open ? 'true' : 'false',
                verdict: n === null ? 'Not assessed' : n + ' · ' + VERDICT[n],
                verdictClass: 'verdict v-' + tone,
                dots: [1, 2, 3, 4, 5].map((i) => ({ key: s.key + i, cls: n !== null && i <= n ? 'dot on' : 'dot' })),
                detail: detail ? String(detail).trim() : '',
                hasDetail: !!detail,
                ariaLabel: s.label + ': ' + (n === null ? 'not assessed' : n + ' of 5, ' + VERDICT[n])
            };
        });
    }

    handleToggle(event) {
        const key = event.currentTarget.dataset.key;
        const current = !!this.openState[key];
        this.openState = { ...this.openState, [key]: !current };
    }
}