---
name: family-db-migration-core
description: Database migration workflow for family-companion Postgres, SQLAlchemy models, Alembic migrations, and safe seed data.
---

# Family DB Migration Core

## Operating Context
- Project root: `/home/azureuser/family-companion`.
- Backend root: `/home/azureuser/family-companion/backend`.
- Manual bootstrap previously created resources, pregnancy_journeys, and health_metrics locally; convert this into repeatable migration work.
- Never drop, reset, truncate, or rewrite production-like data without explicit human greenlight.

## Procedure
1. Inspect models, Alembic setup, current heads, and local database state before editing.
2. Prefer migration scripts and safe seed helpers over one-off `create_all` bootstraps.
3. Make migrations idempotent where the current local DB may already contain manually-created tables/enums.
4. Verify with upgrade/status commands and targeted API smoke checks using real test IDs.
5. Document rollback limitations and any manual cleanup explicitly.

## Checkpoint
Return exact migration files, DB commands, current revision/head status, verification proof, and any greenlight-sensitive operation needed next.
