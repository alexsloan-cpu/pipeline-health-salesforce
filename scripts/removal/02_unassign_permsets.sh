#!/usr/bin/env bash
# Deletes PH permission set assignments (NOT the permission sets). Run 01_snapshot.sh first.
set -euo pipefail
ORG="${SF_ORG_ALIAS:-iterable-prod}"
[ -f backup/psa_snapshot.csv ] || { echo "Run 01_snapshot.sh first"; exit 1; }
cut -d, -f1 backup/psa_snapshot.csv > backup/psa_ids.csv   # Id column
sf data delete bulk --sobject PermissionSetAssignment --file backup/psa_ids.csv --target-org "$ORG" --wait 10
