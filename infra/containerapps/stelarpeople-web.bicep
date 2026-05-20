param location string
param containerAppsEnvId string
param acrName string
param viteApiUrl string = '/api'

resource stelarpeopleWebApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'stelarpeople-web'
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
        name: 'stelarpeople-web'
        image: '${acrName}.azurecr.io/stelarpeople-web:latest'
        env: [
          { name: 'VITE_API_URL', value: viteApiUrl }
        ]
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
        probes: [
          { type: 'Liveness', httpGet: { path: '/', port: 4173 } }
          { type: 'Readiness', httpGet: { path: '/', port: 4173 } }
        ]
      }]
      scale: { minReplicas: 1, maxReplicas: 5 }
    }
  }
}

output stelarpeopleWebFqdn string = stelarpeopleWebApp.properties.configuration.ingress.fqdn
output stelarpeopleWebIdentityPrincipalId string = stelarpeopleWebApp.identity.principalId
