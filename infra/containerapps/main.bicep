targetScope = 'resourceGroup'

param location string = 'eastus2'
param containerAppsEnvName string = 'cae-stelar-prod'
param keyVaultName string = 'kv-stelar-prod'
param acrName string = 'acrstelarprod'

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: containerAppsEnvName
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: keyVaultName
}

module gateway 'fullstack-gateway.bicep' = {
  name: 'deploy-fullstack-gateway'
  params: { location: location, containerAppsEnvId: containerAppsEnv.id, keyVaultName: keyVaultName, acrName: acrName }
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
