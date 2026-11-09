import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import { stageFields, buildStages, val, relVal } from 'c/dmStages';
import { raw, num, shown } from 'c/dmUtil';
import getActivity from '@salesforce/apex/DmOppActivityController.getActivity';
import getAccountActivity from '@salesforce/apex/DmOppActivityController.getAccountActivity';
import { usContact } from 'c/dmUsageView';

const EXTRA = [
    'Suggested_Next_Step__c',
    'Opportunity__r.Next_Step__c',
    'Opportunity__r.Next_Step_Date__c',
    'Account__c',
    'Opportunity__c',
    'Opportunity_Close_Date__c',
    'ACV_change__c',
    'Opportunity__r.OwnerId',
    'Opportunity__r.Owner.Name',
    'Number_of_Momentum_Calls__c',
    'Opportunity_Created_Date__c',
    'Opportunity_Stage__c',
    'Account__r.Name',
    'Opportunity__r.Name',
    'PH_Set__c',
    'Opportunity__r.Opportunity_Subtype__c',
    'Opportunity__r.Partner_Sourced__r.Name',
    'Opportunity__r.Partner_Sourced_Uplift__r.Name',
    'Opportunity__r.Partner_Assist__r.Name',
    'Opportunity__r.Additional_Partner_Assists__c'
];

function clip(t, n) {
    const s = String(t).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 3) + '...' : s;
}

