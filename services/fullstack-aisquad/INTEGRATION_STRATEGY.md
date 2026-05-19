# FamilyCompanion — Integration Strategy & Architecture

**Target:** Unify fscompanion (Python/FastAPI) + Navigate Mama (Android) into one family companion platform powered by **Gemma 4 27B**.
**Hackathon:** Gemma 4 Good — targeting Main Tracks (Education, Digital Equity, Safety, Global Resilience) + Special Tracks (Ollama, LiteRT, llama.cpp, Cactus, Unsloth).

---

## 1. Current State Audit

### 1.1 fscompanion (`/home/azureuser/fscompanion/`)
| Layer | Status | Files | Notes |
|-------|--------|-------|-------|
| Models | ✅ Done | 13 SQLAlchemy models | Family, Person, CareRole, Memory, Routine, Appointment, Event, CaregiverLoad, QoLMetric, DigitalTwin, Safety, Escalation |
| Schemas | ✅ Done | 10 Pydantic schemas | Full validation layer |
| Services | ✅ Done | 14 services | All business logic implemented |
| Agents | ✅ Done | 10 agents | Full swarm with base class, pipeline pattern |
| API Routes | ✅ Done | 12 routes + main | FastAPI, CORS, lifecycle |
| Gemma/LLM | ⚠️ Dormant | 5 files | Client, prompts, routing, safety, scoring exist but **not wired to services** |
| Infra | ✅ Done | Docker, compose, pyproject, CI | Ready to run |
| Integrations | ⚠️ Stubs | 4 files | SMS, Gmail, Calendar, Maps stubs exist |
| Tests | ❌ Missing | 0 of 11 | No tests written |
| Docs | ✅ Partial | ARCHITECTURE, README, CHECKLIST | Good but CHECKLIST is stale |

**Critical finding:** `src/gemma/` has a complete Gemini API client but none of the 14 services import or use it. Services use template-based responses. The LLM layer is architecture-ready but functionally dormant.

### 1.2 Navigate Mama (`/tmp/navigate/`)
| Layer | Status | Files | Notes |
|-------|--------|-------|-------|
| Android Core | ✅ Done | 6 modules | app, core-model, core-database, core-data, featurehealth, featurecommunity |
| Data Models | ✅ Kotlin | 16 data classes | UserProfile, Place, ChildProfile, CareEvent, JourneyEntry, ContractionLog, KickCount, SleepSession, CommunityPost |
| Features | ✅ UI | Pregnancy tracker, map, health, community, kids | Native Android with ViewModel/LiveData |
| Backend | 🔶 Firebase only | Firestore + Auth | No AI backend; relies on Firebase |
| Web Proto | 🔶 Legacy | React/TS + Express | Present but deprecated — keep only as reference |
| Design | ✅ Defined | DESIGNMASTER.md | Refined Brutalist dark theme |
| Play Store | ⚠️ Partial | Signing config ready | Missing: keystore, store listing, privacy policy |

**Critical finding:** Navigate has NO AI/LLM integration at all — it's pure Firebase CRUD. The `core-model` data classes are flat DTOs with no relationship to fscompanion's rich relational models.

---

## 2. Architecture Vision

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FAMILY COMPANION                               │
│                                                                       │
│  ┌─────────────────────┐          ┌─────────────────────────────┐    │
│  │   Android Client    │          │   Python Backend (FastAPI)   │    │
│  │  (Navigate Mama)    │◄─REST───►│   (fscompanion core)         │    │
│  │                     │          │                              │    │
│  │  • Pregnancy track  │          │  • Agent Swarm (10 agents)   │    │
│  │  • Maternal places  │          │  • Family models (13)        │    │
│  │  • Health tools     │          │  • Safety & escalation       │    │
│  │  • Community        │          │  • QoL monitoring            │    │
│  │  • Kids care        │          │  • Resource discovery        │    │
│  │  • LiteRT Gemma 4   │          │  • Stability forecasting     │    │
│  └─────────┬───────────┘          └──────────────┬──────────────┘    │
│            │                                     │                    │
│            │  Firebase (Auth, Firestore)          │  PostgreSQL       │
│            │  Room DB (local cache)               │  Redis (cache)    │
│            │                                     │                   │
│            │                                     │                    │
│  ┌─────────▼─────────────────────────────────────▼──────────────┐    │
│  │                   Gemma 4 27B Serving Layer                    │    │
│  │                                                                 │    │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐ │    │
│  │  │ Ollama (server)  │  │ llama.cpp    │  │ Gemini API       │ │    │
│  │  │ Gemma 4 27B Q4   │  │ Gemma 4 27B  │  │ (cloud fallback) │ │    │
│  │  │ Port 11434       │  │ GGUF         │  │                  │ │    │
│  │  └────────┬─────────┘  └──────┬───────┘  └────────┬─────────┘ │    │
│  │           │                   │                    │           │    │
│  │           └───────────────────┴────────────────────┘           │    │
│  │                              │                                  │    │
│  │                    ┌─────────▼──────────┐                      │    │
│  │                    │  Model Router       │                      │    │
│  │                    │  (Cactus Prize)     │                      │    │
│  │                    │                     │                      │    │
│  │                    │  sensitive → local  │                      │    │
│  │                    │  complex  → cloud   │                      │    │
│  │                    │  offline  → rules   │                      │    │
│  │                    └─────────────────────┘                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Unified Data Model

