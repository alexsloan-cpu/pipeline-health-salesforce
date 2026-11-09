import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRollup from '@salesforce/apex/DmRollupController.getRollup';
import { stageName, stageLabel } from 'c/dmStages';

const FILTERS = ['All', 'Strong', 'Watch', 'At risk'];

// Same cut points as the Update Forecast hint (70 Commit, 45 Best Case). Uncalibrated, so shown as a signal.
function band(conf) {
    if (conf === null || conf === undefined) {
        return 'Not scored';
    }
    return conf >= 70 ? 'Strong' : conf >= 45 ? 'Watch' : 'At risk';
}

function money(v) {
    if (v === null || v === undefined) {
        return '–';
    }
    return v >= 1000 ? '$' + Math.round(v / 1000) + 'K' : '$' + Math.round(v);
}

export default class DmPipelineRollup extends NavigationMixin(LightningElement) {
    scope = 'mine';
    filter = 'All';
    loading = true;
    error;
    hasTeam = false;
    teamSize = 0;
    userName = '';
    rows = [];
    openReps = {};
    openDeals = {};

    connectedCallback() {
        this.load();
    }

    async load() {
        this.loading = true;
        this.error = undefined;
        try {
            const r = await getRollup({ scope: this.scope });
            this.rows = r.rows || [];
            this.hasTeam = r.hasTeam;
            this.teamSize = r.teamSize;
            this.userName = r.userName;
            this.scope = r.scope;
        } catch (e) {
            this.error = (e && e.body && e.body.message) || 'Could not load your pipeline. Refresh and try again.';
            this.rows = [];
        }
        this.loading = false;
    }

    get isTeam() {
        return this.scope === 'team';
    }
    get title() {
        return this.isTeam ? 'Team deal health' : 'My deal health';
    }
    get subtitle() {
        return this.isTeam ? this.teamSize + ' reps' : this.userName;
    }
    get scopeOptions() {
        return [
            { label: 'My deals', value: 'mine' },
            { label: 'My team', value: 'team' }
        ];
    }
    get filterButtons() {
        return FILTERS.map((f) => ({
            label: f,
            variant: f === this.filter ? 'brand' : 'neutral'
        }));
    }
    get empty() {
        return !this.loading && !this.error && this.rows.length === 0;
    }
    get metrics() {
        let total = 0;
        let weighted = 0;
        let risk = 0;
        this.rows.forEach((r) => {
            total += r.amount || 0;
            weighted += ((r.amount || 0) * (r.confidence || 0)) / 100;
            if (band(r.confidence) === 'At risk') {
                risk += 1;
            }
        });
        return [
            { key: 'n', label: 'Open deals', value: String(this.rows.length) },
            { key: 'w', label: 'Weighted amount', value: money(weighted) },
            { key: 't', label: 'Total amount', value: money(total) },
            { key: 'r', label: 'At risk', value: String(risk) }
        ];
    }

    deal(r) {
        const b = band(r.confidence);
        const stageNum = r.stage && /^\d/.test(r.stage) ? parseInt(r.stage.charAt(0), 10) : null;
        const segs = [];
        for (let i = 0; i <= 5; i++) {
            segs.push({ key: 's' + i, cls: stageNum !== null && i <= stageNum ? 'seg seg-on' : 'seg' });
        }
        const open = !!this.openDeals[r.recordId];
        return {
            id: r.recordId,
            name: r.oppName || 'Opportunity',
            sub: (r.recordType || '') + (r.closeDate ? ' | Close ' + r.closeDate : ''),
            amount: money(r.amount),
            band: b,
            chip: b + (r.confidence !== null && r.confidence !== undefined ? ' ' + Math.round(r.confidence) : ''),
            chipClass: 'chip chip-' + b.replace(' ', '').toLowerCase(),
            segs,
            open,
            detail: (stageNum !== null ? stageName(stageNum) : stageLabel(r.stage)) +
                (r.total ? ' | ' + (r.done || 0) + ' of ' + r.total + ' milestones complete' : '')
        };
    }

    get groups() {
        const keep = this.rows.filter((r) => this.filter === 'All' || band(r.confidence) === this.filter);
        if (!this.isTeam) {
            return keep.length ? [{ key: 'me', header: false, expanded: true, deals: keep.map((r) => this.deal(r)) }] : [];
        }
        const byRep = new Map();
        this.rows.forEach((r) => {
            const k = r.ownerId || 'none';
            if (!byRep.has(k)) {
                byRep.set(k, { name: r.ownerName || 'Unassigned', all: [], shown: [] });
            }
            byRep.get(k).all.push(r);
        });
        keep.forEach((r) => byRep.get(r.ownerId || 'none').shown.push(r));
        const out = [];
        byRep.forEach((v, k) => {
            if (!v.shown.length) {
                return;
            }
            let w = 0;
            let risk = 0;
            let sum = 0;
            v.all.forEach((r) => {
                w += ((r.amount || 0) * (r.confidence || 0)) / 100;
                sum += r.confidence || 0;
                if (band(r.confidence) === 'At risk') {
                    risk += 1;
                }
            });
            const avg = Math.round(sum / v.all.length);
            const bnd = band(avg);
            const expanded = !!this.openReps[k];
            out.push({
                key: k,
                header: true,
                name: v.name,
                expanded,
                icon: expanded ? 'utility:chevrondown' : 'utility:chevronright',
                summary: v.all.length + ' deals | ' + risk + ' at risk | ' + money(w) + ' weighted',
                avg: 'Avg ' + avg,
                avgClass: 'chip chip-' + bnd.replace(' ', '').toLowerCase(),
                deals: expanded ? v.shown.map((r) => this.deal(r)) : []
            });
        });
        return out;
    }

    handleScope(e) {
        this.scope = e.detail.value;
        this.openReps = {};
        this.openDeals = {};
        this.load();
    }
    handleFilter(e) {
        this.filter = e.currentTarget.dataset.label;
    }
    toggleRep(e) {
        const k = e.currentTarget.dataset.key;
        this.openReps = { ...this.openReps, [k]: !this.openReps[k] };
    }
    toggleDeal(e) {
        const k = e.currentTarget.dataset.id;
        this.openDeals = { ...this.openDeals, [k]: !this.openDeals[k] };
    }
    openRecord(e) {
        e.stopPropagation();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: e.currentTarget.dataset.id, objectApiName: 'Deal_Milestones__c', actionName: 'view' }
        });
    }
}