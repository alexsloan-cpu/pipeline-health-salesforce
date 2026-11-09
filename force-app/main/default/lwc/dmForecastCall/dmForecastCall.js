import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { stageFields, buildStages, val, shownVal, numVal, relVal, fmtMoney, evidenceCategory } from 'c/dmStages';

const DM = [
    'Opportunity__c',
    'Forecast_Category__c',
    'Close_Likelihood_Score__c',
    'Close_Likelihood_Reason__c',
    'Close_Confidence_Details_Short__c',
    'ACV_change__c',
    'Opportunity_Close_Date__c',
    'Active_Risk_Signal__c',
    'Current_Opportunity_Risks__c',
    'Confidence_Score_Last_Updated__c',
    'Opportunity__r.ForecastCategory__c',
    'Opportunity__r.Close_Date_Push_Counter__c',
    'Opportunity__r.Days_in_Stage__c',
    'Opportunity__r.Amount'
];

const RANK = { Omit: 0, Pipeline: 1, 'Best Case': 2, Commit: 3, Closed: 4 };

export default class DmForecastCall extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;

    get fields() {
        return stageFields(this.layout, DM);
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

    get oppId() {
        return this.record ? val(this.record, 'Opportunity__c') : null;
    }

    get conf() {
        return this.record ? numVal(this.record, 'Close_Likelihood_Score__c') : null;
    }

    get ownerCat() {
        if (!this.record) {
            return null;
        }
        return relVal(this.record, 'Opportunity__r.ForecastCategory__c') || shownVal(this.record, 'Forecast_Category__c');
    }

    get evidenceCat() {
        return evidenceCategory(this.conf);
    }

    get ownerCatText() {
        return this.ownerCat || 'Not set';
    }

    get evidenceCatText() {
        return this.evidenceCat || 'No score yet';
    }

    get callVerdict() {
        const a = RANK[this.ownerCat];
        const b = RANK[this.evidenceCat];
        if (a === undefined || b === undefined) {
            return { text: 'Not enough to compare yet.', cls: 'small' };
        }
        if (a > b) {
            return { text: 'The call is ahead of the evidence.', cls: 'small bad strong' };
        }
        if (a < b) {
            return { text: 'The evidence supports more than the call.', cls: 'small good strong' };
        }
        return { text: 'The call matches the evidence.', cls: 'small good strong' };
    }

    get reason() {
        if (!this.record) {
            return '';
        }
        const r = val(this.record, 'Close_Confidence_Details_Short__c') || val(this.record, 'Close_Likelihood_Reason__c');
        const t = r ? String(r).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        return t.length > 220 ? t.slice(0, 217) + '...' : t;
    }

    get amount() {
        if (!this.record) {
            return null;
        }
        const a = numVal(this.record, 'ACV_change__c');
        return a !== null ? a : relVal(this.record, 'Opportunity__r.Amount');
    }

    get amountText() {
        return fmtMoney(this.amount);
    }

    get weightedText() {
        if (this.amount === null || this.conf === null) {
            return '';
        }
        return '/ ' + fmtMoney(Math.round((this.amount * this.conf) / 100));
    }

    get confText() {
        return this.conf === null ? 'No Close Confidence yet' : 'Weighted by ' + Math.round(this.conf) + '% Close Confidence';
    }

    get closeText() {
        return this.record ? shownVal(this.record, 'Opportunity_Close_Date__c') || '–' : '–';
    }

    get daysText() {
        const d = this.record ? val(this.record, 'Opportunity_Close_Date__c') : null;
        if (!d) {
            return '';
        }
        const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) {
            return '';
        }
        const close = Date.UTC(+m[1], +m[2] - 1, +m[3]);
        const now = new Date();
        const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const days = Math.round((close - today) / 86400000);
        return days >= 0 ? '· ' + days + ' days' : '· ' + Math.abs(days) + ' days overdue';
    }

    get pushText() {
        const p = this.record ? relVal(this.record, 'Opportunity__r.Close_Date_Push_Counter__c') : null;
        if (p === null || p === undefined) {
            return { text: 'Push count not available', cls: 'small' };
        }
        const n = Number(p);
        return n > 0 ? { text: 'Pushed ' + n + (n === 1 ? ' time' : ' times'), cls: 'small warn strong' } : { text: 'No pushes', cls: 'small good strong' };
    }

    get riskText() {
        return this.record ? shownVal(this.record, 'Active_Risk_Signal__c') || 'Not assessed' : 'Not assessed';
    }

    get riskClass() {
        const r = String(this.riskText).toLowerCase();
        const tone = r.indexOf('high') >= 0 ? 'bad' : r.indexOf('medium') >= 0 ? 'warn' : r.indexOf('low') >= 0 ? 'good' : 'none';
        return 'pill pill-' + tone;
    }

    get riskDetail() {
        return this.record ? val(this.record, 'Current_Opportunity_Risks__c') || '' : '';
    }

    get daysInStage() {
        const d = this.record ? relVal(this.record, 'Opportunity__r.Days_in_Stage__c') : null;
        return d === null || d === undefined ? '' : Math.round(Number(d)) + ' days in stage';
    }

    get gapTitle() {
        return this.ownerCat === 'Commit' ? 'To hold Commit' : 'To move up';
    }

    // The stage whose open milestones are listed: the current stage, else the first stage with open work.
    get gapStage() {
        if (!this.record) {
            return null;
        }
        const m = buildStages(this.record, this.layout);
        return m.stages.find((s) => s.isCurrent) || m.stages.find((s) => s.open > 0) || null;
    }

    get gapHint() {
        const st = this.gapStage;
        if (!st) {
            return '';
        }
        return 'Open ' + st.name + ' milestones. Each line shows the score today and the score that completes it.';
    }

    // Open milestones in the current stage, the concrete work behind the call.
    // Wording matches the Cockpit pills: a milestone completes at full marks, so "2 of 3 today, needs 3".
    get gaps() {
        const st = this.gapStage;
        if (!st) {
            return [];
        }
        return st.items
            .filter((x) => !x.done)
            .slice(0, 3)
            .map((x, i) => {
                const now = x.score === null ? 'not assessed' : x.score + ' of ' + x.max + ' today';
                return { key: x.key, text: i + 1 + '. ' + x.label + ': ' + now + ', needs ' + x.max };
            });
    }

    get hasGaps() {
        return this.gaps.length > 0;
    }

    get updatedText() {
        const u = this.record ? shownVal(this.record, 'Confidence_Score_Last_Updated__c') : null;
        return u ? 'Close Confidence updated ' + u : 'From Close Confidence and milestone scores';
    }
}