import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

// Toggles between the Deal Health Views page and the classic page for the same record.
// Salesforce renders one Lightning page per record per app, so each view lives in its own app:
// switching opens this record in the other app (set in App Builder: targetApp, e.g. c__PH_Classic).
export default class DmPageSwitcher extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api currentView = 'new';
    @api targetApp = '';
    @api newLabel = 'Deal Health view';
    @api classicLabel = 'Original layout';

    get options() {
        return [
            { label: this.newLabel, value: 'new' },
            { label: this.classicLabel, value: 'classic' }
        ];
    }

    get value() {
        return this.currentView === 'classic' ? 'classic' : 'new';
    }

    get disabled() {
        return !this.targetApp;
    }

    handleChange(event) {
        if (event.detail.value === this.value || !this.targetApp) {
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__app',
            attributes: {
                appTarget: this.targetApp,
                pageRef: {
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.recordId,
                        objectApiName: this.objectApiName || 'Deal_Milestones__c',
                        actionName: 'view'
                    }
                }
            }
        });
    }
}