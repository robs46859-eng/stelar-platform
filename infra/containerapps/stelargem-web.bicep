param location string
param containerAppsEnvId string
param acrName string
param viteApiUrl string = '/api'

resource stelarGemWebApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'stelargem-web'
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvId
    configuration: {
      ingress: { external: true, targetPort: 80 }
      registries: [{ server: '${acrName}.azurecr.io', identity: 'system' }]
    }
    template: {
      containers: [{
        name: 'stelargem-web'
        image: '${acrName}.azurecr.io/stelargem-web:latest'
        env: [
          { name: 'VITE_API_URL', value: viteApiUrl }
        ]
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/', port: 80 } }
          { type: 'Readiness', httpGet: { path: '/', port: 80 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output stelarGemWebFqdn string = stelarGemWebApp.properties.configuration.ingress.fqdn
output stelarGemWebIdentityPrincipalId string = stelarGemWebApp.identity.principalId
