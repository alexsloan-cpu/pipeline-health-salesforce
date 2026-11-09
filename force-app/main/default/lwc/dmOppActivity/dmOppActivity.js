import { LightningElement, api, wire } from 'lwc';
import getActivity from '@salesforce/apex/DmOppActivityController.getActivity';
import getAccountActivity from '@salesforce/apex/DmOppActivityController.getAccountActivity';

const KIND_LABEL = {
    meeting: 'Meeting',
    momentum: 'Momentum call',
    call: 'Call',
    emailIn: 'Email received',
    emailOut: 'Email sent',
    other: 'Other'
};
const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'calls', label: 'Calls' },
    { id: 'emails', label: 'Emails' },
    { id: 'other', label: 'Other' }
];
const FILTER_KINDS = {
    meetings: ['meeting'],
    calls: ['call', 'momentum'],
    emails: ['emailIn', 'emailOut'],
    other: ['other']
};

function fmt(iso) {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default class DmOppActivity extends LightningElement {
    @api recordId;
    open = true;
    scope = 'opp';
    acctData;
    filter = 'all';
    data;
    error;
    loaded = false;

    @wire(getActivity, { recordId: '$recordId' })
    wired({ data, error }) {
        if (data) {
            this.data = data;
            this.error = undefined;
            this.loaded = true;
        } else if (error) {
            this.error = (error.body && error.body.message) || 'Could not load activity.';
            this.loaded = true;
        }
    }

    @wire(getAccountActivity, { recordId: '$recordId' })
    wiredAcct({ data }) {
        if (data) {
            this.acctData = data;
        }
    }

    get cur() { return this.scope === 'acct' && this.acctData ? this.acctData : this.data; }
    get titleText() { return this.scope === 'acct' ? 'Account Activity' : 'Opp Activity'; }
    get oppPressed() { return this.scope === 'opp' ? 'true' : 'false'; }
    get acctPressed() { return this.scope === 'acct' ? 'true' : 'false'; }
    pickOpp() { this.scope = 'opp'; }
    pickAcct() { this.scope = 'acct'; }

    get caret() { return this.open ? '▾' : '▸'; }
    get hasData() { return this.cur && this.cur.hasOpp; }
    get noOpp() { return this.loaded && !this.error && !this.hasData; }

    get summary() {
        const d = this.cur;
        if (!d || !d.hasOpp) return '';
        const parts = [d.last8Weeks + ' activities in 8 weeks'];
        parts.push('last meeting ' + (fmt(d.lastMeeting) || 'none logged'));
        parts.push(d.contactsTouched + ' of ' + d.contactsTotal + ' contacts touched');
        return parts.join(' · ');
    }

    get tiles() {
        const d = this.cur;
        return [
            { key: 'm', label: 'Last meeting', value: fmt(d.lastMeeting) || 'None logged' },
            { key: 'c', label: 'Last Momentum call', value: fmt(d.lastMomentum) || 'None logged' },
            { key: 'r', label: 'Last email received', value: fmt(d.lastEmailIn) || 'None logged' },
            { key: 's', label: 'Last email sent', value: fmt(d.lastEmailOut) || 'None logged' },
            { key: 't', label: 'Contacts touched', value: d.contactsTouched + ' of ' + d.contactsTotal },
            { key: 'w', label: 'Last 8 weeks', value: String(d.last8Weeks) }
        ];
    }

    get bars() {
        const weeks = this.cur.weeks || [];
        const totals = weeks.map((w) => w.meetings + w.calls + w.emails + w.other);
        const max = Math.max(1, ...totals);
        return weeks.map((w, i) => {
            const seg = (n, cls) => ({ cls, style: 'height:' + (n / max) * 100 + '%', show: n > 0 });
            return {
                key: w.label,
                label: fmt(w.label).replace(/, \d{4}$/, ''),
                total: totals[i],
                title: totals[i] + ' activities: ' + w.meetings + ' meetings, ' + w.calls + ' calls, ' + w.emails + ' emails, ' + w.other + ' other',
                segs: [
                    { key: 'o', ...seg(w.other, 'seg other') },
                    { key: 'e', ...seg(w.emails, 'seg email') },
                    { key: 'c', ...seg(w.calls, 'seg call') },
                    { key: 'm', ...seg(w.meetings, 'seg meet') }
                ].filter((s) => s.show)
            };
        });
    }

    get chips() {
        return FILTERS.map((f) => ({
            ...f,
            cls: 'chip' + (this.filter === f.id ? ' on' : ''),
            pressed: String(this.filter === f.id)
        }));
    }

    get rows() {
        const kinds = FILTER_KINDS[this.filter];
        return (this.cur.timeline || [])
            .filter((t) => !kinds || kinds.includes(t.kind))
            .map((t) => ({
                ...t,
                dayLabel: fmt(t.day),
                kindLabel: KIND_LABEL[t.kind] || 'Other',
                dotCls: 'dot ' + t.kind
            }));
    }
    get hasRows() { return this.rows.length > 0; }

    get people() {
        return (this.cur.people || []).map((p) => ({
            ...p,
            titleText: p.title || 'No title in the record',
            levelText: p.level,
            lastText: p.lastTouch ? fmt(p.lastTouch) : null,
            touchText: p.touches > 0 ? p.touches + (p.touches === 1 ? ' touch' : ' touches') : 'No touch logged',
            touchCls: p.touches > 0 ? 'touch' : 'touch none',
            link: '/' + p.id,
            tagList: p.tags.map((t, i) => ({ key: i, label: t })),
            hasTags: p.tags.length > 0,
            notIdentified: !p.identified
        }));
    }
    get hasPeople() { return this.people.length > 0; }
    get roleFields() { return (this.cur.roleFields || []).map((f, i) => ({ ...f, key: i })); }
    get hasRoleFields() { return this.roleFields.length > 0; }

    toggle() { this.open = !this.open; }
    pick(e) { this.filter = e.currentTarget.dataset.id; }
}