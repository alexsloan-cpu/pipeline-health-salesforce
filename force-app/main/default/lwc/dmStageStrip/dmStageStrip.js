import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { shown, num, toneOf, cleanHealth, currentStage, stageFieldNames, fieldList } from 'c/dmUtil';
import { stageName } from 'c/dmStages';

const FIELDS = fieldList(stageFieldNames());

export default class DmStageStrip extends LightningElement {
    @api recordId;
    record;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get stages() {
        const r = this.record;
        if (!r) {
            return [];
        }
        const cur = currentStage(r);
        const out = [];
        for (let i = 0; i <= 5; i++) {
            const total = num(r, 'Stage_' + i + '_Total__c');
            const done = num(r, 'Stage_' + i + '_Complete__c') || 0;
            if (!total) {
                continue;
            }
            const healthText = shown(r, 'S' + i + '_Health__c');
            const tone = toneOf(healthText);
            const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
            const isCurrent = cur === i;
            out.push({
                key: 's' + i,
                name: stageName(i),
                health: cleanHealth(healthText).label,
                count: done + ' of ' + total,
                boxClass: isCurrent ? 'box box-current' : 'box',
                fillClass: 'fill fill-' + tone,
                barStyle: 'width:' + pct + '%',
                isCurrent
            });
        }
        return out;
    }

    get hasStages() {
        return this.stages.length > 0;
    }
}