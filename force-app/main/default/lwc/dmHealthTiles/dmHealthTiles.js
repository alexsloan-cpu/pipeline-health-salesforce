import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { LAYOUTS } from 'c/dmConfig';
import { stageName } from 'c/dmStages';
import { shown, raw, num, pctNumber, toneOf, cleanHealth, toneFromPercent, fieldList, stageFieldNames, currentStage } from 'c/dmUtil';

const TILE_FIELDS = fieldList(
    [
        'Close_Likelihood_Score__c',
        'Close_Confidence_Change__c',
        'Close_Likelihood_Reason__c',
        'Close_Confidence_Details_Short__c',
        'Overall_Health__c',
        'Opportunity_Health_Score__c',
        'Prior_Health_Score__c',
        'Health_Category__c',
        'Total_Milestones_Completed__c',
        'Total_Milestones_Completed_Current_Stage__c',
        'Total_Available_Milestones_Current_Stage__c',
        'PH_Done_Through_Stage__c',
        'PH_S0_Done__c',
        'PH_S0_Total__c',
        'PH_S1_Done__c',
        'PH_S1_Total__c',
        'PH_S2_Done__c',
        'PH_S2_Total__c',
        'PH_S3_Done__c',
        'PH_S3_Total__c',
        'PH_S4_Done__c',
        'PH_S4_Total__c',
        'PH_S5_Done__c',
        'PH_S5_Total__c',
        'Active_Risk_Signal__c',
        'Current_Opportunity_Risks__c',
        'Suggested_Next_Step__c',
        'Confidence_Score_Last_Updated__c',
        'Opportunity_Close_Date__c',
        'Timing_Health_Score__c'
    ].concat(stageFieldNames())
);

const STALE_DAYS = 14;
const MAX_OPEN = 8;

function truncate(text, max) {
    if (!text) {
        return '';
    }
    return text.length > max ? text.substring(0, max - 1).trim() + '…' : text;
}

function daysSince(value) {
    if (!value) {
        return null;
    }
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 86400000);
}

function kv(label, value, tone) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return { key: label, label, value: String(value), cls: 'v v-' + (tone || 'none') };
}

function block(label, text) {
    return text ? { key: label, label, text } : null;
}

