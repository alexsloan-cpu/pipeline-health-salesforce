// Text parsing for the narrative tiles. Pure functions, no Salesforce imports.
// The AI fields are free text, so every parser falls back to showing the full text when the pattern is not found.

export function clean(text) {
    if (text === null || text === undefined) {
        return '';
    }
    return String(text)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function cap(s) {
    const t = (s || '').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function stripEnd(s) {
    return (s || '').replace(/[\s.;:,]+$/, '').trim();
}

export function sentences(text) {
    return text
        .replace(/([.!?])\s+(?=[A-Z])/g, '$1\u0001')
        .split('\u0001')
        .map((s) => s.trim())
        .filter(Boolean);
}

// Split on commas and semicolons that are not inside parentheses. Pass seps to split on a narrower set.
export function splitTop(text, seps) {
    const sep = seps || ',;';
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of text) {
        if (ch === '(') {
            depth += 1;
        } else if (ch === ')') {
            depth = Math.max(0, depth - 1);
        }
        if (depth === 0 && sep.indexOf(ch) >= 0) {
            out.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    out.push(cur);
    return out
        .map((s) => s.replace(/^\s*(and|additionally|also)\b[,\s]*/i, '').trim())
        .filter(Boolean);
}

function splitGaps(text) {
    const numbered = text.split(/(?:^|\s)\(?\d{1,2}\)\s+/).map((x) => x.trim()).filter(Boolean);
    if (numbered.length >= 2) {
        return numbered
            .map((x) => cap(stripEnd(x).replace(/[\s,;]+(and|or)$/i, '').trim()))
            .filter(Boolean);
    }
    const out = [];
    text.split(';').forEach((part) => {
        const p = part.replace(/^\s*(additionally|also)\b[,\s]*/i, '').trim();
        if (!p) {
            return;
        }
        p.split(/,\s+(?:and\s+)?(?=(?:no|not|missing|lack|without)\b)/i).forEach((x) => {
            const g = stripEnd(x.replace(/^and\s+/i, ''));
            if (g) {
                out.push(g);
            }
        });
    });
    return out.map(cap);
}

export function parseOverview(raw) {
    const t = clean(raw);
    if (!t) {
        return null;
    }
    let body = t;
    let verdict = '';
    let needed = '';
    const vm = t.match(/Close[- ]readiness(?:\s+verdict)?\s*:\s*(.*)$/i);
    if (vm) {
        body = t.slice(0, vm.index).trim();
        const parts = vm[1].split(/\s*[—–]\s*|\s+-\s+|\s*;\s*/);
        verdict = cap(stripEnd(parts[0]));
        needed = cap(stripEnd(parts.slice(1).join('; ')));
    }
    const gm = body.match(/(?:the\s+)?(?:(?:(?:two|three|four|\d)\s+)?(?:most\s+|top\s+|key\s+)?critical|biggest|largest|main|key|top|primary)\s+(?:gaps?|risks?)(?:\s+(?:are|is)\s*:?|\s*:)\s*/i);
    if (!gm) {
        return { structured: false, summary: body, gaps: [], actions: [], verdict, needed };
    }
    const summary = body.slice(0, gm.index).trim();
    const rest = sentences(body.slice(gm.index + gm[0].length));
    const gapSentence = rest.shift() || '';
    return {
        structured: true,
        summary,
        gaps: splitGaps(gapSentence),
        actions: rest.map((a) => cap(a.replace(/^(?:the\s+)?(?:rep\s+)?priorit(?:y|ies)\s*:\s*/i, '').replace(/^the rep should\s+(first\s+)?/i, ''))),
        verdict,
        needed
    };
}

const NEG = /\b(no|not|without|lack(s|ing)?|risk(s|y)?|unclear|unknown|uncertain|concern(s|ed)?|inertia|incumbent|stall|delay(s|ed)?|competit\w*|single[- ]threaded|may not|might not|hasn'?t|isn'?t|unlikely|working well)\b|\b(existing|current)\b[^,;]*\b(stack|vendor|solution|platform|provider)\b/i;

export function parseReason(raw) {
    const t = clean(raw);
    if (!t) {
        return null;
    }
    let summary = '';
    const pros = [];
    const cons = [];
    sentences(t).forEach((s) => {
        if (/^overall\b/i.test(s)) {
            summary = summary ? summary + ' ' + s : s;
            return;
        }
        s.split(';').forEach((clause) => {
            let c = clause.trim();
            let forced = '';
            const lm = c.match(/^(positives?|pros|supporting|strengths?|working for[^:]*)\s*:\s*/i);
            const nm = c.match(/^(negatives?|cons|concerns?|risks?|headwinds?|working against[^:]*)\s*:\s*/i);
            if (lm) {
                c = c.slice(lm[0].length);
                forced = 'pro';
            } else if (nm) {
                c = c.slice(nm[0].length);
                forced = 'con';
            }
            c = stripEnd(c);
            if (!c) {
                return;
            }
            const isCon = forced ? forced === 'con' : NEG.test(c);
            (isCon ? cons : pros).push(cap(c));
        });
    });
    return { summary, pros: pros.slice(0, 6), cons: cons.slice(0, 6) };
}

// Risk categories, first match wins. Keep the fallback small: anything unmatched is grouped under "Other".
const LABELS = [
    [/incumbent|competit|status quo|alternative|vendor|displac|threat|rival|cheaper|lower[- ]cost/i, 'Competition'],
    [/compliance|security|legal|procurement|privacy|tcpa|paper process|redline|\bMSA\b|\bDPA\b|contract|signature|signer/i, 'Compliance and paper'],
    [/budget|\bEB\b|economic buyer|funding|pricing|finance|\bCFO\b|\bcost/i, 'Budget and buyer'],
    [/scope|volume|usage|overage|product gap|feature|integration|technical|support|warmup|seed list|\bfix|\bSMS\b|\bRCS\b|deliverab/i, 'Scope and product'],
    [/single[- ]thread|multi[- ]?thread|champion|stakeholder|authority|\bexec|sponsor|responsive|resched|\bOOO\b|out of office|no reply|went quiet|no response|engag/i, 'Champion and threading'],
    [/timeline|sign(ing)? in|quarter|planning|near[- ]term|urgen|slip|push(ed)?\b|\bEOM\b|\bEOQ\b|deadline|delay|next step/i, 'Timeline']
];

export function labelFor(text) {
    for (const [re, label] of LABELS) {
        if (re.test(text)) {
            return label;
        }
    }
    return 'Risk';
}

// A leading "Label: text" on a risk names it when none of the fixed categories match.
function ownLabel(text) {
    const m = text.match(/^([A-Za-z][A-Za-z /&-]{2,40}?)\s*:\s+(.+)$/);
    if (!m || m[1].trim().split(/\s+/).length > 4) {
        return null;
    }
    return { label: cap(m[1].trim()), text: cap(m[2].trim()) };
}

// Risks come as short fragments separated by semicolons (the Opportunity Risks prompt), older text by commas.
// Items are grouped by category so each risk area appears once, with its fragments listed under it.
export function parseRisks(raw) {
    const t = clean(raw);
    if (!t) {
        return null;
    }
    let main = t;
    let bottom = '';
    const bl = t.match(/\s*(?:[\u2014\u2013]|\bbottom line\s*:)\s*/i);
    if (bl) {
        main = t.slice(0, bl.index).trim();
        bottom = cap(stripEnd(t.slice(bl.index + bl[0].length)));
    }
    const first = main.indexOf(';') >= 0 ? splitTop(stripEnd(main), ';') : splitTop(stripEnd(main));
    const parts = [];
    first.forEach((piece) => {
        sentences(piece).forEach((x) => {
            if (!bottom && /^(overall|net|risks?\s+(are|remain|look)|manageable)/i.test(x.trim())) {
                bottom = cap(stripEnd(x));
            } else {
                parts.push(x);
            }
        });
    });
    const groups = [];
    const seen = new Set();
    parts
        .map((x) => cap(stripEnd(x)))
        .filter(Boolean)
        .forEach((piece) => {
            const key = piece.toLowerCase();
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            let label = labelFor(piece);
            let text = piece;
            if (label === 'Risk') {
                const own = ownLabel(piece);
                if (own) {
                    label = own.label;
                    text = own.text;
                } else {
                    label = 'Other';
                }
            }
            let g = groups.find((x) => x.label === label);
            if (!g) {
                g = { label, texts: [] };
                groups.push(g);
            }
            if (g.texts.indexOf(text) < 0) {
                g.texts.push(text);
            }
        });
    const items = groups.map((g) => ({ label: g.label, texts: g.texts, text: g.texts.join('; ') }));
    return { items, bottom };
}