# Family Companion — Build Handoff

**Date:** May 16, 2026  
**Status:** Phases 1–3 COMPLETE | Phase 4 pending  
**Swarm:** builder:task (2 delegation runs)  
**Monorepo:** `/home/azureuser/family-companion/`

---

## Overall Stats

| Layer | Files | New This Session |
|-------|-------|-----------------|
| Backend Python | 84 `.py` files | 6 new + 3 updated |
| Backend Models | 16 models | 3 new (Resource, PregnancyJourney, HealthMetric) |
| Android Kotlin | 50 `.kt` files | 12 new + 6 modified |

---

## Phase 1: Foundation ✅

Monorepo at `/home/azureuser/family-companion/`:
```
family-companion/
├── README.md                     # Top-level readme
├── INTEGRATION_STRATEGY.md       # (in fullstack-aisquad/)
├── backend/                      # fscompanion (copied from /home/azureuser/fscompanion/)
│   └── src/...
├── android/                      # Navigate Mama (cloned from github.com/robs46859-eng/navigate)
│   ├── app/
│   ├── core-model/
│   ├── core-database/
│   ├── core-data/
│   ├── featurehealth/
│   └── featurecommunity/
└── docs/
```

**Infrastructure:**
- Ollama 0.24.0 installed at `/usr/local/bin/ollama`
- Backend git remote: `https://github.com/robs46859-eng/fscompanion.git`
- Android git remote: `https://github.com/robs46859-eng/navigate.git`

---

## Phase 2: Backend Activation ✅

### Gemma 4 27B Dual-Mode Client
**File:** `backend/src/gemma/client.py` (254 lines)

- **Dual-mode:** local Gemma 4 27B (Ollama) + cloud Gemini API fallback
- **ModelRouter:** Cactus Prize intelligence — PII/sensitive/crisis → local, complex → cloud, simple → rules
- **Streaming:** local SSE streaming, cloud word-by-word fallback
- **Embeddings:** always cloud (Gemini `embedding-001`)
- **Monitoring:** `get_routing_stats()` returns decision log + counts

**Supporting files:**
- `backend/src/gemma/local_client.py` — Ollama wrapper, OpenAI-compatible `/v1/chat/completions`
- `backend/src/gemma/model_router.py` — RouteTarget enum (LOCAL/CLOUD/RULES), PII/crisis/simple detection
- `backend/src/config.py` — Added `LOCAL_LLM_BASE_URL`, `LOCAL_LLM_MODEL=gemma4:27b-q4_K_M`, `LOCAL_LLM_ENABLED=True`

### New Data Models (3)
| Model | Table | Navigate Source |
|-------|-------|----------------|
| `Resource` | `resources` | `Place` from Navigate + maternal categories |
| `PregnancyJourney` | `pregnancy_journeys` | `JourneyEntry` from Navigate |
| `HealthMetric` | `health_metrics` | `ContractionLog`, `KickCountLog`, `SleepSession` |

**Maternal categories added to Resource:** HOSPITAL, NURSING_ROOM, CHANGING_STATION, RESTROOM, REST_STOP, PLAYGROUND, URGENT_CARE, CAFE  
**Pregnancy metric types:** CONTRACTION, KICK_COUNT added to MetricType enum

### Android API Endpoints (12)
**File:** `backend/src/api/routes/android.py` (360 lines)  
**Router prefix:** `/api/v1/android`  
**Registered in:** `backend/src/api/main.py`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chat` | AI chat (Query params) |
| POST | `/chat/stream` | Streaming chat (SSE) |
| GET | `/profile` | Family profile summary |
| POST | `/journey` | Log pregnancy entry |
| GET | `/journey/{week}` | Get week info |
| POST | `/health-metric` | Record health observation |
| GET | `/health-metrics` | Get history |
| GET | `/places` | List resources (lat/lng/radius) |
| POST | `/places/review` | Submit review |
| POST | `/support` | AI-powered support request |
| GET | `/safety-check` | Active safety alerts |

### LLM Wired Into Services
**File:** `backend/src/services/support_agent.py`

- `generate_ai_response()` now calls GemmaClient with PromptManager templates
- Falls back to `_generate_response_template()` if LLM unavailable
- Family data always marked `sensitive=True` → routes to local Gemma 4 27B
- Crisis requests get `priority=5` + `temperature=0.2`

---

## Phase 3: Android Integration ✅

### New Files (12)
```
android/core-data/src/main/java/com/navigatemama/core/data/
├── network/
│   ├── FamilyCompanionApi.kt          # Retrofit interface (11 endpoints)
│   └── dto/
│       ├── ChatResponse.kt             # AI chat response
│       ├── JourneyEntryDto.kt          # Pregnancy journey DTOs
│       ├── HealthMetricDto.kt          # Health metric DTOs
│       ├── PlaceDto.kt                 # Place + review DTOs
│       ├── SupportRequest.kt           # Support request/response
│       ├── SafetyCheckResponse.kt      # Safety alerts
│       └── ProfileDto.kt              # Family profile
└── repository/
    └── FamilyCompanionRepository.kt   # API wrapper with caching + SSE streaming

