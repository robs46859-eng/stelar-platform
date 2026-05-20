param location string
param containerAppsEnvId string
param keyVaultName string
param acrName string

var keyVaultSecretBaseUrl = 'https://${keyVaultName}${environment().suffixes.keyvaultDns}/secrets'

resource arkhamGovernanceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'arkham-governance'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: false, targetPort: 8001 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
      secrets: [
        { name: 'postgres-url', keyVaultUrl: '${keyVaultSecretBaseUrl}/POSTGRES-URL', identity: 'system' }
        { name: 'fullstack-api-key', keyVaultUrl: '${keyVaultSecretBaseUrl}/FULLSTACK-INTERNAL-API-KEY', identity: 'system' }
      ]
    }
    template: {
      containers: [{
        name: 'arkham-governance'
        image: 'acrstelarprod.azurecr.io/arkham-governance:latest'
        env: [
          { name: 'POSTGRES_URL', secretRef: 'postgres-url' }
          { name: 'FULLSTACK_INTERNAL_API_KEY', secretRef: 'fullstack-api-key' }
          { name: 'DEPLOYMENT_START_DATE', value: '2026-05-20' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/health', port: 8001 } }
          { type: 'Readiness', httpGet: { path: '/ready', port: 8001 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output arkhamGovernanceFqdn string = arkhamGovernanceApp.properties.configuration.ingress.fqdn
output arkhamGovernanceIdentityPrincipalId string = arkhamGovernanceApp.identity.principalId
