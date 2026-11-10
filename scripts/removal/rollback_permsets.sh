#!/usr/bin/env bash
# Restores assignments from the snapshot.
set -euo pipefail
ORG="${SF_ORG_ALIAS:-iterable-prod}"
python3 -I - <<'P'
import csv
r=list(csv.DictReader(open('backup/psa_snapshot.csv')))
w=csv.writer(open('backup/psa_restore.csv','w',newline=''),lineterminator='\n')
w.writerow(['AssigneeId','PermissionSetId'])
for x in r: w.writerow([x['AssigneeId'],x['PermissionSetId']])
P
sf data import bulk --sobject PermissionSetAssignment --file backup/psa_restore.csv --target-org "$ORG" --wait 10
