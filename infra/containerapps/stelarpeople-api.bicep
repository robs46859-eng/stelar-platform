param location string
param containerAppsEnvId string
param keyVaultName string
param acrName string

resource stelarpeopleApiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'stelarpeople-api'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: true, targetPort: 3847 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
      secrets: [
        { name: 'postgres-url', keyVaultUrl: 'https://${keyVaultName}.vault.azure.net/secrets/POSTGRES-URL', identity: 'system' }
        { name: 'fullstack-api-key', keyVaultUrl: 'https://${keyVaultName}.vault.azure.net/secrets/FULLSTACK-INTERNAL-API-KEY', identity: 'system' }
        { name: 'jwt-signing-key', keyVaultUrl: 'https://${keyVaultName}.vault.azure.net/secrets/JWT-SIGNING-KEY', identity: 'system' }
      ]
    }
    template: {
      containers: [{
        name: 'stelarpeople-api'
        image: '${acrName}.azurecr.io/stelarpeople-api:latest'
        env: [
          { name: 'POSTGRES_URL', secretRef: 'postgres-url' }
          { name: 'GATEWAY_URL', value: 'http://fullstack-gateway' }
          { name: 'FULLSTACK_INTERNAL_API_KEY', secretRef: 'fullstack-api-key' }
          { name: 'JWT_SIGNING_KEY', secretRef: 'jwt-signing-key' }
          { name: 'AMADEUS_CLIENT_ID', value: '' }
          { name: 'AMADEUS_CLIENT_SECRET', value: '' }
        ]
        resources: { cpu: '0.5', memory: '1Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 3847 } }
          { type: 'Readiness', httpGet: { path: '/ready', port: 3847 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output stelarpeopleApiFqdn string = stelarpeopleApiApp.properties.configuration.ingress.fqdn
output stelarpeopleApiIdentityPrincipalId string = stelarpeopleApiApp.identity.principalId
