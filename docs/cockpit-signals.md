# AE Cockpit: signal sources and build notes

Updated Nov 9, 2026. The artifacts are the source of truth for the UI until go-live:

- AE Cockpit: https://claude.ai/artifact/PkLLEmBQUfqHaPLRtUei29
- Deal Health: https://claude.ai/artifact/7wJWZNLL7wC7h1VVB4fn2N

The artifacts hold a snapshot of real records, so their HTML is not committed here. This file records where every card gets its data, so the systems team can build each card on standard objects. No customer data in this repo.

## Signal sources

| Card or signal | Source | Fields or query |
| --- | --- | --- |
| UserGems: champion or contact left | Contact (UserGems package) | `UserGems__HasChangedJob__c = LAST_N_DAYS:45 AND UserGems__UserGemsTypeNew__c = null AND Title != null` |
| UserGems: past Iterable users on an open deal | Contact | `UserGems__UserGemsTypeNew__c LIKE 'Past customer is at account with open opp%'`, plus `UserGems__PastAccount__r.Name`, `UserGems__PastTitle__c` |
| UserGems: past user joined an account | Contact | `UserGems__Is_a_UserGem__c = true AND UserGems__IsPersonaMatching__c = true AND UserGems__JobStartedDate__c = LAST_N_DAYS:240` |
| Displacement windows | Account | `Current_Vendor__c`, `Current_Vendor_Contract_End_Date__c` (Momentum fills both from calls). Show end dates in the next 6 months. An end date in the past is rolled forward a year and labeled Estimated |
| Website tag changes | BuiltWith API (Domain and Change endpoints) | Email, push, SMS and CDP tags only. Stored in the new Account fields below |
| ZoomInfo tech stack | Account | `ZI_Tech_Stack__c`, `ZI_Marketing_Automation_Tech_Stack__c` (no dates, used as context only) |
| Single-threaded Priority 1 accounts | Task | `COUNT_DISTINCT(WhoId)` by AccountId, `CreatedDate = LAST_N_DAYS:90`, `Account.Priority__c = 'Priority 1 - Active'`; flag 1 or 2. Suggested contacts: untouched contacts with marketing, CRM, lifecycle or growth titles |
| Call recording coverage | Momentum meeting records on the opportunity | Recorded call count per deal. 1 or fewer flags Close Health as low confidence |
| Forecast call update | Deal Health record, OpportunityContactRole, Account, Next Step History | Pain and value, contacts, success criteria, incumbent, competition, next steps, risk |
| Account lookup | All of the above | Filter every signal to one account |
| Champions who left your customers | Contact (UserGems) on accounts where Type is Customer | Empty state when there are none |

Note: `Priority__c` values are `Priority 1 - Active`, `Priority 2 - Developing`, `Priority 3 - Watch List`, `Priority 4 - Cold/No Engagement`. Use Priority 1 and `Marketing_Tiers__c = 'Tier 1'`, never ICP tier.

## New fields (Account only, no Opportunity fields)

In `force-app/main/default/objects/Account/fields/`, with read and edit in the `BuiltWith_Signals` permission set:

| Field | Type | Purpose |
| --- | --- | --- |
| `BuiltWith_CEP_Current__c` | Long text (2000) | Email, push, SMS and CDP tools detected now |
| `BuiltWith_Last_Change__c` | Text area | Latest add or removal |
| `BuiltWith_Last_Change_Date__c` | Date | When it changed |
| `BuiltWith_Competitor_Added__c` | Text (255) | Competitor first detected in the last 90 days |
| `BuiltWith_Competitor_Removed__c` | Text (255) | Competitor no longer detected in the last 180 days |
| `BuiltWith_Last_Checked__c` | Date/time | Last scan |

Open item: how the fields get written (scheduled Apex callout with a Named Credential, or the existing Zapier pattern). See the build sheet.

## Demo layers

`mockup/deal_health_demo_layer.html` is the script added to the Deal Health artifact so every button works in a demo: Salesforce links on the facts strip, contacts and snapshots; All actions; Update Forecast Category (70% Commit, 45% Best Case rule); Ask Deal Assistant; Request Health Update; Delete; New snapshot. It changes only the page, never Salesforce.
