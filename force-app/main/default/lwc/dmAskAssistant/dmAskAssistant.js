import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { shown, cleanHealth } from 'c/dmUtil';
import { resolveLayout } from 'c/dmStages';
import { MODE, SLACK_APP_URL, TYPE_LABELS, fillPrompt } from 'c/dmAskPrompts';
import DmAskAssistantModal from 'c/dmAskAssistantModal';

const FIELDS = [
    'Deal_Milestones__c.Name',
    'Deal_Milestones__c.Opportunity__c',
    'Deal_Milestones__c.Opportunity__r.Name',
    'Deal_Milestones__c.Opportunity__r.StageName',
    'Deal_Milestones__c.Opportunity__r.CloseDate',
    'Deal_Milestones__c.Opportunity__r.Amount',
    'Deal_Milestones__c.Opportunity__r.Account.Name',
    'Deal_Milestones__c.Close_Likelihood_Score__c',
    'Deal_Milestones__c.Overall_Health__c',
    'Deal_Milestones__c.Opportunity_Health_Score__c',
    'Deal_Milestones__c.Active_Risk_Signal__c',
    'Deal_Milestones__c.RecordType.DeveloperName'
];

// Walks a relationship path such as Opportunity__r.Account.Name on a UI API record.
function rel(rec, path) {
    let cur = rec;
    const parts = path.split('.');
    for (let i = 0; i < parts.length; i++) {
        const f = cur && cur.fields ? cur.fields[parts[i]] : null;
        if (!f) {
            return null;
        }
        if (i === parts.length - 1) {
            return f.displayValue !== null && f.displayValue !== undefined ? f.displayValue : f.value;
        }
        cur = f.value;
    }
    return null;
}

export default class DmAskAssistant extends LightningElement {
    @api recordId;
    @api layout = 'newBusiness';
    @api variant = 'link';
    // Page level use (Command Center): a ready made prompt instead of a record prompt.
    @api customPrompt;
    @api customLabel;
    record;

    @wire(getRecord, { recordId: '$recordId', optionalFields: FIELDS })
    wiredRecord({ data }) {
        if (data) {
            this.record = data;
        }
    }

    // Resolves 'auto' to the record's own record type so one page can serve several types.
    get effectiveLayout() {
        return resolveLayout(this.layout, this.record);
    }

    get btnClass() {
        return this.variant === 'button' ? 'ask ask-btn' : 'ask';
    }

    get disabled() {
        return !this.record && !this.customPrompt;
    }

    get prompt() {
        if (this.customPrompt) {
            return this.customPrompt;
        }
        const r = this.record;
        const health = cleanHealth(shown(r, 'Overall_Health__c'));
        return fillPrompt(this.effectiveLayout, {
            OppName: rel(r, 'Opportunity__r.Name') || shown(r, 'Name'),
            Account: rel(r, 'Opportunity__r.Account.Name'),
            OppId: shown(r, 'Opportunity__c'),
            RecordId: this.recordId,
            RecordType: TYPE_LABELS[this.effectiveLayout] || TYPE_LABELS.newBusiness,
            Stage: rel(r, 'Opportunity__r.StageName'),
            CloseDate: rel(r, 'Opportunity__r.CloseDate'),
            Amount: rel(r, 'Opportunity__r.Amount'),
            CloseConfidence: shown(r, 'Close_Likelihood_Score__c'),
            Health: health.label + (health.detail ? ' (' + health.detail + ')' : ''),
            Completion: shown(r, 'Opportunity_Health_Score__c'),
            Risk: shown(r, 'Active_Risk_Signal__c')
        });
    }

    get typeLabel() {
        if (this.customPrompt) {
            return this.customLabel || 'Deal Health view';
        }
        return TYPE_LABELS[this.effectiveLayout] || TYPE_LABELS.newBusiness;
    }

    // Copies text with the Clipboard API first, then a hidden textarea and execCommand.
    // Returns '' on success, or the reason it failed (shown in a toast so the cause is visible).
    async copyText(text) {
        let reason = '';
        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                throw new Error('Clipboard API not available in this page');
            }
            await navigator.clipboard.writeText(text);
            return '';
        } catch (e) {
            reason = 'Clipboard API: ' + ((e && (e.name || '')) + ' ' + (e && e.message ? e.message : '')).trim();
        }
        try {
            const box = this.refs ? this.refs.copybox : null;
            if (!box) {
                throw new Error('copy box missing');
            }
            box.value = text;
            box.focus();
            box.select();
            const ok = document.execCommand('copy');
            box.value = '';
            if (ok) {
                return '';
            }
            reason += ' | execCommand returned false';
        } catch (e2) {
            reason += ' | execCommand: ' + ((e2 && e2.message) || 'failed');
        }
        return reason;
    }

    async handleClick() {
        const prompt = this.prompt;
        if (MODE === 'slack' && SLACK_APP_URL) {
            // Slack links cannot carry text, so copy the prompt first, then open the app.
            const failure = await this.copyText(prompt);
            if (!failure) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Prompt copied',
                    message: this.customPrompt
                        ? 'Paste it into Deal Assistant to ask about this view.'
                        : 'Paste it into Deal Assistant to ask about this deal.',
                    variant: 'success'
                }));
                window.open(SLACK_APP_URL, '_blank');
                return;
            }
            // Copy blocked: say why, then show the pop up, which has a manual copy.
            this.dispatchEvent(new ShowToastEvent({
                title: 'Could not copy automatically',
                message: failure,
                variant: 'warning',
                mode: 'sticky'
            }));
        }
        await DmAskAssistantModal.open({
            size: 'medium',
            label: 'Ask Deal Assistant',
            prompt,
            typeLabel: this.typeLabel
        });
    }
}