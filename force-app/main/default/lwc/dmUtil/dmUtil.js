// Shared helpers for the Deal Milestones record page components.
// Read only. Every value comes from the UI API record, so field-level security and sharing apply.

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]️?/gu;

export function fieldList(names) {
    return names.map((n) => 'Deal_Milestones__c.' + n);
}

export function raw(rec, name) {
    const f = rec && rec.fields ? rec.fields[name] : null;
    return f ? f.value : null;
}

export function shown(rec, name) {
    const f = rec && rec.fields ? rec.fields[name] : null;
    if (!f) {
        return null;
    }
    return f.displayValue !== null && f.displayValue !== undefined ? f.displayValue : f.value;
}

export function num(rec, name) {
    const v = raw(rec, name);
    if (v === null || v === undefined || v === '') {
        return null;
    }
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}

// First number found in a display string such as "62%" or "Healthy (72%)".
export function pctNumber(text) {
    if (text === null || text === undefined) {
        return null;
    }
    const m = String(text).match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
}

// Health formulas start with a colored dot emoji. Map it to a tone.
export function toneOf(text) {
    if (!text) {
        return 'none';
    }
    if (text.indexOf('\u{1F7E2}') >= 0) {
        return 'good';
    }
    if (text.indexOf('\u{1F7E1}') >= 0) {
        return 'warn';
    }
    if (text.indexOf('\u{1F534}') >= 0) {
        return 'bad';
    }
    return 'none';
}

// "🟡 Needs Attention (52%)" becomes { label: 'Needs Attention', detail: '52%' }.
export function cleanHealth(text) {
    if (!text) {
        return { label: '', detail: '' };
    }
    const t = String(text).replace(EMOJI, '').trim();
    const m = t.match(/^(.*?)\s*\((.*)\)\s*$/);
    if (m) {
        return { label: m[1].trim(), detail: m[2].trim() };
    }
    return { label: t, detail: '' };
}

// Tone from a 0 to 100 score, using the same cut points as the health formulas.
export function toneFromPercent(p) {
    if (p === null || p === undefined) {
        return 'none';
    }
    if (p >= 70) {
        return 'good';
    }
    if (p >= 45) {
        return 'warn';
    }
    return 'bad';
}

// The current stage is the first stage that still has open milestones.
export function currentStage(rec) {
    let last = null;
    for (let i = 0; i <= 5; i++) {
        const total = num(rec, 'Stage_' + i + '_Total__c');
        const done = num(rec, 'Stage_' + i + '_Complete__c');
        if (total) {
            last = i;
            if ((done || 0) < total) {
                return i;
            }
        }
    }
    return last;
}

export function stageFieldNames() {
    const out = [];
    for (let i = 0; i <= 5; i++) {
        out.push('Stage_' + i + '_Complete__c', 'Stage_' + i + '_Total__c', 'S' + i + '_Health__c');
    }
    return out;
}

// ---- Trend chart geometry (used by dmTrends) ----

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-10-16" becomes "Oct 16". Works on the date text so no time zone shifts.
export function shortDate(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) : String(iso);
}

export function longDate(iso) {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? MONTHS[parseInt(m[2], 10) - 1] + ' ' + parseInt(m[3], 10) + ', ' + m[1] : String(iso);
}

function round1(n) {
    return Math.round(n * 10) / 10;
}

// rows: [{ date: 'YYYY-MM-DD', t: ms, a: number|null, b: number|null }] sorted by date, one per day.
// Two series on a 0 to 100 scale. Returns plain objects ready for an SVG template.
export function chartModel(rows, width, height, margin) {
    const iw = width - margin.l - margin.r;
    const ih = height - margin.t - margin.b;
    const t0 = rows[0].t;
    const t1 = rows[rows.length - 1].t;
    const span = t1 - t0;
    const X = (t) => round1(margin.l + (span ? ((t - t0) / span) * iw : iw / 2));
    const Y = (v) => round1(margin.t + ih - (Math.max(0, Math.min(100, v)) / 100) * ih);

    const series = [
        { id: 'a', name: 'Close Confidence Score', color: '#0b5cab' },
        { id: 'b', name: 'Key Milestone Completion', color: '#2e844a' }
    ].map((s) => {
        const pts = rows
            .filter((r) => r[s.id] !== null && r[s.id] !== undefined)
            .map((r) => ({
                key: s.id + r.date,
                x: X(r.t),
                y: Y(r[s.id]),
                tip: longDate(r.date) + ': ' + s.name + ' ' + r[s.id]
            }));
        return {
            id: s.id,
            name: s.name,
            color: s.color,
            points: pts,
            poly: pts.map((p) => p.x + ',' + p.y).join(' '),
            hasLine: pts.length > 1
        };
    });

    const grid = [0, 50, 100].map((v) => ({
        key: 'g' + v,
        label: String(v),
        y: Y(v),
        yText: Y(v) + 3,
        x1: margin.l,
        x2: width - margin.r,
        xText: margin.l - 6
    }));

    const want = rows.length <= 4 ? rows.map((r, i) => i) : [0, Math.round((rows.length - 1) / 3), Math.round(((rows.length - 1) * 2) / 3), rows.length - 1];
    const seen = {};
    const ticks = [];
    want.forEach((i) => {
        if (!seen[i]) {
            seen[i] = true;
            ticks.push({ key: 'x' + i, x: X(rows[i].t), label: shortDate(rows[i].date), yText: height - 6 });
        }
    });

    return { width, height, series, grid, ticks };
}

// First and last value of a series, for the change chips.
export function seriesChange(rows, id) {
    const vals = rows.filter((r) => r[id] !== null && r[id] !== undefined);
    if (!vals.length) {
        return null;
    }
    const first = vals[0];
    const last = vals[vals.length - 1];
    return { first: first[id], last: last[id], delta: last[id] - first[id], since: first.date };
}