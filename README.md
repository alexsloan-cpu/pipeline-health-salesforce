# Pipeline Health: AE Cockpit and Deal Health (Salesforce)

Source of truth for the Salesforce build behind the AE Cockpit and Deal Health artifacts. Production org: Iterable, API v68.0.

Technical build sheet (components, dry-run results, open questions, change log): https://docs.google.com/document/d/1lxhG9DbXRhRix8zNgSm-0Wd88ESod891d9ukkw1uRpE/edit

## Layout

- `manifest/package.xml`: every component in scope, by type
- `force-app/main/default/lwc/`: 28 dm* Lightning web components (synced from prod 2026-11-09)
- `sfdx-project.json`: project config

Not yet in the repo: objects and fields, Apex, flows, FlexiPages, permission sets. Pull them with the retrieve command below.

## Sync source from prod

```
sf org login web --alias iterable-prod
sf project retrieve start --manifest manifest/package.xml --target-org iterable-prod
git add -A && git commit -m "Retrieve prod source" && git push
```

## Dry run any time

```
./scripts/dry-run.sh
```

Validates everything in `manifest/package.xml` against production with all local tests. Deploys nothing. Run it after any change to files under `force-app`. A pass gives a job id that can be quick deployed with approval.


Never use `sf project deploy start` on production. Validate, get explicit approval, then quick deploy.

```
sf project deploy validate --manifest manifest/package.xml --target-org iterable-prod --test-level RunLocalTests
sf project deploy quick --job-id <jobId> --target-org iterable-prod
```

Deploy order: objects and fields, permission sets, Apex, LWC, FlexiPages, Flows as Draft, then flow activation.

## Flow status in prod

Active: PH_Calc_Health, PH_Notify_Fault, PH_Momentum_Update_Stamps, Deal_Milestone_Update_Checkbox_to_FALSE, Deal_Milestone_After_Save_Related_Opp_Update.
Inactive: Deal_Milestones_S, Deal_Milestone_Tag_Prior_Health_Score, Deal_Milestone_Tag_Close_Score_Pre_Close.

## Production state (checked 2026-11-09)

Pipeline Pod is not being implemented and is already gone from prod. The destructive validate returned "No ApexClass named ... found" for all four pod classes.

Also no longer in prod as of today: PhCommandCenterController, PhDashboardAction, PhDashboardApi, PhForecastCallController, PhForecastSnapshotJob, PhUsageController (and their tests), plus the PH_Forecast_Snapshot__c and Account_Usage__c objects. They are removed from `manifest/package.xml` so retrieve and deploy match prod. If the artifacts still need any of them, they are net-new builds.
