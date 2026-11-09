// Stage based milestone sets for the Option 2 and Option 3 Deal Milestones pages.
// Every record type uses Stage 0 to 5. New Business also has Stage 6 (Quote Approved), per the New Business scoring rubric (Nov 2, 2026).
// Midterm and Renewal stages follow the Oct 14 revised workbook,
// with Stage 4 reusing the New Business pricing, funding and paper process fields (Oct 20, 2026).
// Read only helpers. Values come from the UI API record, so field-level security and sharing apply.

const OBJ = 'Deal_Milestones__c.';

// `when` names a Deal_Milestones__c checkbox. The item is hidden and not counted when that field is false on the record.
// `doneAt` is the score that counts as complete when it is below max (Technical Fit on New Product counts at 4 of 5).
function it(stage, label, score, reason, max, when, doneAt) {
    const m = max === undefined ? 3 : max;
    return { stage, label, score, reason: reason || null, max: m, when: when || null, doneAt: doneAt || m };
}

function withHint(item, hint) {
    return { ...item, hint };
}

// Stage names follow the Opportunity Stage picklist ("2. Discover" shows as "Discover"). Index is the stage number.
export const STAGE_NAMES = ['Identify', 'Mutual Interest', 'Discover', 'Validate', 'Decide', 'Negotiate', 'Commit'];

export function stageName(n) {
    const i = n === null || n === undefined || n === '' ? NaN : Number(n);
    return Number.isInteger(i) && i >= 0 && i < STAGE_NAMES.length ? STAGE_NAMES[i] : '';
}

// "3. Validate" becomes "Validate". Closed Won and Closed Lost stay as they are.
export function stageLabel(value) {
    const s = String(value || '').trim();
    const m = s.match(/^\d+\.\s*(.+)$/);
    return m ? m[1] : s;
}

const STAGE4_POST = [
    it(4, 'Initial Pricing Presented', 'InitialPricingPresented_S4__c', 'Scoring_Reason_Pricing_Presented__c'),
    it(4, 'Funding Determined', 'FundingDetermined_S1__c', 'FundingDetermined_Reason_S1__c'),
    it(4, 'Pricing Aligned & Agreed', 'PricingAlignedAgreed_S4__c', 'Scoring_Reason_Pricing_Aligned__c'),
    it(4, 'Paper Process Confirmed', 'PaperProcessConfirmed_S4__c', 'PaperProcessConfirmed_Reason_S4__c')
];

