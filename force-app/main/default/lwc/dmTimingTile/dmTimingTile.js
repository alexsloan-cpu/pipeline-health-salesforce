import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { raw, num } from 'c/dmUtil';

const OBJ = 'Deal_Milestones__c.';
const SIGNALS = [
    { key: 'buyer', label: 'Buyer momentum', score: 'Buyer_Momentum_Control_Score__c', detail: 'Buyer_Momentum__c' },
    { key: 'objection', label: 'Objections resolved', score: 'Objection_Resolution_Status_Score__c', detail: 'Objection_Status__c' },
    { key: 'champion', label: 'Champion strength', score: 'Champion_Involvement_Score__c', detail: 'Champion_Involvement__c' },
    { key: 'nextsteps', label: 'Next steps kept', score: 'Clear_Next_Steps_Score__c', detail: 'ClearMissed_NextSteps__c' }
];
const VERDICT = { 5: 'Strong', 4: 'On track', 3: 'Mixed', 2: 'Slipping', 1: 'At risk', 0: 'No evidence' };
const HEALTH = 'Timing_Health_Score__c';
const SUMMARY = 'Deal_Timing_Details__c';
const FIELDS = [HEALTH, SUMMARY].concat(SIGNALS.map((s) => s.score), SIGNALS.map((s) => s.detail)).map((f) => OBJ + f);

const toneOf = (n) => (n === null ? 'none' : n >= 4 ? 'good' : n === 3 ? 'warn' : 'bad');

export default class DmTimingTile extends LightningElement {
    @api recordId;
    @api hideTitle = false;
    record;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get showTitle() {
        return !this.hideTitle;
    }
    get scores() {
        return this.record ? SIGNALS.map((s) => num(this.record, s.score)).filter((x) => x !== null) : [];
    }
    get scored() {
        return this.scores.length > 0;
    }
    get health() {
        return this.record ? num(this.record, HEALTH) : null;
    }
    get hasHealth() {
        return this.health !== null;
    }
    get healthText() {
        return Math.round(this.health) + '%';
    }
    get healthClass() {
        const h = this.health;
        return 'pct ' + (h >= 70 ? 'good' : h >= 40 ? 'warn' : 'bad');
    }
    get onTrackText() {
        return this.scores.filter((x) => x >= 4).length + ' of ' + SIGNALS.length + ' on track';
    }
    get rows() {
        const r = this.record;
        if (!r) {
            return [];
        }
        return SIGNALS.map((s) => {
            const v = num(r, s.score);
            const n = v === null ? null : Math.max(0, Math.min(5, Math.round(v)));
            const tone = toneOf(n);
            const d = raw(r, s.detail);
            return {
                key: s.key,
                label: s.label,
                verdict: n === null ? 'Not assessed' : VERDICT[n],
                verdictClass: 'v ' + tone,
                bars: [1, 2, 3, 4, 5].map((i) => ({ key: s.key + i, cls: n !== null && i <= n ? 'on ' + tone : '' })),
                detail: d ? String(d).trim() : 'No details recorded.'
            };
        });
    }
    get summary() {
        const t = this.record ? raw(this.record, SUMMARY) : null;
        const s = t ? String(t).trim() : '';
        return /^not enough information/i.test(s) ? '' : s;
    }
}