import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { SKILL_URL } from 'c/dmAskPrompts';

export default class DmAskAssistantModal extends LightningModal {
    @api prompt = '';
    @api typeLabel = '';
    copied = false;
    copyFailed = false;

    get copyLabel() {
        return this.copied ? 'Copied' : 'Copy prompt';
    }

    async handleCopy() {
        this.copied = false;
        this.copyFailed = false;
        try {
            await navigator.clipboard.writeText(this.prompt);
            this.copied = true;
        } catch (e) {
            // Fallback: select the text so the user can copy it by hand.
            const box = this.refs ? this.refs.prompt : null;
            if (box) {
                const range = document.createRange();
                range.selectNodeContents(box);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
            let ok = false;
            try {
                ok = document.execCommand('copy');
            } catch (e2) {
                ok = false;
            }
            this.copied = ok;
            this.copyFailed = !ok;
        }
    }

    handleOpenSlack() {
        window.open(SKILL_URL, '_blank');
    }

    handleClose() {
        this.close('closed');
    }
}