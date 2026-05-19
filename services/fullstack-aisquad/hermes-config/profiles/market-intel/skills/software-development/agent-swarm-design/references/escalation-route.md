# Escalation API Route (Latest Addition)

Added 2026-05-13 — the last API route built in this session.

## File: `src/api/routes/escalation.py`

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create escalation (family_id, title, level, trigger_source, person_id) |
| GET | `/` | Get all active escalations for a family |
| POST | `/{id}/escalate` | Escalate to a higher level |
| POST | `/{id}/de-escalate` | De-escalate to a lower level |
| POST | `/{id}/resolve` | Resolve with optional resolution notes |
| GET | `/threshold` | Check if a risk score triggers escalation (read-only) |

### Valid Levels

`low` → `medium` → `high` → `critical` → `emergency`

### Dependencies

- `EscalationService` (src/services/escalation.py) — business logic
- `Escalation` model (src/models/escalation.py) — `Escalation`, `EscalationHistory`, `EscalationLevel`
- Async session via shared `get_db()` dependency

### Integration Point

The `/threshold` endpoint is the bridge between the **risk scoring system** and the **agent swarm** — it answers "should we escalate, and who gets notified?" This is the exact kind of cross-cutting concern the orchestration layer routes to the appropriate agent.