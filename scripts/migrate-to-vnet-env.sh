#!/bin/bash
set -euo pipefail

RG="rg-stelar-prod"
NEW_ENV="cae-stelar-prod-vnet"
EXPORT_DIR="/tmp/stelar-aca-migration"

APPS=(
  fullstack-gateway
  arkham-governance
  stelarvacay-api
  stelarpeople-api
  stelargem-api
  stelarvacay-web
  stelarpeople-web
  stelargem-web
  fullstack-dashboard
)

echo "======================================================"
echo "  DIRECT CUTOVER: Delete + Recreate in VNET env"
echo "  Using pre-exported YAMLs from $EXPORT_DIR"
echo "======================================================"

SUCCEEDED=0
FAILED=0

for APP in "${APPS[@]}"; do
  echo ""
  echo ">>> [$APP] Deleting from cae-stelar-prod..."
  az containerapp delete -n "$APP" -g "$RG" --yes --no-wait 2>&1 || true
done

# Wait for deletions to propagate
echo ""
echo ">>> Waiting 30s for deletions to propagate..."
sleep 30

for APP in "${APPS[@]}"; do
  echo ""
  echo ">>> [$APP] Creating in $NEW_ENV..."
  
  YAML="$EXPORT_DIR/${APP}-vnet.yaml"
  if [ ! -f "$YAML" ]; then
    echo "    No patched YAML found, re-exporting is not possible (app deleted). Skipping."
    FAILED=$((FAILED + 1))
    continue
  fi

  if az containerapp create \
    -n "$APP" \
    -g "$RG" \
    --environment "$NEW_ENV" \
    --yaml "$YAML" \
    --output none 2>&1; then
    echo "    ✅ $APP deployed to VNET env"
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    echo "    ❌ $APP failed — retrying without --yaml..."
    # If YAML fails, the app name might still be propagating. Wait and retry.
    sleep 10
    if az containerapp create \
      -n "$APP" \
      -g "$RG" \
      --environment "$NEW_ENV" \
      --yaml "$YAML" \
      --output none 2>&1; then
      echo "    ✅ $APP deployed on retry"
      SUCCEEDED=$((SUCCEEDED + 1))
    else
      echo "    ❌ $APP failed on retry"
      FAILED=$((FAILED + 1))
    fi
  fi
done

echo ""
echo "======================================================"
echo "  Results: $SUCCEEDED succeeded, $FAILED failed"
echo "======================================================"
echo ""
echo "Listing apps in new environment:"
az containerapp list -g "$RG" \
  --query "[].{name:name, env:properties.managedEnvironmentId, status:properties.provisioningState}" \
  -o table
