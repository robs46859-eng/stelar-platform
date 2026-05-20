param location string
param containerAppsEnvId string
param keyVaultName string
param acrName string
param ollamaBridgeUrl string

var keyVaultSecretBaseUrl = 'https://${keyVaultName}${environment().suffixes.keyvaultDns}/secrets'

resource gatewayApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'fullstack-gateway'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: false, targetPort: 8000 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
      secrets: [
        { name: 'postgres-url', keyVaultUrl: '${keyVaultSecretBaseUrl}/POSTGRES-URL-PSYCOPG', identity: 'system' }
        { name: 'redis-url', keyVaultUrl: '${keyVaultSecretBaseUrl}/REDIS-URL', identity: 'system' }
        { name: 'ollama-bridge-secret', keyVaultUrl: '${keyVaultSecretBaseUrl}/OLLAMA-BRIDGE-SHARED-SECRET', identity: 'system' }
        { name: 'fullstack-api-key', keyVaultUrl: '${keyVaultSecretBaseUrl}/FULLSTACK-INTERNAL-API-KEY', identity: 'system' }
        { name: 'jwt-signing-key', keyVaultUrl: '${keyVaultSecretBaseUrl}/JWT-SIGNING-KEY', identity: 'system' }
      ]
    }
    template: {
      containers: [{
        name: 'fullstack-gateway'
        image: '${acrName}.azurecr.io/fullstack-gateway:latest'
        env: [
          { name: 'DATABASE_URL', secretRef: 'postgres-url' }
          { name: 'REDIS_URL', secretRef: 'redis-url' }
          { name: 'OLLAMA_BRIDGE_URL', value: ollamaBridgeUrl }
          { name: 'OLLAMA_BRIDGE_SHARED_SECRET', secretRef: 'ollama-bridge-secret' }
          { name: 'FULLSTACK_INTERNAL_API_KEY', secretRef: 'fullstack-api-key' }
          { name: 'JWT_SIGNING_KEY', secretRef: 'jwt-signing-key' }
          { name: 'DEFAULT_PROVIDER', value: 'gemma4_26b_ollama_vm' }
          { name: 'BACKEND_MODE', value: 'self_hosted' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 8000 } }
          { type: 'Readiness', httpGet: { path: '/ready', port: 8000 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

output gatewayFqdn string = gatewayApp.properties.configuration.ingress.fqdn
output gatewayIdentityPrincipalId string = gatewayApp.identity.principalId
