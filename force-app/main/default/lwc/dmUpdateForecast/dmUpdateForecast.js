import { LightningElement, api, wire } from 'lwc';
import { getRecord, notifyRecordUpdateAvailable } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import DmUpdateForecastModal from 'c/dmUpdateForecastModal';

const FIELDS = ['Deal_Milestones__c.Opportunity__c', 'Deal_Milestones__c.Close_Likelihood_Score__c'];

export default class DmUpdateForecast extends LightningElement {
    @api recordId;
    @api opportunityId;
    @api compact = false;
    @api secondary = false;
    record;

    // Standalone on a page the component reads the opportunity from the Deal Milestones record.
    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    get oppId() {
        if (this.opportunityId) {
            return this.opportunityId;
        }
        const f = this.record && this.record.fields ? this.record.fields.Opportunity__c : null;
        return f ? f.value : null;
    }

    get conf() {
        const f = this.record && this.record.fields ? this.record.fields.Close_Likelihood_Score__c : null;
        return f && f.value !== null && f.value !== undefined ? Number(f.value) : null;
    }

    get disabled() {
        return !this.oppId;
    }

    get cardClass() {
        return this.compact ? 'wrap-compact' : 'card';
    }

    get btnClass() {
        return this.secondary ? 'btn' : 'btn btn-primary';
    }

    get notCompact() {
        return !this.compact;
    }

    async handleOpen() {
        const result = await DmUpdateForecastModal.open({
            size: 'small',
            label: 'Update Forecast Category',
            opportunityId: this.oppId,
            closeConfidence: this.conf
        });
        if (result === 'saved') {
            const ids = [{ recordId: this.oppId }];
            if (this.recordId) {
                ids.push({ recordId: this.recordId });
            }
            await notifyRecordUpdateAvailable(ids);
            this.dispatchEvent(new ShowToastEvent({ title: 'Forecast updated', message: 'Owner Forecast Category and Next Step saved.', variant: 'success' }));
        }
    }
}