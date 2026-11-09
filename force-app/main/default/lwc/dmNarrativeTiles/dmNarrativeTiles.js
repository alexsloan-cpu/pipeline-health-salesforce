import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { fieldList, shown, pctNumber } from 'c/dmUtil';
import { parseOverview, parseReason, parseRisks } from './parse';

const FIELDS = fieldList([
    'Complete_Milestone_Overview__c',
    'Close_Likelihood_Reason__c',
    'Current_Opportunity_Risks__c',
    'Close_Likelihood_Score__c',
    'Active_Risk_Signal__c',
    'PH_Set__c',
    'Big_Rock_1_Business_Problem__c',
    'Big_Rock_2_Why_Now__c',
    'Big_Rock_3_Current_State__c',
    'Big_Rock_4_Tech_Competition__c',
    'Big_Rock_5_Buying_Process__c'
]);

const VISIBLE_ACTIONS = 2;

// Big rocks: one row per question, in order. Each field starts with Known, Partial or Not yet known.
const BIG_ROCKS = [
    { field: 'Big_Rock_1_Business_Problem__c', title: 'Business problem and value of solving it' },
    { field: 'Big_Rock_2_Why_Now__c', title: 'Why now' },
    { field: 'Big_Rock_3_Current_State__c', title: 'Current state and how they will prove success' },
    { field: 'Big_Rock_4_Tech_Competition__c', title: 'Technology landscape and competition' },
    { field: 'Big_Rock_5_Buying_Process__c', title: 'How they will buy, decision makers, timeline' }
];

function parseRock(text) {
    const t = text === null || text === undefined ? '' : String(text).replace(/\s+/g, ' ').trim();
    if (!t) {
        return { status: 'pending', pill: 'Pending', text: 'Not filled in yet. Fills from call summaries.' };
    }
    const m = t.match(/^(not yet known|known|partial)\s*:\s*(.*)$/i);
    if (!m) {
        return { status: 'pending', pill: 'Pending', text: t };
    }
    const label = m[1].toLowerCase();
    const body = m[2].trim();
    if (label === 'known') {
        return { status: 'known', pill: 'Known', text: body };
    }
    if (label === 'partial') {
        return { status: 'partial', pill: 'Partial', text: body };
    }
    return { status: 'unknown', pill: 'Not yet known', text: body };
}

function withKeys(list, prefix) {
    return list.map((text, i) => ({ key: prefix + i, text }));
}

