import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { stageFields, buildStages, numVal, stageName, isClosedLost } from 'c/dmStages';

// Key Milestone Completion is Milestone Points Earned / Milestone Points Possible, computed by the
// PH_Calc_Health flow on save and stored in the PH_Calc fields. The graph reads those same fields,
// so the bars, the counts and the headline score always agree. Points: 0 to 3 per milestone
// (5 for Technical Fit, 2 for Partner Engaged), earned on milestones in stages up to the
// opportunity's current stage. New Business also has Stage 6 (Quote Approved). A milestone is complete at full marks; partial scores still earn points.
const SCORE = 'Opportunity_Health_Score__c';
const THROUGH = 'Milestone_Stage_Number__c';
const EARNED = 'PH_Calc_Points_Earned__c';
const POSSIBLE = 'PH_Calc_Points_Possible__c';
const CALC = [];
for (let s = 0; s <= 6; s++) {
    CALC.push('PH_Calc_S' + s + '_Done__c', 'PH_Calc_S' + s + '_Total__c', 'PH_Calc_S' + s + '_Points__c', 'PH_Calc_S' + s + '_Points_Max__c');
}

export default class DmStageProgress extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    record;

    get fields() {
        return stageFields(this.layout, [SCORE, THROUGH, EARNED, POSSIBLE].concat(CALC));
    }

    @wire(getRecord, { recordId: '$recordId', optionalFields: '$fields' })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get hasRecord() {
        return !!this.record;
    }

    get model() {
        return this.record ? buildStages(this.record, this.layout) : { current: null, stages: [] };
    }

    // Stored calc from the record. Falls back to the same math done client side when the stored fields are blank
    // (a record not saved since the calc fields were added, or fields hidden from this user).
    get calc() {
        const r = this.record;
        if (!r) {
            return null;
        }
        const possible = numVal(r, POSSIBLE);
        if (possible !== null && possible > 0) {
            const through = numVal(r, THROUGH);
            const stages = [];
            for (let s = 0; s <= 6; s++) {
                const row = {
                    stage: s,
                    done: numVal(r, 'PH_Calc_S' + s + '_Done__c') || 0,
                    total: numVal(r, 'PH_Calc_S' + s + '_Total__c') || 0,
                    points: numVal(r, 'PH_Calc_S' + s + '_Points__c') || 0,
                    max: numVal(r, 'PH_Calc_S' + s + '_Points_Max__c') || 0
                };
                // Stage 6 exists only on New Business. Other layouts keep Stage 0 to 5.
                if (s <= 5 || row.total > 0) {
                    stages.push(row);
                }
            }
            return { stored: true, earned: numVal(r, EARNED) || 0, possible, through, stages };
        }
        const m = this.model;
        const through = m.current !== null && isClosedLost(this.record) ? Math.min(m.current, 5) : m.current;
        const stages = m.stages.map((s) => ({
            stage: s.stage,
            done: s.done,
            total: s.total,
            points: s.items.reduce((a, x) => a + Math.max(0, x.score || 0), 0),
            max: s.items.reduce((a, x) => a + x.max, 0)
        }));
        const counted = stages.filter((s) => through !== null && s.stage <= through);
        return {
            stored: false,
            earned: counted.reduce((a, s) => a + s.points, 0),
            possible: counted.reduce((a, s) => a + s.max, 0),
            through,
            stages
        };
    }

    get scoreText() {
        const v = this.record ? numVal(this.record, SCORE) : null;
        if (v !== null) {
            return Math.round(v) + '%';
        }
        const c = this.calc;
        return c && c.possible ? Math.round((100 * c.earned) / c.possible) + '%' : '–';
    }

    get meta() {
        const c = this.calc;
        if (!c) {
            return '';
        }
        const where = c.through === null || c.through === undefined ? 'through the current stage' : 'through ' + stageName(c.through);
        return c.earned + ' of ' + c.possible + ' points ' + where;
    }

    get rows() {
        const c = this.calc;
        if (!c) {
            return [];
        }
        const cur = this.model.current;
        return c.stages.map((s) => {
            const counted = c.through !== null && c.through !== undefined && s.stage <= c.through;
            const pct = s.max ? Math.round((100 * s.points) / s.max) : 0;
            let tone = 'none';
            if (counted && s.max) {
                tone = s.points >= s.max ? 'good' : s.points > 0 ? 'warn' : 'bad';
            }
            let count;
            if (!s.total) {
                count = 'No milestones';
            } else if (counted) {
                count = s.done + ' of ' + s.total + ' complete · ' + s.points + ' of ' + s.max + ' pts';
            } else {
                count = s.done + ' of ' + s.total + ' complete · not counted yet';
            }
            return {
                key: 'stage' + s.stage,
                name: stageName(s.stage),
                labelClass: cur === s.stage ? 'strong' : counted ? '' : 'muted',
                fillClass: 'fill fill-' + tone,
                barStyle: 'width:' + (counted ? pct : 0) + '%',
                count
            };
        });
    }

    get foot() {
        const c = this.calc;
        const src = c && !c.stored ? ' Shown from the live scores; the stored total refreshes on the next save.' : '';
        return 'Score = points earned ÷ points possible on milestones through the current stage. Partial scores count toward points; a milestone is complete only at full marks. Later stages are not counted until the deal reaches them.' + src;
    }

    // Earlier stages that still have open milestones: the deal moved on without them.
    get skipped() {
        const cur = this.model.current;
        if (cur === null) {
            return [];
        }
        return this.model.stages
            .filter((s) => s.stage < cur && s.open > 0)
            .map((s) => ({
                key: s.key,
                text: s.name + ' still has ' + s.open + ' open (' + s.items.filter((x) => !x.done).map((x) => x.label).join(', ') + ').'
            }));
    }

    get hasSkipped() {
        return this.skipped.length > 0;
    }
}