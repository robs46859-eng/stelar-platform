# StelarVision — Spec v1.0

**Product:** StelarVision  
**Purpose:** Event photo transformation companion for celebrations and memorials  
**Output:** One transformed image per input photo (Imagen 3 / Genie 3)  
**Date:** 2026-05-21

---

## 1. Product Overview

StelarVision is a memory-crafting companion for life's most meaningful events. Users upload photos from weddings, graduations, birthdays, memorial gatherings, and other celebrations. StelarVision transforms each photo into a cinematic scene that matches the mood and style of the occasion — not through filters or overlays, but through full scene regeneration via Imagen 3.

**The sole output is the transformed image.** No narration. No video. No timelines. Upload a photo, pick a scene, get back a cinematic version of that moment.

### What It Is Not

- Not a video editor or slideshow builder
- Not a photo filter app
- Not an AI chatbot or planner

### Why "Scrapbooker Companion"

StelarVision enables digital scrapbooking workflows: upload a batch of event photos, apply transforms, download the full set. The transformed images are print-quality and shareable. Users build their own scrapbooks, albums, or social posts with the output.

---

## 2. Supported Event Categories

| Category | Key | Event Examples |
|----------|-----|----------------|
| Wedding | `wedding` | Ceremonies, receptions, engagement shoots, rehearsal dinners |
| Graduation | `graduation` | High school, college, grad school, trade school ceremonies |
| Birthday | `birthday` | All ages — kid parties, milestone birthdays (30/40/50/60), sweet sixteen |
| Memorial | `memorial` | Life celebrations, funerals, anniversary remembrances |
| Baby & Family | `baby` | Baby showers, gender reveals, newborn portraits, family reunions |
| Holiday | `holiday` | Christmas, Thanksgiving, Hanukkah, Eid, Diwali, Fourth of July |
| Achievement | `achievement` | Promotions, retirements, sports championships, recitals |
| General Celebration | `celebration` | Parties, milestones, anything else |

---

## 3. Transform Catalog

Each transform is a key string passed to the existing `generate_creative_transform()` pipeline. All prompts are engineered for Imagen 3. Transforms preserve the subjects in the original photo while regenerating the scene, lighting, and mood.

### 3.1 Wedding Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `wedding_ceremony` | Ceremony Elegance | Floral arch framing, soft aisle lighting, shallow depth of field, warm white tones |
| `wedding_golden_hour` | Golden Hour | Backlit magic hour, lens flare, long shadows, romantic warm glow |
| `wedding_fairytale` | Fairytale Garden | Lush garden or estate setting, soft dreamlike bokeh, pastel palette |
| `wedding_vintage_film` | Vintage Film | Kodachrome 70s-80s grain, warm fade, natural color cast, analog feel |
| `wedding_editorial` | Magazine Editorial | High fashion, clean diffused light, editorial white or dark backdrop |
| `wedding_winter_wonderland` | Winter Wonderland | Snow-dusted venue, candlelit warm interior glow, frost and pine accents |
| `wedding_twilight` | Twilight Romance | Deep blue hour sky, string lights, dusk ambiance |

### 3.2 Graduation Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `graduation_confetti` | Confetti Burst | Colorful confetti explosion, bright celebration energy, cap-toss moment |
| `graduation_campus_walk` | Campus Legacy | Warm afternoon light on academic architecture, classical collegiate setting |
| `graduation_legacy_portrait` | Legacy Portrait | Timeless studio-quality portrait lighting, achievement gravitas |
| `graduation_sunset_field` | Horizon Ahead | Wide open field at sunset, symbolic open future, golden sky |

### 3.3 Birthday Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `birthday_celebration_glow` | Celebration Glow | Festive string lights, balloons, warm party atmosphere, bokeh orbs |
| `birthday_vintage_booth` | Retro Photo Booth | Vintage strip photo-booth style, warm 1970s tones, fun props framing |
| `birthday_cosmic` | Cosmic Party | Galaxy nebula backdrop, cosmic sparkle, celebration in the stars |
| `birthday_golden_milestone` | Golden Milestone | Rich gold and champagne palette, milestone numerals faintly in bokeh |
| `birthday_kids_wonderland` | Wonderland | Colorful magical setting, playful palette, storybook energy (great for kids) |