export const STAGE_SETS = {
    newBusiness: [
        it(0, 'Pain Identified', 'PainIdentified_S1__c', 'PainIdentified_Reason_S1__c'),
        it(0, 'Compelling Event Identified', 'CompellingEventIdentified_S2__c', 'Scoring_Reason_Compelling_Event__c'),
        it(1, 'Funding Determined', 'FundingDetermined_S1__c', 'FundingDetermined_Reason_S1__c'),
        it(1, 'Pain Worth Investing Time In', 'PainWorthInvestingTimeIn_S1__c', 'Scoring_Reason_Pain_Worth_Investing__c'),
        it(2, 'Champion Identified', 'ChampionIdentified_S2__c', 'ChampionIdentified_Reason_S2__c'),
        it(2, 'Competition Identified', 'CompetitionIdentified_S2__c', 'CompetitionIdentified_Reason_S2__c'),
        it(2, 'Why Iterable', 'WhyIterable_S2__c', 'Scoring_Reason_WhyIterable_S2__c'),
        it(3, 'Purchase Timeline Agreed', 'PurchaseTimelineAgreed_S3__c', 'Scoring_Reason_Timeline_Agreed__c'),
        it(3, 'Risks Identified', 'RisksIdentified_S3__c', 'RisksIdentified_Reason_S3__c'),
        it(3, 'Partner Engaged/Introduced', 'PartnerEngaged_S3__c', null, 2),
        it(3, 'Technical Validation Completed', 'TechnicalValidationCompleted_S3__c', 'TechnicalValidation_Reason_S3__c'),
        it(3, 'Technical Fit', 'TechnicalFitScore_S3__c', 'ScoringReason_TechnicalFit_S3__c', 5),
        it(3, 'Services Need Identified', 'ServicesNeedIdentified_S3__c', 'Scoring_Reason_Services_Identified__c'),
        it(4, 'Initial Pricing Presented', 'InitialPricingPresented_S4__c', 'Scoring_Reason_Pricing_Presented__c'),
        it(4, 'Paper Process Confirmed', 'PaperProcessConfirmed_S4__c', 'PaperProcessConfirmed_Reason_S4__c'),
        it(4, 'Pricing Aligned & Agreed', 'PricingAlignedAgreed_S4__c', 'Scoring_Reason_Pricing_Aligned__c'),
        it(5, 'Legal/IT Review Completed', 'LegalITReviewCompleted_S5__c', 'Scoring_Reason_LegalIT_Completed__c'),
        it(5, 'Procurement Aligned', 'ProcurementAligned_S5__c', 'Scoring_Reason_Procurement_Aligned__c'),
        it(6, 'Quote Approved', 'Quote_Approved_S6__c', 'Scoring_Reason_Quote_Approved__c', 2)
    ],
    organicGrowth: [
        it(0, 'Usage Review', 'Usage_Review_Score__c', 'Usage_Review_Reason__c'),
        it(0, 'CSM Risk Review', 'CSM_Risk_Review_Score__c', 'CSM_Risk_Review_Reason__c'),
        it(0, 'Growth Driver Identified', 'Growth_Driver_Identified_Score__c', 'Growth_Driver_Identified_Reason__c'),
        it(0, 'Use Case Identified', 'Use_Case_Identified_Score__c', 'Use_Case_Identified_Reason__c'),
        it(1, 'CAM CSM Alignment', 'CAM_CSM_Alignment_Score__c', 'CAM_CSM_Alignment_Reason__c'),
        it(1, 'Overage Confirmed', 'Overage_Confirmed_Score__c', 'Overage_Confirmed_Reason__c'),
        it(1, 'Overage Driver', 'Overage_Driver_Score__c', 'Overage_Driver_Reason__c'),
        it(1, 'Internal Alignment', 'Internal_Alignment_Score__c', 'Internal_Alignment_Reason__c'),
        it(2, 'Use Case Goal', 'Use_Case_Goal_Score__c', 'Use_Case_Goal_Reason__c'),
        it(2, 'Discovery Completed', 'Discovery_Completed_Score__c', 'Discovery_Completed_Reason__c'),
        it(2, 'Volumes Validated', 'Volumes_Validated_Score__c', 'Volumes_Validated_Reason__c'),
        it(3, 'Proposal Created', 'Proposal_Created_Score__c', 'Proposal_Created_Reason__c'),
        it(3, 'Use Case Doc', 'Use_Case_Doc_Score__c', 'Use_Case_Doc_Reason__c'),
        ...STAGE4_POST,
        it(5, 'DocuSign Sent', 'DocuSign_Sent_Score__c', 'DocuSign_Sent_Reason__c')
    ],
    newProduct: [
        it(0, 'CAM CSM Alignment', 'CAM_CSM_Alignment_Score__c', 'CAM_CSM_Alignment_Reason__c'),
        it(0, 'Use Case Identified', 'Use_Case_Identified_Score__c', 'Use_Case_Identified_Reason__c'),
        it(1, 'Use Case Tied to Business Goal', 'Use_Case_Goal_Score__c', 'Use_Case_Goal_Reason__c'),
        it(1, 'Overage Driver', 'Overage_Driver_Score__c', 'Overage_Driver_Reason__c', 3, 'PH_Overage_Applies__c'),
        it(1, 'Overage Confirmed', 'Overage_Confirmed_Score__c', 'Overage_Confirmed_Reason__c', 3, 'PH_Overage_Applies__c'),
        it(1, 'Internal Alignment', 'Internal_Alignment_Score__c', 'Internal_Alignment_Reason__c'),
        it(2, 'Discovery Completed', 'Discovery_Completed_Score__c', 'Discovery_Completed_Reason__c'),
        it(2, 'Volumes Validated', 'Volumes_Validated_Score__c', 'Volumes_Validated_Reason__c'),
        it(2, 'Stakeholders & Champion Identified', 'Stakeholders_Champion_Identified_Score__c', 'Stakeholders_Champion_Identified_Reason__c'),
        it(3, 'Solution Validated / Demo Delivered', 'Solution_Validated_Demo_Delivered_Score__c', 'Solution_Validated_Demo_Delivered_Reason__c'),
        it(3, 'Technical Fit', 'TechnicalFitScore_S3__c', 'ScoringReason_TechnicalFit_S3__c', 5, null, 4),
        it(3, 'Proposal Created', 'Proposal_Created_Score__c', 'Proposal_Created_Reason__c'),
        ...STAGE4_POST,
        it(5, 'DocuSign Sent', 'DocuSign_Sent_Score__c', 'DocuSign_Sent_Reason__c')
    ],
    renewal: [
        it(0, 'Usage Review', 'Usage_Review_Score__c', 'Usage_Review_Reason__c'),
        it(0, 'CSM Risk Review', 'CSM_Risk_Review_Score__c', 'CSM_Risk_Review_Reason__c'),
        it(0, 'Growth Driver Identified', 'Growth_Driver_Identified_Score__c', 'Growth_Driver_Identified_Reason__c'),
        it(0, 'Use Case Identified', 'Use_Case_Identified_Score__c', 'Use_Case_Identified_Reason__c'),
        it(0, 'Competitive Threats Identified', 'Competitive_Threats_Identified_Score__c', 'Competitive_Threats_Identified_Reason__c'),
        it(1, 'Internal Alignment', 'Internal_Alignment_Score__c', 'Internal_Alignment_Reason__c'),
        it(1, 'Proposal Created', 'Proposal_Created_Score__c', 'Proposal_Created_Reason__c'),
        it(1, 'CAM CSM Alignment', 'CAM_CSM_Alignment_Score__c', 'CAM_CSM_Alignment_Reason__c'),
        it(1, 'Overage Driver', 'Overage_Driver_Score__c', 'Overage_Driver_Reason__c'),
        it(1, 'Overage Confirmed', 'Overage_Confirmed_Score__c', 'Overage_Confirmed_Reason__c'),
        it(2, 'Stakeholders Confirmed', 'Stakeholders_Confirmed_Score__c', 'Stakeholders_Confirmed_Reason__c'),
        it(2, 'Volumes Validated', 'Volumes_Validated_Score__c', 'Volumes_Validated_Reason__c'),
        it(2, 'Use Case Goal', 'Use_Case_Goal_Score__c', 'Use_Case_Goal_Reason__c'),
        it(2, 'Discovery Completed', 'Discovery_Completed_Score__c', 'Discovery_Completed_Reason__c'),
        it(3, 'Use Case Doc', 'Use_Case_Doc_Score__c', 'Use_Case_Doc_Reason__c'),
        ...STAGE4_POST,
        it(5, 'DocuSign Sent', 'DocuSign_Sent_Score__c', 'DocuSign_Sent_Reason__c')
    ]
};