### 3.1 Model Unification Map

Navigate Mama's flat Kotlin DTOs map to fscompanion's relational models:

| Navigate Concept | → | fscompanion Model | Action |
|---|---|---|---|
| `UserProfile` | → | `Person` + `FamilyMember` | Extend Person with `stage`, `dueDate` |
| `ChildProfile` | → | `Person` (type=child) | Add `birthDate`, `pediatrician`, `allergies` |
| `Place` | → | **New:** `Resource` | Create new model with maternal categories |
| `Review` | → | **New:** `ResourceReview` | New model |
| `CareEvent` | → | `RoutineTask` + `Appointment` | Map feeding/diaper/sleep to routines |
| `JourneyEntry` | → | **New:** `PregnancyJourney` | Week-by-week tracking |
| `ContractionLog` | → | **New:** `HealthMetric` (type=contraction) | Add to QoL system |
| `KickCountLog` | → | **New:** `HealthMetric` (type=kick_count) | Add to QoL system |
| `SleepSession` | → | **New:** `HealthMetric` (type=sleep) | Add to QoL system |
| `CommunityPost` | → | **New:** `CommunityPost` | Standalone or Firebase-synced |

### 3.2 New Models to Add to fscompanion

```python
# src/models/resources.py
class Resource(Base):
    """Maternal/family-friendly places (merged from Navigate's Place)."""
    id, name, address, category (enum: HOSPITAL, NURSING_ROOM, etc.)
    latitude, longitude, rating, review_count
    description, hours, phone, website_url
    avg_cleanliness, avg_privacy, stroller_access_rate

# src/models/pregnancy.py
class PregnancyJourney(Base):
    """Week-by-week pregnancy tracking."""
    id, person_id, week, baby_size, fact, tip, mood, created_at

# src/models/health_metrics.py
class HealthMetric(Base):
    """Flexible health tracking (contractions, kicks, sleep, weight, etc.)."""
    id, person_id, metric_type (enum), value_json, recorded_at, notes
```

This adds ~3 new models, bringing total to 16.

---

## 4. Gemma 4 27B Deployment Plan

### 4.1 Model Specifications

| Property | Value |
|---|---|
| Model | Gemma 4 27B (27 billion parameters) |
| Quantization | Q4_K_M (4-bit, ~16GB VRAM) |
| Format | GGUF (llama.cpp) |
| Serving | Ollama primary, llama.cpp fallback |
| API | OpenAI-compatible `/v1/chat/completions` |

### 4.2 Serving Architecture

```
Phase 1: Ollama (primary)
  ollama pull gemma4:27b-q4_K_M
  → Port 11434, OpenAI-compatible API
  → Docker container with GPU passthrough

Phase 2: llama.cpp (fallback, low-resource)
  ./llama-server -m gemma-4-27b-Q4_K_M.gguf --port 8080
  → Works on CPU-only machines (slow but functional)

Phase 3: Gemini API (cloud fallback)
  When local model unavailable or for complex non-sensitive tasks
```

### 4.3 Dual-Mode Client (replaces `src/gemma/client.py`)

