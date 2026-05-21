targetScope = 'resourceGroup'

param location string = 'eastus2'
param containerAppsEnvName string = 'cae-stelar-prod-vnet'
param keyVaultName string = 'kv-stelar-prod'
param acrName string = 'acrstelarprod'
param ollamaBridgeUrl string

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvName
}

module gateway 'fullstack-gateway.bicep' = {
  name: 'deploy-fullstack-gateway'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName, ollamaBridgeUrl: ollamaBridgeUrl }
}

module stelarvacayApi 'stelarvacay-api.bicep' = {
  name: 'deploy-stelarvacay-api'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName }
  dependsOn: [gateway]
}

module stelarvacayWeb 'stelarvacay-web.bicep' = {
  name: 'deploy-stelarvacay-web'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, acrName: acrName }
  dependsOn: [stelarvacayApi]
}

module stelarpeople 'stelarpeople-api.bicep' = {
  name: 'deploy-stelarpeople-api'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName }
  dependsOn: [gateway]
}

module arkhamGovernance 'arkham-governance.bicep' = {
  name: 'deploy-arkham-governance'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName }
}

// created by SWARM-02
module stelargemApi 'stelargem-api.bicep' = {
  name: 'deploy-stelargem-api'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName }
  dependsOn: [gateway]
}

module stelarpeopleWeb 'stelarpeople-web.bicep' = {
  name: 'deploy-stelarpeople-web'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, acrName: acrName }
  dependsOn: [stelarpeople]
}

// created by SWARM-03
module stelargemWeb 'stelargem-web.bicep' = {
  name: 'deploy-stelargem-web'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, acrName: acrName }
  dependsOn: [stelargemApi]
}

// created by SWARM-03
module fullstackDashboard 'fullstack-dashboard.bicep' = {
  name: 'deploy-fullstack-dashboard'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, acrName: acrName }
  dependsOn: [gateway]
}

module storage 'storage.bicep' = {
  name: 'deploy-storage'
  params: { location: location }
}


// NOTE: Service Bus (sb-stelar-prod) removed — Standard SKU does not support
// private endpoints (PrivateEndpointInvalidSku). When AiSquad wiring needs
// message queues, use Azure Queue Storage on stelarstorageprod (already
// private-endpoint-secured via pe-stelarstorageprod-blob).
// See: storage.bicep → queueService / agentRunQueue / governanceQueue

