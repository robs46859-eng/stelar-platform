# Stelar Platform

The Stelar Platform is a multi-tenant property and travel management ecosystem powered by local LLM intelligence (Gemma 4 26B) and hosted on Azure.

## 🌐 Public Access
- **Landing**: [https://stelar.host](https://stelar.host)
- **StelarVacay**: [https://vacay.stelar.host](https://vacay.stelar.host)
- **StelarPeople**: [https://people.stelar.host](https://people.stelar.host)

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
- **Status**: Connecting AiSquad agents to Gateway proxy.
- **Sandbox Fix**: Implementation in progress.

## 💳 Billing
- **Status**: Stripe SDK scaffolded and `STRIPE-SECRET-KEY` configured in Key Vault.

## 🚀 Deployment
Deploy the full stack using the Bicep templates:
```bash
cd infra/containerapps
bash deploy.sh
```