// Whole days between two YYYY-MM-DD dates. Null when either is missing or invalid.
function daysBetween(fromIso, toIso) {
    const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(fromIso || '');
    const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(toIso || '');
    if (!a || !b) {
        return null;
    }
    const d = Math.round((Date.UTC(+b[1], +b[2] - 1, +b[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86400000);
    return d < 0 ? null : d;
}

function todayIso() {
    const t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

export default class DmHeaderStrip extends NavigationMixin(LightningElement) {
    @api recordId;
    @api layout = 'newBusiness';
    record;
    act;
    acct;
    usage;
    showAll = false;

    get fields() {
        return stageFields(this.layout, EXTRA);
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: '$fields' })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    // Facts row: the five fields the highlights panel used to show, in one line.
    get facts() {
        const r = this.record;
        if (!r) {
            return [];
        }
        const out = [];
        const add = (key, label, text, id) => {
            if (text !== null && text !== undefined && text !== '') {
                out.push({ key, label, text, id: id || '', isLink: !!id });
            }
        };
        add('acct', 'Account', relVal(r, 'Account__r.Name') || shown(r, 'Account__c'), raw(r, 'Account__c'));
        add('opp', 'Opportunity', relVal(r, 'Opportunity__r.Name') || shown(r, 'Opportunity__c'), raw(r, 'Opportunity__c'));
        add('close', 'Close', shown(r, 'Opportunity_Close_Date__c'));
        const acv = num(r, 'ACV_change__c');
        add('acv', 'ACV', acv === null ? null : '$' + acv.toLocaleString('en-US', { maximumFractionDigits: 0 }));
        add('owner', 'Owner', relVal(r, 'Opportunity__r.Owner.Name'), relVal(r, 'Opportunity__r.OwnerId'));
        const calls = num(r, 'Number_of_Momentum_Calls__c');
        add('calls', '# of Momentum calls', calls === null ? null : String(calls));
        // Deal age: days since the opportunity was created. Closed deals stop at the close date.
        const created = raw(r, 'Opportunity_Created_Date__c');
        const closed = /^closed/i.test(String(val(r, 'Opportunity_Stage__c') || '').replace(/^\d+\.\s*/, ''));
        const end = closed ? raw(r, 'Opportunity_Close_Date__c') : todayIso();
        const age = daysBetween(created, end);
        add('age', 'Deal age', age === null ? null : age + (age === 1 ? ' day' : ' days'));
        return out;
    }

    @wire(getActivity, { recordId: '$recordId' })
    wiredAct({ data }) {
        if (data) {
            this.act = data;
        }
    }
    @wire(getAccountActivity, { recordId: '$recordId' })
    wiredAcct({ data }) {
        if (data) {
            this.acct = data;
        }
    }

    get usagePill() {
        const u = this.usage;
        if (!u || !u.status || !this.record || val(this.record, 'PH_Set__c') === 'NB') {
            return null;
        }
        const t = { Over: 'bad', Approaching: 'warn', Underused: 'warn', Healthy: 'good' }[u.status] || 'none';
        return { text: 'Usage: ' + u.status, cls: 'pill ' + t };
    }

    get contactPill() {
        const r = this.record;
        const isNB = r && val(r, 'PH_Set__c') === 'NB';
        if (!r || !this.act || (!isNB && !this.acct)) {
            return null;
        }
        const c = usContact({ isNB, rt: this.usage ? this.usage.rt : '', act: this.act, acct: this.acct });
        return { text: 'Contact: ' + c.band + (c.days === null ? '' : ', ' + c.days + 'd'), cls: 'pill ' + c.tone };
    }

    // Partner tag: sourced wins over assisted. Additional assists count toward the +N.
    get partner() {
        const r = this.record;
        if (!r) {
            return null;
        }
        const sourced = [relVal(r, 'Opportunity__r.Partner_Sourced__r.Name'), relVal(r, 'Opportunity__r.Partner_Sourced_Uplift__r.Name')].filter(Boolean);
        const more = String(relVal(r, 'Opportunity__r.Additional_Partner_Assists__c') || '').split(/[,;]/).map((x) => x.trim()).filter(Boolean);
        const assist = [relVal(r, 'Opportunity__r.Partner_Assist__r.Name')].filter(Boolean).concat(more);
        if (sourced.length) {
            return { text: 'Partner sourced: ' + sourced[0] + (assist.length ? ' +' + assist.length + ' assist' : ''), cls: 'pill good' };
        }
        if (assist.length) {
            return { text: 'Partner assisted: ' + assist[0] + (assist.length > 1 ? ' +' + (assist.length - 1) : ''), cls: 'pill info' };
        }
        return { text: 'Partner: None tagged', cls: 'pill none' };
    }

    get hasFacts() {
        return this.facts.length > 0;
    }

    handleFact(e) {
        e.preventDefault();
        const id = e.currentTarget.dataset.id;
        if (id) {
            this[NavigationMixin.Navigate]({ type: 'standard__recordPage', attributes: { recordId: id, actionName: 'view' } });
        }
    }

    // Same order as the Next best actions list: suggested from calls, then the owner's next step, then the weakest open milestone.
    get step() {
        const r = this.record;
        if (!r) {
            return '';
        }
        const sug = val(r, 'Suggested_Next_Step__c');
        if (sug) {
            return clip(sug, 220);
        }
        const own = relVal(r, 'Opportunity__r.Next_Step__c');
        if (own) {
            return clip(own, 220);
        }
        const m = buildStages(r, this.layout);
        const cur = m.stages.find((s) => s.isCurrent);
        let open = cur ? cur.items.filter((x) => !x.done) : [];
        if (!open.length) {
            // Current stage is complete or unknown: use the earliest stage that still has open milestones.
            const early = m.stages.find((s) => s.items.some((x) => !x.done));
            open = early ? early.items.filter((x) => !x.done) : [];
        }
        if (open.length) {
            open.sort((a, b) => (a.score === null ? -1 : a.score / a.max) - (b.score === null ? -1 : b.score / b.max));
            return 'Close the gap on ' + open[0].label;
        }
        return '';
    }

    get hasStep() {
        return !!this.step;
    }

    get stepText() {
        return this.record ? (this.step || 'No open next step right now.') : 'Loading';
    }

    get allLabel() {
        return this.showAll ? 'Hide actions' : 'All actions';
    }

    handleToggle() {
        this.showAll = !this.showAll;
    }
}