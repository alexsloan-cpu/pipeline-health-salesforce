#!/usr/bin/env bash
# Rollback snapshot. Writes to ./backup (gitignored, contains user data, never commit).
set -euo pipefail
ORG="${SF_ORG_ALIAS:-iterable-prod}"
mkdir -p backup
PS="'PH_Admin','PH_Classic','PH_Pipeline_Health_Access','PH_Usage_Writer','PH_User'"
sf data query --target-org "$ORG" --result-format csv \
  -q "SELECT Id, AssigneeId, PermissionSetId, PermissionSet.Name FROM PermissionSetAssignment WHERE PermissionSet.Name IN ($PS)" > backup/psa_snapshot.csv
sf data query --target-org "$ORG" --use-tooling-api --result-format csv \
  -q "SELECT DeveloperName, ActiveVersionId FROM FlowDefinition WHERE DeveloperName IN ('Deal_Milestone_After_Save_Related_Opp_Update','Deal_Milestone_Update_Checkbox_to_FALSE','PH_Calc_Health','PH_Momentum_Update_Stamps','PH_Notify_Fault')" > backup/flows_active_snapshot.csv
echo "Rows saved: $(($(wc -l < backup/psa_snapshot.csv)-1)) permission set assignments"
