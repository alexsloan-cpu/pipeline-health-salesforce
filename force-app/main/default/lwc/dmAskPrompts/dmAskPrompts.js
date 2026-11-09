// Ask Deal Assistant: one prompt per record type, plus the Slack links.
// Edit prompts here. {Placeholders} are filled from the Deal Milestones record when the link is clicked.

// Slack app is installed (App A0CANBM3PP0, workspace T02ECMZDM). The link copies the prompt, then opens the app.
// Set MODE back to 'modal' to fall back to the pop up. The prompts do not change.
export const MODE = 'slack';
export const SLACK_APP_URL = 'https://slack.com/app_redirect?app=A0CANBM3PP0&team=T02ECMZDM&tab=messages';
export const SKILL_URL =
    'https://app.slack.com/skill/F0CABRKGYQ3/enQtMTIzNjY0NDk1MzUxODYtYzFlNGQ5MWU4NWIxMDQzMWYzYWViMjI2MjU3ZmQ4NWY1Y2ViOTNmYjJhYTJjYWYxMGYyODJjMTZjNzc4N2E4Ng';

const HEADER =
    'Deal: {OppName} ({Account})\n' +
    'Opportunity ID: {OppId} | Deal Milestones ID: {RecordId}\n' +
    'Record type: {RecordType} | Stage: {Stage} | Close date: {CloseDate} | Amount: {Amount}\n' +
    'Close Confidence: {CloseConfidence} | Close Health: {Health} | Milestone completion: {Completion} | Active risk signal: {Risk}\n\n';

const RULES =
    '\n\nRules: cite the source and date for every claim (call, email, Slack message or Salesforce field). ' +
    'If the record has nothing on a point, say "the record is silent" instead of guessing. ' +
    'Do not infer progress or risk from blank fields or elapsed time. Keep it under 300 words.';

export const PROMPTS = {
    newBusiness:
        HEADER +
        'Give me a New Business deal overview for this opportunity:\n' +
        '1. Where the deal really stands against the stage milestones (Identify through Negotiate), and which milestones in the current stage are still open.\n' +
        '2. Pain and Why Iterable: the quantified pain, who acknowledged it, and why they are choosing us.\n' +
        '3. People: the champion, the economic buyer, and how many stakeholders are engaged across functions.\n' +
        '4. Compelling event and competition: the forcing date and consequence, and who else is in the evaluation.\n' +
        '5. Technical fit and paper process: open blockers, legal, security and procurement steps left.\n' +
        '6. Is the close date realistic? Call out buyer momentum, missed next steps and slip signals.\n' +
        '7. The three actions that would most raise Close Confidence in the next two weeks, with an owner for each.' +
        RULES,
    organicGrowth:
        HEADER +
        'Give me a Midterm Organic Growth (uplift) overview for this opportunity:\n' +
        '1. Usage against contract: current consumption, overage or the trend toward it, and the source of those numbers.\n' +
        '2. The growth driver: the customer goal or initiative behind the extra volume, in their words.\n' +
        '3. CAM and CSM alignment: is there a shared view of the opportunity and any health or relationship risk?\n' +
        '4. Commercials: what has been presented, the customer reaction, funding owner and budget status.\n' +
        '5. Paper process: approvals, signatory and the steps left before DocuSign.\n' +
        '6. Risk that this turns into a downgrade or slips past the close date.\n' +
        '7. The three next actions that would move this to signature, with an owner for each.' +
        RULES,
    newProduct:
        HEADER +
        'Give me a Midterm New Product overview for this opportunity:\n' +
        '1. The use case: which product or channel, the customer business goal it serves, and whether the customer has confirmed the link.\n' +
        '2. Discovery: what was validated and which current-state gaps were quantified.\n' +
        '3. Stakeholders and champion for the new product, and who signs.\n' +
        '4. Solution and technical fit: demo status, integration requirements and open blockers.\n' +
        '5. Commercials: pricing presented, customer reaction, funding owner, and the paper process left.\n' +
        '6. Anything that could stall it: competing priorities, implementation capacity, missed next steps.\n' +
        '7. The three next actions that would move this to signature, with an owner for each.' +
        RULES,
    renewal:
        HEADER +
        'Give me a Renewal overview for this opportunity:\n' +
        '1. Account health: usage against contract by product, Customer Health, support issues, and relationship friction.\n' +
        '2. Churn and downgrade risk: if this customer churned or downgraded, why would they? Name competitors or in-house alternatives mentioned.\n' +
        '3. Value and white space: documented use cases, value delivered, and any expansion that could offset a downgrade.\n' +
        '4. Stakeholders: who is engaged in the renewal decision, and is the signatory engaged directly?\n' +
        '5. Commercials: proposal status, customer reaction to price, funding owner, and the paper process left.\n' +
        '6. Is the renewal on track for the close date and at what likely amount versus the current contract?\n' +
        '7. The three next actions that would protect this renewal, with an owner for each.' +
        RULES
};

export const TYPE_LABELS = {
    newBusiness: 'New Business',
    organicGrowth: 'Midterm Organic Growth',
    newProduct: 'Midterm New Product',
    renewal: 'Renewal'
};

export function fillPrompt(layout, values) {
    const template = PROMPTS[layout] || PROMPTS.newBusiness;
    return template.replace(/\{(\w+)\}/g, (m, key) => {
        const v = values[key];
        return v === null || v === undefined || v === '' ? 'not on record' : String(v);
    });
}