export const LAYOUT_NAMES = {
    newBusiness: 'New Business',
    organicGrowth: 'Midterm Organic Growth',
    newProduct: 'Midterm New Product',
    renewal: 'Renewal'
};

// 'auto' lets one page serve several record types: the set is picked from the record's record type.
// Any explicit layout value keeps working exactly as before.
export const AUTO = 'auto';
const RT_FIELD = 'RecordType.DeveloperName';
const RT_LAYOUT = {
    New_Business: 'newBusiness',
    Midterm: 'organicGrowth',
    Midterm_New_Product: 'newProduct',
    Midterm_Other: 'newProduct',
    Renewal: 'renewal'
};
const RT_LABEL_LAYOUT = {
    'New Business': 'newBusiness',
    'Midterm - Organic Growth': 'organicGrowth',
    'Midterm - New Product': 'newProduct',
    'Midterm - Other': 'newProduct',
    Renewal: 'renewal'
};

export function resolveLayout(layout, rec) {
    if (layout !== AUTO) {
        return layout;
    }
    const f = rec && rec.fields ? rec.fields.RecordType : null;
    const dev = f && f.value && f.value.fields && f.value.fields.DeveloperName ? f.value.fields.DeveloperName.value : null;
    if (dev && RT_LAYOUT[dev]) {
        return RT_LAYOUT[dev];
    }
    const label = rec && rec.recordTypeInfo ? rec.recordTypeInfo.name : null;
    return (label && RT_LABEL_LAYOUT[label]) || 'newBusiness';
}

export function setFor(layout) {
    return STAGE_SETS[layout] || STAGE_SETS.newBusiness;
}

// Fields every stage component needs, as optional fields so a missing one never breaks the page.
export function stageFields(layout, extra) {
    const names = new Set(['Opportunity_Stage__c']);
    const sets = layout === AUTO ? Object.keys(STAGE_SETS).map((k) => STAGE_SETS[k]) : [setFor(layout)];
    if (layout === AUTO) {
        names.add(RT_FIELD);
    }
    [].concat(...sets).forEach((x) => {
        names.add(x.score);
        if (x.when) {
            names.add(x.when);
        }
        if (x.reason) {
            names.add(x.reason);
        }
    });
    (extra || []).forEach((n) => names.add(n));
    return Array.from(names).map((n) => (n.indexOf('.') >= 0 ? OBJ + n : OBJ + n));
}

export function val(rec, name) {
    const f = rec && rec.fields ? rec.fields[name] : null;
    return f ? f.value : null;
}

export function shownVal(rec, name) {
    const f = rec && rec.fields ? rec.fields[name] : null;
    if (!f) {
        return null;
    }
    return f.displayValue !== null && f.displayValue !== undefined ? f.displayValue : f.value;
}