```python
class FamilyCompanionLLM:
    """Unified LLM client with local/cloud routing."""

    def __init__(self):
        self.local_client = OllamaClient(model="gemma4:27b-q4_K_M")
        self.cloud_client = GeminiClient(model="gemini-2.0-flash")
        self.router = ModelRouter()

    async def generate(self, prompt, context=None):
        route = self.router.decide(prompt, context)
        if route == "local":
            return await self.local_client.generate(prompt)
        elif route == "cloud":
            return await self.cloud_client.generate(prompt)
        else:  # rules
            return self.rule_based_response(prompt, context)
```

### 4.4 Model Router Logic (Cactus Prize)

```python
class ModelRouter:
    def decide(self, prompt, context) -> str:
        # 1. Sensitive data → LOCAL ONLY
        if self._contains_pii(prompt) or context.get("sensitive"):
            return "local"

        # 2. Crisis/urgent → LOCAL (works offline, immediate)
        if context.get("priority", 0) >= 4:
            return "local"

        # 3. Connectivity check → rules fallback
        if not self._has_connectivity() and not self.local_available:
            return "rules"

        # 4. Simple queries → rules (zero latency)
        if self._is_simple_query(prompt):
            return "rules"

        # 5. Complex/non-sensitive → cloud (richer)
        return "cloud"
```

---

## 5. API Design

### 5.1 New Android-Backend Endpoints

```
POST   /api/v1/android/auth          # Firebase token → JWT exchange
GET    /api/v1/android/profile        # User + family profile
POST   /api/v1/android/chat           # AI chat (streaming)
POST   /api/v1/android/journey        # Pregnancy journey entry
GET    /api/v1/android/journey/{week} # Get week info
POST   /api/v1/android/health-metric  # Log contraction/kick/sleep
GET    /api/v1/android/health-metrics # Get history
GET    /api/v1/android/places         # Maternal-friendly places
POST   /api/v1/android/places/review  # Add review
GET    /api/v1/android/community      # Community posts
POST   /api/v1/android/community      # Create post
GET    /api/v1/android/safety-check   # Run safety audit
POST   /api/v1/android/support        # Request AI support
```

### 5.2 Android Retrofit Service

```kotlin
interface FamilyCompanionApi {
    @POST("api/v1/android/chat")
    suspend fun chat(@Body request: ChatRequest): ChatResponse

    @POST("api/v1/android/chat")
    fun chatStream(@Body request: ChatRequest): Flow<ChatChunk>

    @GET("api/v1/android/journey/{week}")
    suspend fun getJourneyWeek(@Path("week") week: Int): JourneyEntry

    @POST("api/v1/android/health-metric")
    suspend fun logHealthMetric(@Body metric: HealthMetricRequest)

    @GET("api/v1/android/places")
    suspend fun getPlaces(
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
        @Query("radius") radius: Int = 5000
    ): List<Place>
}
```

---

## 6. Component Integration Map

### 6.1 What Moves Where

| From | To | Reason |
|------|----|--------|
| `/tmp/navigate/` → | `/home/azureuser/family-companion/android/` | Permanent home, sibling to backend |
| `fscompanion/src/` → | `/home/azureuser/family-companion/backend/src/` | Rename root for clarity |
| navigate `core-model/` → | Keep in Android + sync with backend schemas | Dual representation, shared contract |
| navigate web `src/` → | `/home/azureuser/family-companion/web-legacy/` | Archive, reference only |

### 6.2 What Gets Created

| New File | Purpose |
|----------|---------|
| `backend/src/gemma/local_client.py` | Ollama/llama.cpp client for Gemma 4 27B |
| `backend/src/gemma/model_router.py` | Cactus-prize routing logic |
| `backend/src/models/resources.py` | Place/resource model |
| `backend/src/models/pregnancy.py` | Pregnancy journey model |
| `backend/src/models/health_metrics.py` | Flexible health metrics |
| `backend/src/api/routes/android.py` | Android-specific endpoints |
| `backend/src/schemas/android.py` | Android request/response schemas |
| `android/core-data/.../FamilyCompanionApi.kt` | Retrofit API service |
| `android/app/.../viewmodel/AiChatViewModel.kt` | Chat ViewModel |
| `android/app/.../repository/FamilyCompanionRepo.kt` | Repository |
| `backend/scripts/download_gemma4_27b.sh` | Model download script |
| `backend/Dockerfile.gemma` | GPU-enabled Docker for Ollama |

---

## 7. Hackathon Prize Track Alignment