export default class DmNarrativeTiles extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;
    loaded = false;
    showAll = false;
    brOpen = false;
    ovOpen = true;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data, error }) {
        if (data) {
            this.record = data;
            this.loaded = true;
        } else if (error) {
            // Still render the tiles with their empty states.
            this.record = undefined;
            this.loaded = true;
        }
    }

    val(field) {
        return this.record ? shown(this.record, field) : null;
    }

    get hasRecord() {
        return this.loaded;
    }

    toggleActions() {
        this.showAll = !this.showAll;
    }

    // Milestone overview tile: open by default, header toggles it.
    toggleOverview() {
        this.ovOpen = !this.ovOpen;
    }
    get ovChevron() {
        return this.ovOpen ? '▾' : '▸';
    }
    get ovAria() {
        return this.ovOpen ? 'true' : 'false';
    }

    // Big rocks tile: New Business records only. Collapsed by default, header toggles it.
    toggleBigRocks() {
        this.brOpen = !this.brOpen;
    }
    get brChevron() {
        return this.brOpen ? '▾' : '▸';
    }
    get brAria() {
        return this.brOpen ? 'true' : 'false';
    }
    get showBigRocks() {
        return this.val('PH_Set__c') === 'NB';
    }
    get bigRocks() {
        return BIG_ROCKS.map((r, i) => {
            const p = parseRock(this.val(r.field));
            return {
                key: 'br' + i,
                n: i + 1,
                title: r.title,
                text: p.text,
                status: p.status,
                pillText: p.pill,
                pillClass: 'brpill ' + p.status
            };
        });
    }
    get brCount() {
        const known = this.bigRocks.filter((r) => r.status === 'known').length;
        return known + ' of 5 known';
    }

    // Tile 1
    get overview() {
        return parseOverview(this.val('Complete_Milestone_Overview__c'));
    }
    get hasOverview() {
        return !!this.overview;
    }
    get ovSummary() {
        return this.overview ? this.overview.summary : '';
    }
    get ovStructured() {
        return !!(this.overview && this.overview.structured);
    }
    // Timing sits in the overview when the overview has columns. Otherwise it is a third tile beside Risks.
    get timingAsTile() {
        return !this.ovStructured;
    }
    get rowClass() {
        return this.timingAsTile ? 'row three' : 'row';
    }
    get ovVerdict() {
        return this.overview ? this.overview.verdict : '';
    }
    get ovNeeded() {
        return this.overview ? this.overview.needed : '';
    }
    get ovGaps() {
        return this.overview ? withKeys(this.overview.gaps, 'g') : [];
    }
    get ovActions() {
        const all = this.overview ? this.overview.actions : [];
        const list = this.showAll ? all : all.slice(0, VISIBLE_ACTIONS);
        return list.map((text, i) => ({ key: 'a' + i, n: i + 1, text }));
    }
    get canToggle() {
        return !!(this.overview && this.overview.actions.length > VISIBLE_ACTIONS);
    }
    get toggleLabel() {
        const n = this.overview ? this.overview.actions.length : 0;
        return this.showAll ? 'Show fewer actions' : 'Show all ' + n + ' actions';
    }

    // Tile 2: always shown. No score reads "Not yet scored".
    get reason() {
        return parseReason(this.val('Close_Likelihood_Reason__c'));
    }
    get hasReason() {
        return !!this.reason;
    }
    get reasonSummary() {
        return this.reason ? this.reason.summary : '';
    }
    get pros() {
        return this.reason ? withKeys(this.reason.pros, 'p') : [];
    }
    get cons() {
        return this.reason ? withKeys(this.reason.cons, 'c') : [];
    }
    get hasPros() {
        return this.pros.length > 0;
    }
    get hasCons() {
        return this.cons.length > 0;
    }
    get score() {
        return pctNumber(this.val('Close_Likelihood_Score__c'));
    }
    get hasScore() {
        return this.score !== null && this.score !== undefined;
    }
    get scoreText() {
        return this.hasScore ? String(this.score) : '';
    }
    get scoreClass() {
        const s = this.score;
        return 'score ' + (s >= 70 ? 'good' : s >= 40 ? 'warn' : 'bad');
    }
    get fillClass() {
        const s = this.score;
        return 'fill ' + (s >= 70 ? 'good' : s >= 40 ? 'warn' : 'bad');
    }
    get fillStyle() {
        const s = Math.max(0, Math.min(100, this.score || 0));
        return 'width:' + s + '%';
    }

    // Tile 3: always shown. No risk text reads "No risks".
    get risks() {
        return parseRisks(this.val('Current_Opportunity_Risks__c'));
    }
    get hasRisks() {
        return !!(this.risks && this.risks.items && this.risks.items.length);
    }
    get riskItems() {
        return this.risks
            ? this.risks.items.map((r, i) => ({
                  key: 'r' + i,
                  label: r.label,
                  text: r.text,
                  lines: r.texts.map((t, j) => ({ key: 'r' + i + '-' + j, text: t }))
              }))
            : [];
    }
    get riskBottom() {
        return this.risks ? this.risks.bottom : '';
    }
    get signal() {
        return this.val('Active_Risk_Signal__c') || '';
    }
    get hasSignal() {
        return !!this.signal;
    }
    get signalClass() {
        const s = this.signal.toLowerCase();
        return 'signal ' + (s.indexOf('high') > -1 ? 'bad' : s.indexOf('med') > -1 ? 'warn' : 'good');
    }
    // Only explain a missing reason when there is a score; with no score the tile already says "Not yet scored".
    get noReasonText() {
        return this.hasScore && !this.hasReason;
    }
    get reasonEmptyText() {
        return 'No reason text yet.';
    }
    get noRiskText() {
        return !this.hasRisks && !this.riskBottom;
    }
}