export function numVal(rec, name) {
    const v = val(rec, name);
    if (v === null || v === undefined || v === '') {
        return null;
    }
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
}

// Value through a relationship, e.g. path 'Opportunity__r.Close_Date_Push_Counter__c'.
export function relVal(rec, path) {
    const parts = path.split('.');
    let cur = rec;
    for (let i = 0; i < parts.length; i++) {
        const f = cur && cur.fields ? cur.fields[parts[i]] : null;
        if (!f) {
            return null;
        }
        cur = i === parts.length - 1 ? f.value : f.value;
        if (cur === null || cur === undefined) {
            return null;
        }
    }
    return cur;
}

// "3. Validate" becomes 3. Closed stages become 6. Unknown returns null.
export function oppStageNumber(rec) {
    const s = val(rec, 'Opportunity_Stage__c');
    if (!s) {
        return null;
    }
    const m = String(s).match(/^\s*(\d)/);
    if (m) {
        return Math.min(6, parseInt(m[1], 10));
    }
    return /closed/i.test(String(s)) ? 6 : null;
}

// Closed Lost deals are scored through Stage 5 only. Everything else follows oppStageNumber.
export function isClosedLost(rec) {
    return /closed\s*lost/i.test(String(val(rec, 'Opportunity_Stage__c') || ''));
}

// A milestone is complete only at full marks (3 of 3, 5 of 5). Anything between 1 and max-1 is in progress.
export function isComplete(score, max, doneAt) {
    return score !== null && max ? score >= (doneAt || max) : false;
}

export function isInProgress(score, max, doneAt) {
    return score !== null && max ? score > 0 && score < (doneAt || max) : false;
}

export function verdict(score, max, doneAt) {
    if (score === null) {
        return { text: 'Not assessed', tone: 'none', scoreText: '–' };
    }
    const scoreText = score + ' / ' + max;
    if (score <= 0) {
        return { text: 'Not started', tone: 'bad', scoreText };
    }
    if (score >= (doneAt || max)) {
        return { text: 'Complete', tone: 'good', scoreText };
    }
    return { text: 'In progress', tone: 'warn', scoreText };
}

// Stages 0 to 5 with their milestones, counts and the current stage. A set with Stage 6 milestones (New Business) adds Stage 6.
export function buildStages(rec, layoutIn) {
    const layout = resolveLayout(layoutIn, rec);
    const cur = oppStageNumber(rec);
    const set = setFor(layout);
    const top = set.reduce((m, x) => Math.max(m, x.stage), 5);
    const out = [];
    for (let s = 0; s <= top; s++) {
        const items = set
            .filter((x) => x.stage === s && (!x.when || val(rec, x.when) !== false))
            .map((x, i) => {
                const score = numVal(rec, x.score);
                const v = verdict(score, x.max, x.doneAt);
                const reason = x.reason ? val(rec, x.reason) : null;
                return {
                    key: 's' + s + '-' + i + '-' + x.score,
                    label: x.label,
                    score,
                    max: x.max,
                    done: isComplete(score, x.max, x.doneAt),
                    inProgress: isInProgress(score, x.max, x.doneAt),
                    pillText: v.text,
                    pillClass: 'pill pill-' + v.tone,
                    scoreText: v.scoreText,
                    shortScore: score === null ? '–' : score + '/' + x.max,
                    reason: reason ? String(reason) : '',
                    hint: x.hint || '',
                    hasHint: !!x.hint,
                    hasReason: !!reason
                };
            });
        const done = items.filter((x) => x.done).length;
        const inProgress = items.filter((x) => x.inProgress).length;
        out.push({
            stage: s,
            key: 'stage' + s,
            name: stageName(s),
            items,
            total: items.length,
            done,
            inProgress,
            open: items.length - done,
            isCurrent: cur === s,
            isPast: cur !== null && s < cur,
            hasItems: items.length > 0
        });
    }
    return { current: cur, stages: out };
}

export function fmtMoney(n) {
    if (n === null || n === undefined) {
        return '–';
    }
    const a = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (a >= 1000000) {
        return sign + '$' + (a / 1000000).toFixed(a >= 10000000 ? 0 : 1) + 'M';
    }
    if (a >= 1000) {
        return sign + '$' + Math.round(a / 1000) + 'K';
    }
    return sign + '$' + Math.round(a);
}

// Close Confidence to the forecast category the evidence supports. Same cut points as the health formulas.
export function evidenceCategory(conf) {
    if (conf === null || conf === undefined) {
        return null;
    }
    if (conf >= 70) {
        return 'Commit';
    }
    if (conf >= 45) {
        return 'Best Case';
    }
    return 'Pipeline';
}