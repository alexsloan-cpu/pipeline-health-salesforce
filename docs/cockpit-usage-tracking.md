# AE Cockpit usage tracking

Goal: prove that sellers open the AE and BDR Cockpit, see which tabs they use, and see whether they act on what it shows. Two sources, so the numbers can be checked against each other.

| Source | What it shows | Build needed | Who can change it |
|---|---|---|---|
| Cockpit Usage Days (new, this package) | Per seller per day: page loads, active minutes, tab views, actions taken | Yes, this package | Only the cockpit, through Apex |
| Lightning Usage by Page (standard, already on) | Per user per day: page views for any Lightning page | None | Nobody, Salesforce writes it |

Event Monitoring is also licensed in the org (LightningPageView, LightningInteraction and URI logs, daily, 30 day retention). It is the audit trail if a number is ever disputed. We don't need it for day-to-day reporting.

## What gets recorded

`Cockpit_Usage_Day__c`: one row per seller, cockpit (AE or BDR) and day, in the seller's time zone. Every call adds to that day's row.

| Field | Counts |
|---|---|
| Page Loads | Times the cockpit page loaded |
| Active Minutes | Time the page was visible and the seller clicked, typed or scrolled in the last 60 seconds. A page left open in a background tab does not count |
| Views: My Day, Immediate Actions, Pipeline and Forecast, Build Pipeline | AE tab opens. BDR Speed to Lead, Sourced Pipeline and Prospecting count in the matching AE field |
| Views: My Number, Account Intel | BDR-only tabs |
| Deal Health Records Opened | Deal Health records opened from the cockpit |
| Actions Completed / Dismissed | Signals or actions marked done or acted on, and signals dismissed or snoozed |
| Deal Updates Saved | Saves of stage, close date, forecast category, amount, next step or MEDDIC |
| Emails Drafted, Assistant Questions, Account Lookups | One per use |
| First Seen, Last Seen | First and last activity that day |
| Took an Action (formula) | True when the seller did more than look |
| Manager (formula) | The seller's manager, for team rollups |

Not recorded: what the seller typed, which records they looked at, email content, Deal Assistant questions or answers. Counts only.

## How it works

1. `c/ckUsage` (LWC service module, no markup) keeps counts in the browser.
2. It sends them to `CockpitUsageController.track` about once a minute, 3 seconds after the page loads, and whenever the seller switches browser tabs or leaves the page. At most one small Apex call a minute per seller.
3. The controller adds the counts to the day's row. Unknown keys are dropped. No single call can add more than 200 to a counter or 30 active minutes, so a bug can't inflate the numbers.
4. Tracking never breaks the page: the module swallows every error, and so does the controller.

Wiring in the cockpit shell:

```js
import { startUsage, trackTab, trackEvent, stopUsage } from 'c/ckUsage';

connectedCallback()    { startUsage(this.isBdr ? 'BDR' : 'AE'); trackTab(this.activeTab); }
handleTab(e)           { trackTab(e.detail.key); }      // day, actions, pipe, build, protect, forecast, accounts
handleDone()           { trackEvent('action:done'); }
handleDismiss()        { trackEvent('action:dismiss'); }
handleSave()           { trackEvent('update:save'); }
handleOpenRecord()     { trackEvent('record:open'); }
handleDraft()          { trackEvent('email:draft'); }
handleAsk()            { trackEvent('assistant:ask'); }
handleLookup()         { trackEvent('account:lookup'); }
disconnectedCallback() { stopUsage(); }
```

## Access

- Records are private and owned by the seller. Sellers can't read or edit them; only the controller writes.
- `Cockpit_Usage_Logger`: Apex class access only. Assign to every cockpit user, alongside the cockpit's own permission set.
- `Cockpit_Usage_Reporting`: read all usage rows. Assign to RevOps and sales leaders.

Storage: about 70 sellers × 21 workdays a month is about 1,500 rows a month, roughly 3 MB a month. No purge job is needed for the first year.

## Reports (folder: Cockpit Adoption)

- **Cockpit active sellers this week**: by manager, then seller. Days used, page loads, active minutes, actions, saves, records opened.
- **Cockpit daily active sellers, 30 days**: one row per seller-day, so the record count is daily active sellers. AE and BDR are split into separate columns.
- **Cockpit tab and action mix, 30 days**: which tabs and actions get used, by manager.
- **Sellers with no cockpit use in 7 days**: active AEs with no usage row in the last 7 days. This is the list for the manager 1:1s.

Dashboard: build it from these four reports in the UI after the first deploy. It needs a running user, so it isn't in source.

## Adoption metrics for the pilot and launch

| Metric | Definition | Pilot target (Jan.) | Launch target (Feb. to Mar.) |
|---|---|---|---|
| Weekly active | Share of in-scope sellers with a usage row on 3 or more workdays that week | 80% | 70% |
| Daily active | Sellers with a row that day ÷ in-scope sellers | 60% | 50% |
| Working, not glancing | Share of seller-days where Took an Action is true | 50% | 40% |
| Forecast hygiene | Deal Updates Saved per seller per week | 3 | 3 |

These targets are proposals until Courtney and the managers agree them.

## Cross-check against the standard source

Lightning Usage by Page counts page views per user per day for every Lightning page, including the cockpit's app page. Run this weekly in the pilot. The two counts should be close; a big gap means the tracker isn't wired on a path.

```sql
SELECT User.Name, MetricsDate, SUM(TotalCount) views
FROM LightningUsageByPageMetrics
WHERE PageName LIKE 'AE_Cockpit%' AND MetricsDate = LAST_N_DAYS:7
GROUP BY User.Name, MetricsDate
```

Replace `AE_Cockpit%` with the cockpit FlexiPage's real API name once it exists.

## Baseline today (Nov. 10, 2026, from Lightning Usage by Page)

In the last 30 days, 6 of 38 active AEs opened a Deal Health record, for 8 views in total. Most views came from RevOps and admins. That is the number to beat.

## Deploy

Not deployed. Validate only:

```
sf project deploy validate --manifest manifest/cockpit_usage_package.xml --target-org iterable-prod \
  --test-level RunSpecifiedTests --tests CockpitUsageControllerTest
```

Order: object and fields, permission sets, Apex, LWC, report types, report folder and reports. Then assign `Cockpit_Usage_Reporting` to RevOps. Assign `Cockpit_Usage_Logger` to cockpit users when the cockpit ships.
