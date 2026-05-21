#!/usr/bin/env bash
set -euo pipefail

RG="${RG:-rg-stelar-prod}"
VNET="${VNET:-vnet-stelar-prod}"
CAE="${CAE:-cae-stelar-prod}"
OUT_DIR="${OUT_DIR:-graphify-out/live}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"

az containerapp list -g "$RG" \
  --query '[].{name:name,state:properties.runningStatus,fqdn:properties.configuration.ingress.fqdn}' \
  -o json > "$OUT_DIR/containerapps-$STAMP.json"

az containerapp env show -g "$RG" -n "$CAE" \
  --query '{name:name,provisioningState:properties.provisioningState,infrastructureSubnetId:properties.infrastructureSubnetId,staticIp:properties.staticIp}' \
  -o json > "$OUT_DIR/containerapp-env-$STAMP.json"

az network vnet show -g "$RG" -n "$VNET" \
  --query '{name:name,addressSpace:addressSpace.addressPrefixes,subnets:subnets[].{name:name,prefix:addressPrefix,privateEndpointNetworkPolicies:privateEndpointNetworkPolicies,id:id}}' \
  -o json > "$OUT_DIR/vnet-$STAMP.json"

cat > "$OUT_DIR/latest.json" <<EOF
{
  "captured_at": "$STAMP",
  "resource_group": "$RG",
  "containerapps": "containerapps-$STAMP.json",
  "containerapp_environment": "containerapp-env-$STAMP.json",
  "vnet": "vnet-$STAMP.json"
}
EOF

echo "$OUT_DIR/latest.json"
