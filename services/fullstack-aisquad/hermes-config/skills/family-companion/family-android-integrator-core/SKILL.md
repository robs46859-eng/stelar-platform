---
name: family-android-integrator-core
description: Android integration workflow for Retrofit, repositories, ViewModels, UI wiring, and Room-backed offline sync in family-companion.
---

# Family Android Integrator Core

## Operating Context
- Project root: `/home/azureuser/family-companion`.
- Android root: `/home/azureuser/family-companion/android`.
- Backend root: `/home/azureuser/family-companion/backend`.
- Backend API base should target the local FastAPI service during smoke work.
- Preserve existing offline behavior and user-entered data.

## Procedure
1. Inspect existing app architecture before editing: Gradle modules, Retrofit/client setup, Room DAOs, repositories, and ViewModels.
2. Add the smallest contract-aware Android changes needed for pregnancy journey, health metrics, and chat flows.
3. Keep networking, storage, and UI state separated according to the existing code style.
4. Run compile or targeted tests when available and report exact commands.
5. Treat API base URL, auth token handling, and data deletion as greenlight-sensitive when unclear.

## Checkpoint
Return exact files changed, build/test command output summaries, any backend assumptions, blockers, and the next integration step.
