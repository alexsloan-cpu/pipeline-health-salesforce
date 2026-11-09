import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getOverlap from '@salesforce/apex/PhPartnerOverlapController.getOverlap';
import { relVal } from 'c/dmStages';

const FIELDS = [
    'Deal_Milestones__c.Opportunity__r.Partner_Sourced__r.Name',
    'Deal_Milestones__c.Opportunity__r.Partner_Sourced_Uplift__r.Name',
    'Deal_Milestones__c.Opportunity__r.Partner_Assist__r.Name',
    'Deal_Milestones__c.Opportunity__r.Additional_Partner_Assists__c',
    'Deal_Milestones__c.Opportunity__r.Partner_Manager__r.Name',
    'Deal_Milestones__c.Opportunity__r.Assisted_Partner_Manager__r.Name'
];

// First meaningful word, so "Snowflake" matches "Snowflake (partner)".
function norm(x) {
    return String(x || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, '')
        .replace(/\b(inc|llc|ltd|partner|amer|us|emea|the)\b/g, '').trim().split(/\s+/)[0];
}
function fmt(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? Number(m[2]) + '/' + Number(m[3]) + '/' + m[1] : '';
}

export default class DmPartnerOverlap extends LightningElement {
    @api recordId;
    record;
    list = [];
    loaded = false;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    @wire(getOverlap, { recordId: '$recordId' })
    wiredOverlap({ data, error }) {
        if (data) {
            this.list = data;
            this.loaded = true;
        } else if (error) {
            this.list = [];
            this.loaded = true;
        }
    }

    get sourced() {
        const r = this.record;
        return r ? [relVal(r, 'Opportunity__r.Partner_Sourced__r.Name'), relVal(r, 'Opportunity__r.Partner_Sourced_Uplift__r.Name')].filter(Boolean) : [];
    }
    get assisted() {
        const r = this.record;
        if (!r) {
            return [];
        }
        const more = String(relVal(r, 'Opportunity__r.Additional_Partner_Assists__c') || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
        return [relVal(r, 'Opportunity__r.Partner_Assist__r.Name')].filter(Boolean).concat(more);
    }
    get chips() {
        return this.sourced.map((n, i) => ({ key: 's' + i, cls: 'chip s', kind: 'Sourced', name: n }))
            .concat(this.assisted.map((n, i) => ({ key: 'a' + i, cls: 'chip a', kind: 'Assisted', name: n })));
    }
    get hasChips() {
        return this.chips.length > 0;
    }
    get managers() {
        const r = this.record;
        if (!r) {
            return '';
        }
        const a = relVal(r, 'Opportunity__r.Partner_Manager__r.Name');
        const b = relVal(r, 'Opportunity__r.Assisted_Partner_Manager__r.Name');
        return [a ? 'Sourced partner manager: ' + a : '', b ? 'Assisted partner manager: ' + b : ''].filter(Boolean).join('  ·  ');
    }
    get rows() {
        const tag = {};
        this.sourced.forEach((n) => { tag[norm(n)] = 'Sourced'; });
        this.assisted.forEach((n) => { if (!tag[norm(n)]) { tag[norm(n)] = 'Assisted'; } });
        return this.list.map((p) => {
            const t = tag[norm(p.name)];
            return {
                key: p.name, name: p.name, type: p.partnerType, customer: p.customer, openOpp: p.openOpp,
                rep: p.rep, repTitle: p.repTitle, tagged: !!t, tagText: t, tagCls: t === 'Sourced' ? 'chip s' : 'chip a',
                changed: fmt(p.lastChange)
            };
        });
    }
    get hasRows() {
        return this.list.length > 0;
    }
    get totalText() {
        return this.list.length + (this.list.length === 1 ? ' partner' : ' partners');
    }
    get openCount() {
        return this.list.filter((p) => p.openOpp).length;
    }
    get customerCount() {
        return this.list.filter((p) => p.customer).length;
    }
}