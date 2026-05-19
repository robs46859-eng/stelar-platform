# Memory: Family DB Migration

- Project root: `/home/azureuser/family-companion`.
- Backend: `/home/azureuser/family-companion/backend`.
- Android: `/home/azureuser/family-companion/android`.
- Local LLM: `http://localhost:11434/v1`, model `gemma4:26b`.
- Preserve dirty work; do not revert unrelated changes.
- Greenlight required for: destructive, database-reset, drop-table, production-data-change.