android/app/src/main/java/com/navigatemama/app/companion/
├── CompanionViewModel.kt              # Chat state, streaming, fallback
├── CompanionFragment.kt               # Chat UI screen
└── CompanionAdapter.kt                # RecyclerView adapter (user + assistant bubbles)

android/app/src/main/res/layout/
├── fragment_companion.xml             # Chat layout
├── item_companion_message_user.xml    # User bubble (right-aligned)
└── item_companion_message_assistant.xml  # AI bubble (left-aligned + streaming indicator)
```

### Modified Files (6)
| File | Change |
|------|--------|
| `gradle/libs.versions.toml` | Added Retrofit 2.11.0, OkHttp 4.12.0 |
| `core-data/build.gradle.kts` | Added Gson, Retrofit, OkHttp deps |
| `app/.../shared/ServiceLocator.kt` | Added `companionRepository()` singleton |
| `app/.../navigation/main_nav_graph.xml` | Registered CompanionFragment |
| `app/.../menu/bottom_nav_menu.xml` | Added Companion tab (5th item) |
| `app/.../values/strings.xml` | Added companion strings |

### Architecture Decisions
- **Query params for chat** — Backend uses `?message=&family_id=` not JSON body
- **SSE via OkHttp directly** — Not Retrofit `@Streaming`; parses `data:` lines via Kotlin Flow
- **Non-streaming fallback** — Streaming failure → `sendChat()` as backup
- **Offline message** — Complete failure → "I'm having trouble connecting right now"
- **ServiceLocator pattern** — `@Volatile` + `synchronized` matching existing patterns
- **AndroidViewModel** — Follows existing JourneyViewModel/HomeViewModel conventions

---

## Phase 4: Hackathon Polish (PENDING)

Remaining work for the Gemma 4 Good hackathon:

### Priority Items
- [ ] **Pull Gemma 4 27B:** `ollama pull gemma4:27b` (needs ~16GB disk — currently 804MB free)
- [ ] **Model download script:** `backend/scripts/download_gemma4_27b.sh`
- [ ] **Docker Compose with Ollama:** `backend/docker-compose.gemma.yml` (GPU passthrough)
- [ ] **Fine-tuning prep (Unsloth Prize):** Dataset collection for family crisis/support
- [ ] **LiteRT on-device:** Convert Gemma 4 Nano for Android quick responses

### Hackathon Submission Materials
- [ ] **GEMENA_WRITEUP.md** — Technical writeup on Gemma 4 integration
- [ ] **HACKATHON_SHOWCASE.md** — Demo flow, screenshots, prize track justification
- [ ] **HACKATHON_VIDEO_GUIDE.md** — 2-min demo video script
- [ ] **Benchmarks:** tokens/sec, latency, RAM usage (local vs cloud)

### CI/CD & Testing
- [ ] Push backend to `robs46859-eng/fscompanion` on GitHub
- [ ] Push Android to `robs46859-eng/navigate` on GitHub
- [ ] Backend tests (0 of 11 written)
- [ ] GitHub Actions CI (`.github/workflows/ci.yml`)

---

## Running the Project

### Backend
```bash
cd /home/azureuser/family-companion/backend
docker-compose up -d        # PostgreSQL + Redis
# Then (in venv):
uvicorn src.api.main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
# Android routes at http://localhost:8000/api/v1/android/*
```

### Android
```bash
cd /home/azureuser/family-companion/android
# Set MAPS_API_KEY in gradle.properties or local.properties
./gradlew :app:assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Gemma 4 27B (when disk space permits)
```bash
ollama pull gemma4:27b-q4_K_M
# Test: curl http://localhost:11434/v1/chat/completions -d '{"model":"gemma4:27b-q4_K_M","messages":[{"role":"user","content":"Hello"}]}'
```

---

## Key File Index

| Purpose | Path |
|---------|------|
| Strategy doc | `/home/azureuser/fullstack-aisquad/INTEGRATION_STRATEGY.md` |
| This handoff | `/home/azureuser/fullstack-aisquad/missions/HANDOFF_PHASE3.md` |
| Backend config | `backend/src/config.py` |
| Gemma dual client | `backend/src/gemma/client.py` |
| Model router | `backend/src/gemma/model_router.py` |
| Android API routes | `backend/src/api/routes/android.py` |
| Support agent (LLM-wired) | `backend/src/services/support_agent.py` |
| Retrofit API service | `android/.../network/FamilyCompanionApi.kt` |
| Android repository | `android/.../repository/FamilyCompanionRepository.kt` |
| Chat ViewModel | `android/.../companion/CompanionViewModel.kt` |
| Chat UI | `android/.../companion/CompanionFragment.kt` |

---

## Known Issues

1. **Disk space: 804MB free** — Cannot pull Gemma 4 27B (~16GB). Need to free ~15GB or use external storage.
2. **No Android SDK** — VM doesn't have Android SDK; Gradle builds won't work locally. Use CI or dev machine.
3. **Gemma 4 27B not yet pulled** — Ollama installed, model not downloaded due to disk constraints.
4. **CHECKLIST.md is stale** — References original fscompanion completion status, not current monorepo state.
5. **Tests not written** — All 11 test files are stubs with no assertions.

---

**Next action:** Delegate Phase 4 (hackathon polish) to builder swarm — fine-tuning prep, benchmarks, writeup files.