### 3.4 Memorial Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `memorial_tribute` | Gentle Tribute | Soft warm vignette, desaturated tones, respectful stillness |
| `memorial_garden` | Memorial Garden | Peaceful botanical garden, natural light, dignified calm |
| `memorial_legacy_bw` | Legacy Portrait | Timeless black-and-white, fine-grain film look, enduring dignity |
| `memorial_golden_memory` | Golden Memory | Soft golden hour warmth, gentle lens glow, nostalgic warmth |
| `memorial_light_and_sky` | Light and Sky | Open sky with rays of light, transcendent and hopeful |

### 3.5 Baby & Family Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `baby_nursery_dream` | Nursery Dream | Soft pastel nursery setting, warm filtered light, gentle and tender |
| `baby_shower_blooms` | Bloom Shower | Florals and soft spring light, celebration of new life |
| `family_golden_hour` | Family Golden Hour | Warm backlit family portrait, open field or lawn setting |
| `family_cozy_home` | Cozy Home | Warm interior light, fireplace glow, intimate family setting |

### 3.6 Holiday Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `holiday_winter_cozy` | Winter Cozy | Snow outside, warm fire inside, holiday décor, festive glow |
| `holiday_summer_celebration` | Summer Celebration | Bright outdoor setting, summer party energy, sunshine and vivid colors |
| `holiday_harvest_fall` | Harvest Season | Autumn foliage, warm orange palette, harvest festival energy |
| `holiday_festive_lights` | Festive Lights | String lights and lanterns, evening celebration, warm golden bokeh |

### 3.7 Achievement Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `achievement_spotlight` | Achievement Spotlight | Dramatic studio spotlight, achievement-energy, professional gravitas |
| `achievement_celebration_burst` | Celebration Burst | Confetti, crowd energy, bright celebration lighting |
| `achievement_legacy` | Legacy Portrait | Clean editorial portrait, timeless professional finish |

### 3.8 General Celebration Transforms

| Transform Key | Label | Scene Description |
|---|---|---|
| `celebration_confetti` | Confetti Moment | Classic confetti explosion, vibrant and joyful |
| `celebration_bokeh_party` | Party Bokeh | Warm bokeh orbs, candlelit or string-light ambiance |
| `celebration_cinematic` | Cinematic | Wide cinematic framing, dramatic color grading, movie-poster energy |
| `celebration_polaroid_wall` | Polaroid Wall | Styled on a cork board or wall with polaroid framing and handwritten notes |

---

## 4. User Flow

```
1. SELECT EVENT TYPE
   User picks from: Wedding / Graduation / Birthday / Memorial /
                    Baby & Family / Holiday / Achievement / General

2. UPLOAD PHOTO
   - Single photo (standard flow)
   - Batch upload up to 12 photos (scrapbook flow)
   - Accepted: JPEG, PNG, HEIC — max 10MB per photo
   - Tip shown: "Include the people — Imagen preserves subjects"

3. CHOOSE SCENE
   - Grid of scene thumbnails for the selected event type
   - Each thumbnail shows the scene label and a style preview
   - One scene selected per photo (batch: can apply same scene to all or mix)

4. GENERATE
   - "Create Scene" button
   - Loading state: animated shimmer on output area
   - Progress for batch: "3 of 8 photos transformed"

5. PREVIEW & DOWNLOAD
   - Side-by-side original vs. transformed
   - "Download" — full resolution JPEG
   - "Download All" (batch) — ZIP file
   - "Share" — copy link to hosted version (S3 presigned URL, 72hr TTL)
   - "Regenerate" — re-run same transform (Imagen outputs vary slightly each run)

6. SCRAPBOOK SESSION (optional)
   - All transforms in a session stored together
   - "My Session" gallery shows originals + outputs
   - One-click download of entire session as ZIP
```

---

## 5. Technical Architecture

### 5.1 Components

