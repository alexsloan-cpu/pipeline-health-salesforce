import { LightningElement, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_ID from '@salesforce/user/Id';
import VIEW_FIELD from '@salesforce/schema/User.PH_View__c';

const DEFAULT_VIEW = 'Cockpit';

export default class DmViewPicker extends LightningElement {
    view = DEFAULT_VIEW;
    saving = false;

    options = [
        { label: 'Cockpit', value: 'Cockpit' },
        { label: 'Forecast Call', value: 'Forecast Call' },
        { label: 'Standard', value: 'Standard' }
    ];

    @wire(getRecord, { recordId: USER_ID, fields: [VIEW_FIELD] })
    wiredUser({ data }) {
        if (data && data.fields.PH_View__c) {
            this.view = data.fields.PH_View__c.value || DEFAULT_VIEW;
        }
    }

    async handleChange(event) {
        const next = event.detail.value;
        if (next === this.view) {
            return;
        }
        this.saving = true;
        try {
            await updateRecord({ fields: { Id: USER_ID, PH_View__c: next } });
            this.view = next;
            // Component visibility reads the saved user value, so reload to apply it.
            window.location.reload();
        } catch (e) {
            this.saving = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Could not switch view',
                message: (e && e.body && e.body.message) || 'Check that you have the PH View Preference permission set.',
                variant: 'error'
            }));
        }
    }
}