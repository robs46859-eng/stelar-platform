# Memory pointer — family-db-migration

This file is a pointer, not a memory store.

Durable long-term memory for family-db-migration lives at:
~/.hermes/profiles/family-db-migration/MEMORY.md

Swarm-specific memory under this directory:
- IDENTITY.md — worker role/specialty
- missions/<missionId>/SUMMARY.md + events.jsonl — per-mission memory
- episodes/YYYY-MM-DD.md — daily episodic log
- handoffs/<missionId>.md or latest.md — compaction/restart handoffs
