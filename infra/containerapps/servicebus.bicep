param location string

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: 'sb-stelar-prod'
  location: location
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {}
}

resource agentRunQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  name: 'agent-run-queue'
  parent: serviceBusNamespace
  properties: { maxDeliveryCount: 10 }
}

resource governanceQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  name: 'governance-queue'
  parent: serviceBusNamespace
  properties: { maxDeliveryCount: 10 }
}

resource rootManageSharedAccessKey 'Microsoft.ServiceBus/namespaces/AuthorizationRules@2022-10-01-preview' existing = {
  name: 'RootManageSharedAccessKey'
  parent: serviceBusNamespace
}

output serviceBusNamespaceName string = serviceBusNamespace.name
output serviceBusConnectionString string = rootManageSharedAccessKey.listKeys().primaryConnectionString
