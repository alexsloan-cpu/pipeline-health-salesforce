#!/usr/bin/env bash
# Deployment dry run against production. Validates only, deploys nothing.
# Usage: ./scripts/dry-run.sh            (all components in manifest/package.xml)
set -euo pipefail
cd "$(dirname "$0")/.."

ORG="${SF_ORG_ALIAS:-iterable-prod}"

git pull --ff-only
echo "Dry run against $ORG at $(date '+%Y-%m-%d %H:%M')"

if ! sf org display --target-org "$ORG" >/dev/null 2>&1; then
  echo "Not logged in to $ORG. Run: sf org login web --alias $ORG"
  exit 1
fi

LEVEL="RunLocalTests"

sf project deploy validate \
  --manifest manifest/package.xml \
  --target-org "$ORG" \
  --test-level "$LEVEL" \
  --wait 60

echo
echo "Dry run passed. Nothing was deployed."
echo "To deploy (only with Alex's explicit approval): sf project deploy quick --job-id <jobId> --target-org $ORG"
