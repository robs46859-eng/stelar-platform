# Backend → Android Endpoint Map

Backend routes in `backend/src/api/routes/android.py` (FastAPI, `@router` prefix `/api/v1/android`).
All JSON keys are Python snake_case → Kotlin camelCase with `@SerializedName`.

## AI Chat

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.post("/chat")` | POST | message, family_id, person_id?, tone (all Query!) | `@POST("chat")` — `@Query` params |
| `@router.post("/chat/stream")` | POST | same as above | OkHttp SSE (not Retrofit) |

**Chat request uses Query parameters, NOT JSON body.** The FastAPI route declares:
```python
async def android_chat(
    message: str = Query(...),
    family_id: UUID = Query(...),
    ...
```

## Profile

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.get("/profile")` | GET | family_id, person_id? | `@GET("profile")` — `@Query` params |
| Returns | `{family: {id, name, description}, member_count, members: [{id, person_id, role, is_primary_contact}]}` |

## Pregnancy Journey

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.post("/journey")` | POST | JSON body (PregnancyJourneyCreate) | `@POST("journey")` — `@Body` |
| `@router.get("/journey/{week}")` | GET | person_id (Query) | `@GET("journey/{week}")` — `@Path("week")` + `@Query("person_id")` |

PregnancyJourneyCreate fields: `person_id, week, baby_size?, fact?, tip?, mood?, notes?`

## Health Metrics

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.post("/health-metric")` | POST | JSON body (HealthMetricCreate) | `@POST("health-metric")` — `@Body` |
| `@router.get("/health-metrics")` | GET | person_id, metric_type?, limit | `@GET("health-metrics")` — `@Query` params |

HealthMetricCreate fields: `person_id, metric_type, value_json, recorded_at?, notes?`
value_json is `dict[str, Any]` → `Map<String, Any>` in Kotlin.

## Places / Resources

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.get("/places")` | GET | category?, lat?, lng?, radius_km?, limit? | `@GET("places")` — `@Query` params |
| `@router.post("/places/review")` | POST | JSON body (ResourceReview) | `@POST("places/review")` — `@Body` |

ResourceInDB (place): `id, name, description?, address?, category, latitude?, longitude?, phone?, website?, hours_of_operation?, rating?, review_count, created_at, updated_at`

ResourceReview: `resource_id, rating, comment?`

## Support

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.post("/support")` | POST | JSON body (SupportRequest) | `@POST("support")` — `@Body` |

SupportRequest fields: `family_id, person_id?, request_type, message, urgency?, context?, preferred_tone?`
SupportResponse returns: `id, family_id, person_id?, request_type, message, response_text, response_tone, agent_used, confidence_score, created_at`

## Safety Check

| Backend | Method | Params | Retrofit |
|---------|--------|--------|----------|
| `@router.get("/safety-check")` | GET | family_id (Query) | `@GET("safety-check")` — `@Query("family_id")` |
| Returns | `{family_id, active_alerts, alerts: [{id, alert_type, message, severity, created_at}], status}` |