```
stelarvision-web (React/Vite)
  ↓ HTTPS POST /v1/vision/transform
stelarvision-api (Node/TypeScript)
  ↓ HTTPS POST /v1/vision/transform (forwards with internal key)
fullstack-gateway (FastAPI)
  ↓ generate_creative_transform()
gemini_vision.py
  ↓ gemini-2.5-flash-preview-image-generation (primary)
  ↓ imagen-3.0-generate-002 (fallback)
  → base64 JPEG output
```

### 5.2 New Gateway Endpoint

**`POST /v1/vision/transform`**

This is a new route added to `tour_router` in `tour_routes.py` (or a new `vision_router` if preferred). It validates against `VISION_VALID_TRANSFORMS` (the StelarVision transform key set) rather than the real-estate `VALID_TRANSFORMS`.

```python
# Request body
class VisionTransformRequest(BaseModel):
    session_id: str
    source_image_b64: str          # base64-encoded JPEG/PNG
    transform_key: str             # e.g. "wedding_golden_hour"
    event_category: str            # e.g. "wedding"
    product: str = "stelarvision"

# Response (same shape as existing genie-transform)
{
  "session_id": "...",
  "transform_key": "wedding_golden_hour",
  "transform_label": "Golden Hour",
  "model": "gemini-2.5-flash-preview-image-generation",
  "output_image_b64": "...",         # full resolution base64 JPEG
  "label": "AI Creative Scene — Generated by Imagen 3 / Genie 3. Does not alter or represent the original photograph.",
  "available": true
}
```

### 5.3 `gemini_vision.py` Changes

Add `VISION_TRANSFORM_PROMPTS` dict alongside the existing `TRANSFORM_PROMPTS`. Both feed the same `generate_creative_transform()` function — the function just looks up whichever key is passed.

```python
# gemini_vision.py — new dict below existing TRANSFORM_PROMPTS

VISION_TRANSFORM_PROMPTS: dict[str, dict[str, str]] = {
    "wedding_ceremony": {
        "prompt": (
            "Transform this photo into an elegant wedding ceremony scene. "
            "Add a floral arch framing, soft aisle lighting, warm white tones, and shallow depth of field bokeh. "
            "Preserve all people in the photo exactly. Real wedding photography quality."
        ),
        "label": "Ceremony Elegance",
    },
    "wedding_golden_hour": {
        "prompt": (
            "Transform this photo into a golden hour wedding moment. "
            "Add warm backlit lens flare, long shadows, romantic amber glow, sunset sky. "
            "Preserve all people exactly. High-end wedding photography style."
        ),
        "label": "Golden Hour",
    },
    # ... (all transforms from Section 3)
}
```

The `generate_creative_transform()` call signature stays unchanged — the `vision_router` just passes the looked-up prompt from `VISION_TRANSFORM_PROMPTS`.

### 5.4 New Files

| File | Purpose |
|------|---------|
| `services/fullstack-gateway/app/api/vision_routes.py` | New router, `POST /v1/vision/transform` |
| `apps/stelarvision-web/` | React/Vite frontend (new app) |
| `apps/stelarvision-api/` | Node/TypeScript BFF (new app) |
| `infra/containerapps/stelarvision-api.bicep` | Container App for the API |
| `infra/containerapps/stelarvision-web.bicep` | Static Web App or Container App for web |

### 5.5 Modified Files

| File | Change |
|------|--------|
| `services/fullstack-gateway/app/services/gemini_vision.py` | Add `VISION_TRANSFORM_PROMPTS` dict |
| `services/fullstack-gateway/app/main.py` | Register `vision_router` |

### 5.6 Image Storage

Transformed images are stored in the existing S3/Azure Blob bucket used by the platform:

- **Key pattern:** `stelarvision/sessions/{session_id}/{uuid}.jpg`
- **Lifecycle:** 72-hour TTL (presigned URL for sharing), permanent if user opts to save
- **Size:** Imagen 3 outputs at ~1024×768 or 1280×960 depending on aspect ratio

---

## 6. Transform Prompt Engineering Notes

### Preserving Subjects

