import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { evidenceCategory } from 'c/dmStages';

export default class DmUpdateForecastModal extends LightningModal {
    @api opportunityId;
    @api closeConfidence;
    saving = false;
    errorText = '';

    get hint() {
        const cat = evidenceCategory(this.closeConfidence);
        if (!cat) {
            return 'No Close Confidence score yet, so there is no evidence suggestion.';
        }
        return 'Evidence suggests ' + cat + ' (Close Confidence ' + Math.round(this.closeConfidence) + '%).';
    }

    handleCancel() {
        this.close('cancel');
    }

    handleSave() {
        this.errorText = '';
        this.saving = true;
        this.template.querySelector('lightning-record-edit-form').submit();
    }

    handleSuccess() {
        this.saving = false;
        this.close('saved');
    }

    handleError(event) {
        this.saving = false;
        const d = event && event.detail ? event.detail : {};
        this.errorText = d.detail || d.message || 'Could not save. Check the values and try again.';
    }
}