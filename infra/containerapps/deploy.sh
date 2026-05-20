#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RG="${RG:-rg-stelar-prod}"
LOCATION="${LOCATION:-eastus2}"
CONTAINER_APPS_ENV_NAME="${CONTAINER_APPS_ENV_NAME:-cae-stelar-prod}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-kv-stelar-prod}"
ACR_NAME="${ACR_NAME:-acrstelarprod}"

echo "Deploying Stelar Platform to $RG..."
az deployment group create \
  --resource-group $RG \
  --template-file "$SCRIPT_DIR/main.bicep" \
  --parameters \
    location="$LOCATION" \
    containerAppsEnvName="$CONTAINER_APPS_ENV_NAME" \
    keyVaultName="$KEY_VAULT_NAME" \
    acrName="$ACR_NAME"
echo "Deployment complete."