All prompts must include language like:
- "Preserve all people in the photo exactly."
- "Keep all subjects identical."
- "Do not alter the people — only the setting and lighting."

Imagen 3 has a tendency to reinterpret faces if the prompt doesn't anchor them. This is critical for memorial and wedding photos especially.

### Aspect Ratio

The `GenerateImagesConfig` call should pass `aspect_ratio` dynamically based on the source image's orientation:
- Portrait photo → `"3:4"`
- Landscape photo → `"4:3"`
- Square → `"1:1"`

Current code hardcodes `"4:3"` — this should be made dynamic in `_imagen3_fallback()`.

### Memorial Sensitivity

Memorial transforms use subdued, respectful prompts. Add a content gate: if `event_category == "memorial"`, skip `celebration_confetti`, `birthday_*`, and any high-energy transforms — only offer the memorial catalog.

### Scene Quality Labels

Every output image carries this disclaimer string (update from the tours version):
```
"AI Creative Scene — Generated by Imagen 3 / Genie 3. Does not alter or represent the original photograph."
```

---

## 7. Frontend Design Notes

### Event Category Selector

Large illustrated cards, one per event type. Wedding card shows a ceremony icon. Memorial card is muted, dignified — no balloons or confetti icons.

### Scene Picker Grid

Thumbnail grid (3 columns on desktop, 2 on mobile). Each cell:
- Small illustrative example scene (static art, not a real photo)
- Scene label in bold
- Short 1-line description in muted text

Selected state: highlighted border, checkmark. Only one scene selectable at a time per photo.

### Batch / Scrapbook Mode

Toggle: "Single Photo" / "Scrapbook (up to 12)". In scrapbook mode:
- Photo strip shows all uploaded thumbnails across the bottom
- Click a photo to select it and choose its scene
- "Apply to All" button: use the currently selected scene for all unassigned photos
- Progress bar during generation: "Creating scenes... 4 / 12"

### Output Preview

- Side-by-side slider (drag to reveal original vs. transformed)
- Below: Download JPEG | Download All | Share Link | Regenerate

### Accessibility

- All uploads accept HEIC (iPhone) and auto-convert on the API side
- Alt text on all output images: `"[Event type] scene transform of uploaded photo — generated by Imagen 3"`
- Memorial color palette avoids bright colors throughout the UI when memorial category is active

---

## 8. Data Model

```typescript
// Session
interface VisionSession {
  sessionId: string;
  eventCategory: EventCategory;
  createdAt: string;           // ISO8601
  photos: VisionPhoto[];
}

interface VisionPhoto {
  photoId: string;
  originalUrl: string;         // S3 presigned, 72hr
  transformKey: string | null;
  transformLabel: string | null;
  outputUrl: string | null;    // S3 presigned, 72hr
  status: "pending" | "generating" | "done" | "failed";
  generatedAt: string | null;
  model: string | null;
}

type EventCategory =
  | "wedding"
  | "graduation"
  | "birthday"
  | "memorial"
  | "baby"
  | "holiday"
  | "achievement"
  | "celebration";
```

---

## 9. API Surface

### stelarvision-api → fullstack-gateway

```
POST /v1/vision/transform
  Header: X-API-Key (internal key, not user-facing)
  Body: VisionTransformRequest

GET  /v1/vision/session/:sessionId
  Returns session with all photo statuses and presigned URLs
```

### stelarvision-web → stelarvision-api (user-facing BFF)

```
POST /api/sessions
  Creates a new session, returns sessionId

POST /api/sessions/:sessionId/photos
  Uploads photo(s), returns photoId(s)

POST /api/sessions/:sessionId/photos/:photoId/transform
  Body: { transformKey: string }
  Triggers generation, returns immediately (async)

GET  /api/sessions/:sessionId
  Poll for status and output URLs

GET  /api/sessions/:sessionId/download
  Returns ZIP of all transformed images in session
```

---

## 10. Out of Scope (v1)

- Video output of any kind
- Music or audio
- Text overlays or captions on images
- AI-generated captions or narration
- Automated album ordering or printing
- Social sharing integrations (v2)
- User accounts or saved sessions beyond 72hr (v2)