export default class DmHealthTiles extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;
    failed = false;
    openKey = null;

    get config() {
        return LAYOUTS[this.layout] || LAYOUTS.newBusiness;
    }

    get fieldNames() {
        const seen = {};
        return TILE_FIELDS.concat(this.config.fields).filter((f) => {
            if (seen[f]) {
                return false;
            }
            seen[f] = true;
            return true;
        });
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: '$fieldNames' })
    wiredRecord({ data, error }) {
        if (data) {
            this.record = data;
            this.failed = false;
        } else if (error) {
            this.record = undefined;
            this.failed = true;
        }
    }

    get hasRecord() {
        return !!this.record;
    }

    get updatedText() {
        const d = shown(this.record, 'Confidence_Score_Last_Updated__c');
        return d ? 'Confidence score updated ' + d : '';
    }

    get tiles() {
        const r = this.record;
        if (!r) {
            return [];
        }

        // 1. Close confidence score with movement since the last update
        const conf = shown(r, 'Close_Likelihood_Score__c');
        const confNum = pctNumber(conf);
        const change = pctNumber(shown(r, 'Close_Confidence_Change__c'));
        let confSub = '';
        let confSubTone = 'none';
        if (change !== null && change > 0) {
            confSub = '▲ Up ' + Math.abs(change) + ' pts since last update';
            confSubTone = 'good';
        } else if (change !== null && change < 0) {
            confSub = '▼ Down ' + Math.abs(change) + ' pts since last update';
            confSubTone = 'bad';
        } else if (change === 0) {
            confSub = 'No change since last update';
        }

        // 2. Close health, text with a leading status dot
        const health = cleanHealth(shown(r, 'Overall_Health__c'));
        const healthTone = toneOf(shown(r, 'Overall_Health__c'));

        // 3. Key milestone completion with a progress bar
        const comp = shown(r, 'Opportunity_Health_Score__c');
        const compNum = pctNumber(comp);
        const phDone = num(r, 'PH_Done_Through_Stage__c');
        const done = phDone !== null ? phDone : num(r, 'Total_Milestones_Completed__c');

        // 4. Active risk signal
        const signal = raw(r, 'Active_Risk_Signal__c');
        const signalTone = signal === 'High' ? 'bad' : signal === 'Medium' ? 'warn' : signal === 'Low' ? 'good' : 'none';

        return [
            this.tile('conf', 'Close Confidence Score', conf || '–', confSub, confSubTone, toneFromPercent(confNum), null),
            this.tile('health', 'Opportunity Close Health', health.label || '–', health.detail ? 'Score ' + health.detail : '', 'none', healthTone, null),
            this.tile(
                'comp',
                'Key Milestone Completion',
                comp || '–',
                done !== null ? done + (done === 1 ? ' milestone complete' : ' milestones complete') : '',
                'none',
                toneFromPercent(compNum),
                compNum
            ),
            this.tile('risk', 'Active Risk Signal', signal || 'None flagged', truncate(raw(r, 'Current_Opportunity_Risks__c'), 90), 'none', signalTone, null)
        ];
    }

    tile(key, label, value, sub, subTone, tone, barPct) {
        const hasBar = barPct !== null && barPct !== undefined;
        const width = hasBar ? Math.max(0, Math.min(100, barPct)) : 0;
        const open = this.openKey === key;
        return {
            key,
            label,
            value,
            sub,
            hasSub: !!sub,
            subClass: 'sub sub-' + subTone,
            cardClass: 'tile tone-' + tone + (open ? ' tile-open' : ''),
            expanded: open ? 'true' : 'false',
            hint: open ? 'Hide details ▴' : 'Details ▾',
            hasBar,
            fillClass: 'fill fill-' + tone,
            barStyle: 'width:' + width + '%'
        };
    }

    handleToggle(event) {
        const key = event.currentTarget.dataset.key;
        this.openKey = this.openKey === key ? null : key;
    }

    handleClose() {
        this.openKey = null;
    }

    // ---- Drill down panels ----

    get detail() {
        const r = this.record;
        if (!r || !this.openKey) {
            return null;
        }
        let d = null;
        if (this.openKey === 'conf') {
            d = this.confDetail(r);
        } else if (this.openKey === 'health') {
            d = this.healthDetail(r);
        } else if (this.openKey === 'comp') {
            d = this.compDetail(r);
        } else if (this.openKey === 'risk') {
            d = this.riskDetail(r);
        }
        if (!d) {
            return null;
        }
        return {
            title: d.title,
            about: d.about,
            rows: d.rows.filter((x) => x),
            blocks: d.blocks.filter((x) => x),
            stages: d.stages || [],
            hasStages: !!(d.stages && d.stages.length),
            items: d.items || [],
            hasItems: !!(d.items && d.items.length),
            itemsTitle: d.itemsTitle || '',
            more: d.more || '',
            hasMore: !!d.more,
            warn: d.warn || '',
            hasWarn: !!d.warn
        };
    }

    confDetail(r) {
        const conf = shown(r, 'Close_Likelihood_Score__c');
        const change = pctNumber(shown(r, 'Close_Confidence_Change__c'));
        const now = pctNumber(conf);
        const days = daysSince(raw(r, 'Confidence_Score_Last_Updated__c'));
        const reason = raw(r, 'Close_Likelihood_Reason__c') || raw(r, 'Close_Confidence_Details_Short__c');
        return {
            title: 'Close Confidence Score',
            about: 'Likelihood the deal closes, from the latest buyer signals in calls and notes.',
            warn: days !== null && days > STALE_DAYS ? 'This score was last updated ' + days + ' days ago. Check for newer calls or notes before relying on it.' : '',
            rows: [
                kv('Current score', conf),
                kv('Previous score', now !== null && change !== null ? now - change + '%' : null),
                kv('Change since last update', change === null ? null : (change > 0 ? '+' : '') + change + ' pts', change > 0 ? 'good' : change < 0 ? 'bad' : 'none'),
                kv('Last updated', shown(r, 'Confidence_Score_Last_Updated__c') ? shown(r, 'Confidence_Score_Last_Updated__c') + (days !== null ? ' (' + days + (days === 1 ? ' day ago)' : ' days ago)') : '') : null)
            ],
            blocks: [block('Why this score', reason), block('Suggested next step', raw(r, 'Suggested_Next_Step__c'))]
        };
    }

    healthDetail(r) {
        const health = cleanHealth(shown(r, 'Overall_Health__c'));
        const closeDays = (() => {
            const v = raw(r, 'Opportunity_Close_Date__c');
            if (!v) {
                return null;
            }
            const t = Date.parse(v);
            return Number.isNaN(t) ? null : Math.ceil((t - Date.now()) / 86400000);
        })();
        let closeText = null;
        let closeTone = 'none';
        if (closeDays !== null) {
            closeText = shown(r, 'Opportunity_Close_Date__c') + (closeDays >= 0 ? ' (in ' + closeDays + ' days)' : ' (' + Math.abs(closeDays) + ' days overdue)');
            closeTone = closeDays < 0 ? 'bad' : 'none';
        }
        const timing = shown(r, 'Timing_Health_Score__c');
        return {
            title: 'Opportunity Close Health',
            about: 'Overall read on the deal, combining milestone completion with the latest signals.',
            rows: [
                kv('Health', health.label),
                kv('Score', health.detail),
                kv('Prior score', shown(r, 'Prior_Health_Score__c')),
                kv('Category', shown(r, 'Health_Category__c')),
                kv('Deal timing score', timing),
                kv('Expected close date', closeText, closeTone)
            ],
            blocks: [block('Suggested next step', raw(r, 'Suggested_Next_Step__c'))]
        };
    }

    compDetail(r) {
        const cur = currentStage(r);
        const stages = [];
        for (let i = 0; i <= 5; i++) {
            const total = num(r, 'PH_S' + i + '_Total__c');
            if (!total) {
                continue;
            }
            const done = num(r, 'PH_S' + i + '_Done__c') || 0;
            const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
            const h = cleanHealth(shown(r, 'S' + i + '_Health__c'));
            const tone = toneFromPercent(pct);
            stages.push({
                key: 'st' + i,
                label: stageName(i) + (cur === i ? ' (current)' : ''),
                text: done + ' of ' + total,
                health: h.label || '',
                rowClass: cur === i ? 'strow strow-current' : 'strow',
                fillClass: 'fill fill-' + tone,
                barStyle: 'width:' + pct + '%'
            });
        }
        const open = this.openItems(r);
        const shownItems = open.slice(0, MAX_OPEN);
        const curDone = cur === null ? null : num(r, 'PH_S' + cur + '_Done__c');
        const curAvail = cur === null ? null : num(r, 'PH_S' + cur + '_Total__c');
        return {
            title: 'Key Milestone Completion',
            about: 'Seller execution: the right activities and conversations completed at each stage. Milestones at full marks, counted from Identify up to and including the current stage, for this record type.',
            rows: [
                kv('Milestones complete', num(r, 'PH_Done_Through_Stage__c')),
                kv('Current stage', cur === null ? null : stageName(cur)),
                kv('Current stage progress', curDone !== null && curAvail !== null ? curDone + ' of ' + curAvail : null)
            ],
            blocks: [],
            stages,
            itemsTitle: cur === null ? 'Milestones to close' : 'Open in Stage ' + cur + ' (work these next)',
            items: shownItems,
            more: open.length > MAX_OPEN ? '+' + (open.length - MAX_OPEN) + ' more in the Milestones section below.' : ''
        };
    }

    riskDetail(r) {
        const signal = raw(r, 'Active_Risk_Signal__c');
        return {
            title: 'Active Risk Signal',
            about: 'Open risks flagged from calls and notes that could stall or lose the deal.',
            rows: [kv('Signal level', signal || 'None flagged', signal === 'High' ? 'bad' : signal === 'Medium' ? 'warn' : signal === 'Low' ? 'good' : 'none')],
            blocks: [block('Risks identified', raw(r, 'Current_Opportunity_Risks__c')), block('Suggested next step', raw(r, 'Suggested_Next_Step__c'))]
        };
    }

    // Milestones at the current stage (or every track when the layout has no stages) that are not yet scored.
    openItems(r) {
        const groups = this.config.groups || [];
        const cur = currentStage(r);
        const hasStages = groups.some((g) => g.stage !== undefined && g.stage !== null);
        const pick = hasStages ? groups.filter((g) => g.stage === cur) : groups;
        const out = [];
        pick.forEach((g) => {
            g.items.filter((it) => !it.when || raw(r, it.when) !== false).forEach((it) => {
                const s = num(r, it.score);
                if (s === null || s <= 0) {
                    const reason = it.reason ? raw(r, it.reason) : null;
                    out.push({
                        key: g.key + it.score,
                        label: it.label,
                        status: s === null ? 'Not assessed' : 'Gap',
                        pillClass: s === null ? 'pill pill-none' : 'pill pill-bad',
                        reason: truncate(reason || '', 160),
                        hasReason: !!reason
                    });
                }
            });
        });
        return out;
    }
}