# Stelar Platform

The Stelar Platform is a multi-tenant property and travel management ecosystem powered by local LLM intelligence (Gemma 4 26B) and hosted on Azure.

## 🌐 Public Access
- **StelarVacay**: [https://stelarvacay-web.proudbay-d7864c81.eastus2.azurecontainerapps.io](https://stelarvacay-web.proudbay-d7864c81.eastus2.azurecontainerapps.io)
- **StelarPeople**: [https://stelarpeople-web.proudbay-d7864c81.eastus2.azurecontainerapps.io](https://stelarpeople-web.proudbay-d7864c81.eastus2.azurecontainerapps.io)
- **StelarGem**: [https://stelargem-web.proudbay-d7864c81.eastus2.azurecontainerapps.io](https://stelargem-web.proudbay-d7864c81.eastus2.azurecontainerapps.io)
- **FullStack Dashboard**: [https://fullstack-dashboard.proudbay-d7864c81.eastus2.azurecontainerapps.io](https://fullstack-dashboard.proudbay-d7864c81.eastus2.azurecontainerapps.io)

Custom domains under `stelar.host` are not cut over to the VNET-integrated environment yet. As of 2026-05-21, `vacay.stelar.host` and `people.stelar.host` still point to the old `happycoast` Container Apps environment.

## 🏗 Architecture
### Infrastructure
- **Compute**: Azure Container Apps (ACA) for web and API services.
- **Inference**: High-compute Azure VM (`gemmaco-key`) hosting Gemma 4 26B.
- **Registry**: Azure Container Registry (`acrstelarprod`).
- **Database**: Azure Database for PostgreSQL (Flexible Server).
- **Secrets**: Azure Key Vault (`kv-stelar-prod`).

## 🤖 Intelligence Integration (Phase 6: Current)
The platform uses a hybrid-cloud model for LLM tasks:
- **Model**: Gemma 4 26B (Ollama).
- **Status**: AiSquad agents are wired to the Gateway proxy.
- **Sandbox Fix**: Complete.

## 💳 Billing
- **Status**: Stripe SDK scaffolded and `STRIPE-SECRET-KEY` configured in Key Vault.

## 🚀 Deployment
Deploy the full stack using the Bicep templates:
```bash
cd infra/containerapps
bash deploy.sh
```