| Prize | Implementation | Proof Point |
|-------|---------------|-------------|
| **Ollama ($10k)** | Primary serving via Ollama + Gemma 4 27B | Docker Compose with Ollama service, model pull script |
| **LiteRT ($10k)** | On-device Gemma 4 Nano for simple queries on Android | TFLite model conversion, Android inference demo |
| **llama.cpp ($10k)** | Fallback CPU inference for extreme low-resource | llama-server config, CPU-only mode |
| **Cactus ($10k)** | Intelligent model router (local/cloud/rules) | ModelRouter class with decision logging |
| **Unsloth ($10k)** | Fine-tuned Gemma 4 27B on family crisis/support data | LoRA adapter, training script, eval results |
| **Future of Education** | AI learning assistant for children in unstable homes | Support agent with educational prompts |
| **Digital Equity** | Offline-first, works on low-end devices | CPU-only llama.cpp mode, offline mode |
| **Safety & Trust** | Zero-data-leaving-device, explainable AI | Local-only PII routing, safety filters |
| **Global Resilience** | Functions in disaster zones, multilingual crisis support | No-internet mode, multi-language prompts |

---

## 8. Implementation Phases

### Phase 1: Foundation (Day 1-2)
- [ ] Move navigate to permanent location: `/home/azureuser/family-companion/android/`
- [ ] Rename fscompanion root: `/home/azureuser/family-companion/backend/`
- [ ] Create `family-companion/` top-level with unified README
- [ ] Install Ollama, pull Gemma 4 27B Q4_K_M
- [ ] Create `local_client.py` (Ollama wrapper)
- [ ] Create `model_router.py` (Cactus routing)
- [ ] Verify: local Gemma 4 27B generates text

### Phase 2: Backend Activation (Day 2-3)
- [ ] Wire GemmaClient into services (support_agent, safety_auditor, intake_service)
- [ ] Add dual-mode (local/cloud) to existing GemmaClient
- [ ] Add new models: Resource, PregnancyJourney, HealthMetric
- [ ] Create Android API endpoints (`/api/v1/android/*`)
- [ ] Create auth bridge (Firebase token → JWT)
- [ ] Verify: API responds to Android-formatted requests

### Phase 3: Android Integration (Day 3-4)
- [ ] Create Retrofit API service for backend endpoints
- [ ] Build AiChatViewModel + Repository
- [ ] Add AI chat UI screen
- [ ] Connect pregnancy tracker to backend API
- [ ] Connect health tools to backend API
- [ ] Add offline caching (Room DB sync)
- [ ] Verify: Android app calls backend, gets AI responses

### Phase 4: Hackathon Polish (Day 4-5)
- [ ] Fine-tune Gemma 4 27B on family support data (Unsloth)
- [ ] LiteRT Gemma 4 Nano for Android on-device quick responses
- [ ] Performance benchmarks (tokens/sec, latency, RAM usage)
- [ ] Demo script and video
- [ ] Hackathon writeup (GEMENA_WRITEUP.md)
- [ ] CI pipeline for backend tests

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemma 4 27B won't fit in available VRAM | Medium | High | Q4 quant ~16GB; fallback to Q3 (~12GB) or CPU llama.cpp |
| Ollama not available for Gemma 4 yet | Medium | Medium | Fallback to llama.cpp GGUF directly |
| Android build fails on this VM (no SDK) | High | Medium | Use CI for Android builds; focus on backend here |
| Navigate Firebase config missing | High | Low | Can run with local Room DB only; Firebase is bonus |
| Time: 5 days is tight | High | High | Parallelize with Hermes swarm; cut non-essential tracks |

---

## 10. Next Actions (Hermes Swarm)

```yaml
# Wedge 1: Foundation (parallel)
- orchestrator:plan "Create family-companion monorepo structure and pull Gemma 4 27B"
  → worker: builder:task
  → files: directory structure, docker-compose, download script

# Wedge 2: Backend LLM activation (parallel with Wedge 1 after dir exists)
- orchestrator:plan "Activate Gemma 4 27B in fscompanion services and create Android API"
  → worker: builder:task
  → files: local_client.py, model_router.py, android routes, updated services

# Wedge 3: Android integration
- orchestrator:plan "Add AI chat and health tracking to Navigate Mama Android app"
  → worker: builder:task
  → files: Retrofit service, ViewModel, Repository, UI screens
```

---

**Document version:** 0.1.0
**Author:** Hermes Agent (strategist lane)
**Next review:** After Wedge 1 completion
