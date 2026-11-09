import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getActivity from '@salesforce/apex/DmOppActivityController.getActivity';
import getAccountActivity from '@salesforce/apex/DmOppActivityController.getAccountActivity';
import { contactHtml } from 'c/dmUsageView';

const FIELDS = [
    'Deal_Milestones__c.PH_Set__c',
    'Deal_Milestones__c.Opportunity_Stage__c',
    'Deal_Milestones__c.Opportunity__r.Owner.Name',
    'Deal_Milestones__c.Opportunity__r.Opportunity_Subtype__c'
];

export default class DmContact extends LightningElement {
    @api recordId;
    rec;
    act;
    acct;
    usage;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRec({ data }) {
        if (data) {
            this.rec = data;
            this.paint();
        }
    }
    @wire(getActivity, { recordId: '$recordId' })
    wiredAct({ data }) {
        if (data) {
            this.act = data;
            this.paint();
        }
    }
    @wire(getAccountActivity, { recordId: '$recordId' })
    wiredAcct({ data }) {
        if (data) {
            this.acct = data;
            this.paint();
        }
    }

    renderedCallback() {
        this.paint();
    }

    paint() {
        const el = this.template.querySelector('.root');
        if (!el || !this.rec || !this.act) {
            return;
        }
        const f = this.rec.fields;
        const opp = f.Opportunity__r && f.Opportunity__r.value ? f.Opportunity__r.value.fields : {};
        const owner = opp.Owner && opp.Owner.value ? opp.Owner.value.fields.Name.value : '';
        const sub = opp.Opportunity_Subtype__c ? opp.Opportunity_Subtype__c.value : '';
        const isNB = f.PH_Set__c.value === 'NB';
        if (!isNB && !this.acct) {
            return;
        }
        const u = this.usage;
        const html = contactHtml({
            isNB,
            rt: u ? u.rt : '',
            combo: /Additional Product \+ Increase Usage/.test(sub || ''),
            act: this.act,
            acct: this.acct,
            ownerName: owner,
            stage: f.Opportunity_Stage__c.value,
            support: u && u.tickets != null ? { n: u.tickets, o: u.openTickets, h: u.highTickets } : null
        });
        if (el.dataset.v !== html) {
            el.innerHTML = html;
            el.dataset.v = html;
        }
    }
}