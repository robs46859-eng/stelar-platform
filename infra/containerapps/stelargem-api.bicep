param location string
param containerAppsEnvId string
param keyVaultName string
param acrName string

var keyVaultSecretBaseUrl = 'https://${keyVaultName}${environment().suffixes.keyvaultDns}/secrets'

resource stelargemApiApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'stelargem-api'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: true, targetPort: 3100 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
      secrets: [
        { name: 'postgres-url', keyVaultUrl: '${keyVaultSecretBaseUrl}/POSTGRES-URL', identity: 'system' }
        { name: 'fullstack-api-key', keyVaultUrl: '${keyVaultSecretBaseUrl}/FULLSTACK-INTERNAL-API-KEY', identity: 'system' }
        { name: 'jwt-signing-key', keyVaultUrl: '${keyVaultSecretBaseUrl}/JWT-SIGNING-KEY', identity: 'system' }
      ]
    }
    template: {
      containers: [{
        name: 'stelargem-api'
        image: '${acrName}.azurecr.io/stelargem-api:latest'
        env: [
          { name: 'POSTGRES_URL', secretRef: 'postgres-url' }
          { name: 'GATEWAY_URL', value: 'http://fullstack-gateway' }
          { name: 'FULLSTACK_INTERNAL_API_KEY', secretRef: 'fullstack-api-key' }
          { name: 'JWT_SIGNING_KEY', secretRef: 'jwt-signing-key' }
          { name: 'CORS_ALLOWED_ORIGINS', value: '' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 3100 } }
          { type: 'Readiness', httpGet: { path: '/ready', port: 3100 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output stelargemApiFqdn string = stelargemApiApp.properties.configuration.ingress.fqdn
output stelargemApiIdentityPrincipalId string = stelargemApiApp.identity.principalId
