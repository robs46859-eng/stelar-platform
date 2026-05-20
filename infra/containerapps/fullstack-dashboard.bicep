param location string
param containerAppsEnvId string
param acrName string
param viteGatewayUrl string = '/gateway'
param viteArkhamUrl string = '/arkham'

resource fullstackDashboardApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'fullstack-dashboard'
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
        name: 'fullstack-dashboard'
        image: '${acrName}.azurecr.io/fullstack-dashboard:latest'
        env: [
          { name: 'VITE_GATEWAY_URL', value: viteGatewayUrl }
          { name: 'VITE_ARKHAM_URL', value: viteArkhamUrl }
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

output fullstackDashboardFqdn string = fullstackDashboardApp.properties.configuration.ingress.fqdn
output fullstackDashboardIdentityPrincipalId string = fullstackDashboardApp.identity.principalId
