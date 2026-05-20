# Stelar Platform

The Stelar Platform is a multi-tenant property and travel management ecosystem powered by local LLM intelligence (Gemma 4 26B) and hosted on Azure.

## 🏗 Architecture

### Infrastructure
- **Compute**: Azure Container Apps (ACA) for web and API services.
- **Inference**: High-compute Azure VM (`gemmaco-key`) hosting Gemma 4 26B.
- **Registry**: Azure Container Registry (`acrstelarprod`).
- **Database**: Azure Database for PostgreSQL (Flexible Server).
- **Secrets**: Azure Key Vault (`kv-stelar-prod`).

### Services
- **stelarvacay-web**: Consumer-facing travel/rental dashboard.
- **stelarvacay-api**: Backend for rental search and booking.
- **stelarpeople-web**: Property management dashboard (Phase 5).
- **stelarpeople-api**: Backend for property and tenant management.
- **fullstack-gateway**: Central entry point and inference proxy.

## 🤖 Intelligence Integration
The platform uses a hybrid-cloud model for LLM tasks:
- **Model**: Gemma 4 26B (Ollama).
- **Bridge**: A custom Python bridge on the VM (:18080) handles requests from ACA.
- **Local Access**: `http://localhost:8500/v1/proxy/infer` (via Gateway).

## 🚀 Deployment
Deploy the full stack using the Bicep templates:
```bash
cd infra/containerapps
bash deploy.sh
```

## 🛠 Maintenance
- **Gateway Venv**: Located at `/tmp/gw-venv` on the VM.
- **Model Weights**: Located at `/mnt/gemma4/ollama`.
