#!/bin/bash
set -e
RG="rg-stelar-prod"
echo "Deploying Stelar Platform to $RG..."
az deployment group create \
  --resource-group $RG \
  --template-file infra/containerapps/main.bicep \
  --parameters location=eastus2 containerAppsEnvName=cae-stelar-prod keyVaultName=kv-stelar-prod acrName=acrstelarprod
echo "Deployment complete."
