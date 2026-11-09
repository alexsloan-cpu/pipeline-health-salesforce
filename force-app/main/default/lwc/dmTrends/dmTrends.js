import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { getRecord } from 'lightning/uiRecordApi';
import getHistory from '@salesforce/apex/PhScoreHistoryController.getHistory';
import { pctNumber, chartModel, seriesChange, longDate, shortDate, raw, num } from 'c/dmUtil';

const OBJ = 'Pipeline_Health_Snapshot__c.';
const FIELDS = [
    OBJ + 'Snapshot_Date__c',
    OBJ + 'Close_Likelihood_Score__c',
    OBJ + 'Health_Score__c',
    OBJ + 'CreatedDate'
];
const SORT = [OBJ + 'Snapshot_Date__c'];
const REC_FIELDS = [
    'Deal_Milestones__c.Close_Likelihood_Reason__c',
    'Deal_Milestones__c.Close_Confidence_Details_Short__c',
    'Deal_Milestones__c.Total_Milestones_Completed__c',
    'Deal_Milestones__c.Suggested_Next_Step__c'
];
const SERIES_INFO = {
    a: {
        title: 'Close Health Score',
        about: 'Likelihood the deal closes, from the latest buyer signals. Each point is a day the score changed or a snapshot ran.'
    },
    b: {
        title: 'Key Milestone Completion',
        about: 'Seller execution through the current stage. It only moves when milestones are completed or scored.'
    }
};

const W = 640;
const H = 150;
const MARGIN = { l: 30, r: 12, t: 8, b: 22 };

function shown(rec, name) {
    const f = rec.fields ? rec.fields[name] : null;
    if (!f) {
        return null;
    }
    return f.displayValue !== null && f.displayValue !== undefined ? f.displayValue : f.value;
}

function rawValue(rec, name) {
    const f = rec.fields ? rec.fields[name] : null;
    return f ? f.value : null;
}

export default class DmTrends extends LightningElement {
    @api recordId;
    records;
    failed = false;
    loaded = false;
    openId = null;
    deal;
    history = [];

