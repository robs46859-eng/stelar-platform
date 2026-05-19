param location string
param containerAppsEnvId string
param acrName string
param viteApiUrl string = '/api'

resource stelarvacayWebApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'stelarvacay-web'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: true, targetPort: 4173 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
    }
    template: {
      containers: [{
        name: 'stelarvacay-web'
        image: '${acrName}.azurecr.io/stelarvacay-web:latest'
        env: [
          { name: 'VITE_API_URL', value: viteApiUrl }
        ]
        resources: { cpu: '0.25', memory: '0.5Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/', port: 4173 } }
          { type: 'Readiness', httpGet: { path: '/', port: 4173 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output stelarvacayWebFqdn string = stelarvacayWebApp.properties.configuration.ingress.fqdn
output stelarvacayWebIdentityPrincipalId string = stelarvacayWebApp.identity.principalId