    @wire(getRecord, { recordId: '$recordId', optionalFields: REC_FIELDS })
    wiredDeal({ data }) {
        if (data) {
            this.deal = data;
        }
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Pipeline_Health_Snapshots__r',
        fields: FIELDS,
        sortBy: SORT,
        pageSize: 500
    })
    wiredSnapshots({ data, error }) {
        if (data) {
            this.records = data.records;
            this.failed = false;
            this.loaded = true;
        } else if (error) {
            this.records = undefined;
            this.failed = true;
            this.loaded = true;
        }
    }

    @wire(getHistory, { recordId: '$recordId' })
    wiredHistory({ data }) {
        if (data) {
            this.history = data;
        }
    }

    // One row per day. Field history wins over a snapshot on the same day because it is the end-of-day value.
    get rows() {
        const byDay = {};
        (this.records || []).forEach((rec) => {
            const created = rawValue(rec, 'CreatedDate');
            const day = rawValue(rec, 'Snapshot_Date__c') || (created ? String(created).substring(0, 10) : null);
            if (!day) {
                return;
            }
            const a = pctNumber(shown(rec, 'Close_Likelihood_Score__c'));
            const b = pctNumber(shown(rec, 'Health_Score__c'));
            if (a === null && b === null) {
                return;
            }
            const prev = byDay[day];
            const stamp = created ? String(created) : '';
            if (!prev || stamp >= prev.stamp) {
                byDay[day] = { date: day, t: Date.parse(day + 'T00:00:00Z'), a, b, stamp };
            }
        });
        this.history.forEach((h) => {
            const e = byDay[h.day] || (byDay[h.day] = { date: h.day, t: Date.parse(h.day + 'T00:00:00Z'), a: null, b: null, stamp: '' });
            e[h.series] = Number(h.value);
        });
        return Object.keys(byDay)
            .sort()
            .map((d) => byDay[d]);
    }

    get hasData() {
        return this.rows.length > 0;
    }

    get model() {
        return this.rows.length ? chartModel(this.rows, W, H, MARGIN) : null;
    }

    get viewBox() {
        return '0 0 ' + W + ' ' + H;
    }

    get metaText() {
        const r = this.rows;
        if (!r.length) {
            return '';
        }
        return r.length + (r.length === 1 ? ' snapshot' : ' readings') + ' since ' + longDate(r[0].date);
    }

    get chips() {
        const r = this.rows;
        if (!r.length) {
            return [];
        }
        return [
            this.chip('a', 'Close Health Score', '#0b5cab', r),
            this.chip('b', 'Key Milestone Completion', '#2e844a', r)
        ].filter((c) => c);
    }

    chip(id, label, color, rows) {
        const ch = seriesChange(rows, id);
        if (!ch) {
            return null;
        }
        const d = Math.round(ch.delta);
        let text = 'No change since ' + shortDate(ch.since);
        let tone = 'flat';
        if (d > 0) {
            text = '▲ Up ' + d + ' pts since ' + shortDate(ch.since);
            tone = 'up';
        } else if (d < 0) {
            text = '▼ Down ' + Math.abs(d) + ' pts since ' + shortDate(ch.since);
            tone = 'down';
        }
        const open = this.openId === id;
        return {
            key: id,
            label,
            value: Math.round(ch.last) + '%',
            text,
            textClass: 'chip-text chip-' + tone,
            swatch: 'background:' + color,
            expanded: open ? 'true' : 'false',
            chipClass: open ? 'chip chip-open' : 'chip',
            hint: open ? 'Hide details ▴' : 'Details ▾'
        };
    }

    handleToggle(event) {
        const id = event.currentTarget.dataset.key;
        this.openId = this.openId === id ? null : id;
    }

    handleClose() {
        this.openId = null;
    }

    get detail() {
        const id = this.openId;
        if (!id || !this.rows.length) {
            return null;
        }
        const pts = this.rows.filter((r) => r[id] !== null && r[id] !== undefined);
        if (!pts.length) {
            return null;
        }
        const vals = pts.map((r) => r[id]);
        const first = pts[0];
        const last = pts[pts.length - 1];
        let hi = pts[0];
        let lo = pts[0];
        pts.forEach((r) => {
            if (r[id] > hi[id]) {
                hi = r;
            }
            if (r[id] < lo[id]) {
                lo = r;
            }
        });
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const delta = Math.round(last[id] - first[id]);
        const days = Math.round((last.t - first.t) / 86400000);
        let direction = 'Not enough history yet';
        if (pts.length >= 3) {
            const back = pts[Math.max(0, pts.length - 4)];
            const d = Math.round(last[id] - back[id]);
            direction = d > 0 ? 'Rising over the last ' + (pts.length - 1 - pts.indexOf(back)) + ' readings' : d < 0 ? 'Falling over the last ' + (pts.length - 1 - pts.indexOf(back)) + ' readings' : 'Flat over the last ' + (pts.length - 1 - pts.indexOf(back)) + ' readings';
        }
        const rows = [
            { key: 'l', label: 'Latest', value: Math.round(last[id]) + '%' },
            { key: 'f', label: 'Starting point', value: Math.round(first[id]) + '% on ' + shortDate(first.date) },
            { key: 'c', label: 'Change since start', value: (delta > 0 ? '+' : '') + delta + ' pts' },
            { key: 'h', label: 'High', value: Math.round(hi[id]) + '% on ' + shortDate(hi.date) },
            { key: 'lo', label: 'Low', value: Math.round(lo[id]) + '% on ' + shortDate(lo.date) },
            { key: 'av', label: 'Average', value: avg + '%' },
            { key: 'dir', label: 'Recent direction', value: direction },
            { key: 'n', label: 'Data points', value: pts.length + (days > 0 ? ' over ' + days + (days === 1 ? ' day' : ' days') : '') }
        ];
        if (id === 'b') {
            const done = num(this.deal, 'Total_Milestones_Completed__c');
            if (done !== null) {
                rows.push({ key: 'ms', label: 'Milestones complete now', value: String(done) });
            }
        }
        const table = pts
            .map((r, i) => {
                const dv = i ? Math.round(r[id] - pts[i - 1][id]) : null;
                return {
                    key: 't' + r.date,
                    date: longDate(r.date),
                    value: Math.round(r[id]) + '%',
                    change: dv === null ? 'First reading' : dv > 0 ? '+' + dv : dv < 0 ? String(dv) : 'No change',
                    changeClass: dv > 0 ? 'td-up' : dv < 0 ? 'td-down' : 'td-flat'
                };
            })
            .slice(-10)
            .reverse();
        const blocks = [];
        if (this.deal) {
            const reason = id === 'a' ? raw(this.deal, 'Close_Likelihood_Reason__c') || raw(this.deal, 'Close_Confidence_Details_Short__c') : null;
            if (reason) {
                blocks.push({ key: 'why', label: 'Why the score is where it is today', text: reason });
            }
            const next = raw(this.deal, 'Suggested_Next_Step__c');
            if (next) {
                blocks.push({ key: 'next', label: 'Suggested next step', text: next });
            }
        }
        return { title: SERIES_INFO[id].title, about: SERIES_INFO[id].about, rows, table, blocks, hasBlocks: blocks.length > 0 };
    }

    get emptyText() {
        if (!this.loaded) {
            return 'Loading';
        }
        if (this.failed) {
            return 'Snapshot history is not available for your profile.';
        }
        return 'No snapshots yet for this deal. The chart appears after the first snapshot runs.';
    }

    get singlePointNote() {
        return this.rows.length === 1 ? 'The trend line appears after the second snapshot.' : '';
    }

    get hasNote() {
        return !!this.singlePointNote;
    }
}