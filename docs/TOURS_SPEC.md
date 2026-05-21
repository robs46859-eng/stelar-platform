# Stelar Platform — Intelligent Tour Agent System
## Full Specification v1.0 — 2026-05-21

**Scope:** StelarPeople (property tours) + StelarVacay (destination tours)  
**Primary models:** Gemma 4 26B (text/narration) · Gemini 2.0 Flash (vision/image analysis) · Imagen 3 / Genie 3 (creative preview generation)  
**Maps stack:** Google Maps JavaScript API (Street View Service, Photorealistic 3D Maps, Geometry library)

---

## 1. Purpose

The Stelar Tour Agent System gives users the ability to **experience a property or destination before they visit** — using live Street View panoramas, AI-narrated arrival sequences, image-based environment reconstruction, and creative AI previews. Every AI-generated creative transformation is clearly labeled as a preview, never presented as reality.

---

## 2. Model Responsibilities

| Model | Role | Transport |
|---|---|---|
| **Gemma 4 26B** (Ollama VM) | Tour scripts, safety narration, neighborhood summaries, commute previews, inspection checklists, fraud reasoning, route-to-door dialogue | FullStack Gateway `/v1/tour/*` |
| **Gemini 2.0 Flash** (Google AI) | Image analysis from uploaded photos, Street View scene understanding, environment feature extraction, mismatch detection | Gateway `/v1/tour/image-analyze` |
| **Imagen 3 / Genie 3** (Google AI / Vertex AI) | Creative property transformations (staged, renovated, seasonal), vacation destination previews, neighborhood "potential" renders | Gateway `/v1/tour/genie-transform` |
| **Google Maps JS** (browser-native) | Interactive Street View panoramas, Photorealistic 3D aerial view, heading computation, geometry | Frontend SDK (not Static API) |

**Genie 3 note:** Google's Genie 3 generative world model generates interactive environments from images. Where the Genie 3 API is not yet publicly available, Imagen 3 (`imagen-3.0-generate-002`) is used as a bridge. All Genie-style outputs are clearly labeled "AI Creative Preview — Not a verified source."

---

## 3. Architecture Overview

```
Browser
  ├── Google Maps JS (streetView + geometry + maps libraries)
  │     ├── StreetViewPanorama — interactive panorama at property/stay coords
  │     ├── StreetViewService — coverage check before rendering
  │     └── Map (tilt=45, mapTypeId=satellite) — photorealistic 3D aerial
  │
  ├── TourAgentOverlay — narration bubbles synced to panorama heading/position
  ├── ImageUploadTour — drag-and-drop → Gemini image analysis → tour enhancement
  └── GeniePreviewPanel — creative AI transformations, always labeled

Frontend (StelarPeople/StelarVacay API routes)
  ├── POST /api/properties/:id/tour/session     → create tour session
  ├── POST /api/stays/:id/tour/session          → create vacay tour session
  └── POST /api/tour/image-upload               → forward to gateway image-analyze

FullStack Gateway (/v1/tour/*)
  ├── POST /v1/tour/narrate            [EXISTING] Gemma4 full neighborhood JSON
  ├── POST /v1/tour/street-narrate     [NEW] Gemma4 property arrival script
  ├── POST /v1/tour/image-analyze      [NEW] Gemini vision analysis of uploaded images
  ├── POST /v1/tour/genie-transform    [NEW] Imagen3/Genie creative preview generation
  └── POST /v1/tour/vacay-route        [NEW] Gemma4 route preview narrative

Ollama VM (Gemma 4 26B)              → text narration, scripts, checklists
Google AI (Gemini 2.0 Flash)         → vision analysis, image understanding
Google AI (Imagen 3 / Genie 3)       → creative property transformations
```

---

## 4. StelarPeople — Interactive Property Tour Agent

### 4.1 Entry Point

User clicks **"Preview Unit Area"** on any property card in `/properties`.

### 4.2 Tour Page — `/properties/:id/tour`

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Properties    [Property Name]            │
│  [Aerial View Toggle] [Street View] [Floor Plan]    │
├────────────────────────┬────────────────────────────┤
│                        │  TOUR AGENT PANEL          │
│  STREET VIEW PANORAMA  │  ┌──────────────────────┐  │
│  (interactive 360°)    │  │ 🏠 Arrival Narration  │  │
│                        │  │ "Head north on Oak   │  │
│  [Heading indicator]   │  │  St, look for..."    │  │
│  [Compass]             │  └──────────────────────┘  │
│  [Zoom controls]       │  ┌──────────────────────┐  │
│                        │  │ 🚗 Parking           │  │
│  [3D Aerial toggle]    │  │ Street parking on... │  │
├────────────────────────┤  └──────────────────────┘  │
│  UPLOADED PHOTOS       │  ┌──────────────────────┐  │
│  [Drop photos here]    │  │ 🚌 Transit           │  │
│  [Gemini Analysis]     │  │ Bus 12 at Oak/Main  │  │
│                        │  └──────────────────────┘  │
├────────────────────────┴────────────────────────────┤
│  GENIE CREATIVE PREVIEW  [AI Creative Preview label]│
│  [Original] [Staged] [Renovated] [Seasonal]         │
├─────────────────────────────────────────────────────┤
│  INSPECTION CHECKLIST     FRAUD FLAGS               │
│  [Exterior Access ✓]     [⚠ Photo mismatch]        │
│  [Building Envelope]      [Address confirmed ✓]     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Agent Narration Segments

Gemma 4 generates a structured `PropertyArrivalScript` with these segments, each displayed as a narration bubble synced to a Street View heading:

| Segment | Heading Range | Content |
|---|---|---|
| `route_to_door` | front-facing (0°) | "From the street, approach from north. Look for the blue awning at 310 Cedar..." |
| `parking` | sweeping 45°-135° | "Street parking available on both sides. Permit zone 4B after 6pm..." |
| `transit_access` | toward nearest stop | "Bus stop 2 blocks east. Line 12 runs every 8min peak..." |
| `exterior_condition` | building-facing | "Note the facade: look for cracks around window frames, efflorescence on brick..." |
| `entry_points` | door/lobby heading | "Main entry: intercom panel on left. Mail room visible through glass..." |
| `neighborhood_pulse` | sweeping 360° | "Block feels walkable. Two coffee shops and a grocery within 5 min..." |
| `fraud_check` | overlay on full scene | "Listing says 'garden view' — Street View shows a parking structure directly behind..." |

### 4.4 Image Upload → Environment Analysis

**Flow:**
1. User drops up to 6 photos (interior, exterior, neighborhood)
2. Frontend POSTs to `/api/tour/image-upload` with base64-encoded images + property listing facts
3. StelarPeople API forwards to Gateway `/v1/tour/image-analyze`
4. Gemini Vision analyzes each image:
   - Extracts building style, era, condition signals
   - Detects neighborhood context (urban/suburban, density, greenery)
   - Identifies potential fraud indicators (stock photo cues, CGI artifacts, mismatched metadata)
   - Estimates square footage and room count from interior shots
5. Gateway Gemma4 compares image-extracted facts against listing facts → fraud score
6. Response enriches the tour overlay with image-grounded narration

**Fraud detection signals from image analysis:**
- Stock photo watermarks or metadata
- CGI/render artifacts (perfect lighting, impossible geometry)
- Mismatched season (snow in "summer" listing photo)
- Address number on building doesn't match listing address
- Room count/size inconsistency with listing square footage
- Neighborhood context doesn't match listing's claimed walkability
- EXIF GPS coordinates far from listed address

### 4.5 Genie 3 / Creative Preview Panel

**Transform types available:**

| Transform | Description | Gemini/Imagen prompt strategy |
|---|---|---|
| `staged` | Virtually staged interior — furniture, art, plants added | Style transfer: "professional real estate staging, warm lighting" |
| `renovated` | Updated finishes — new counters, paint, fixtures | Inpainting: "modern renovation, neutral palette" |
| `seasonal_spring` | Property in spring light — blooming trees, green lawn | Style: "golden hour spring, lush landscaping" |
| `seasonal_winter` | Property in winter — snow, cozy warmth signals | Style: "winter real estate, snow on ground, warm lit windows" |
| `potential_max` | "What it could be" at full renovation potential | Generation: "architect's vision, gut renovation complete" |
| `curb_appeal` | Enhanced exterior only | Inpainting: "fresh paint, manicured lawn, power washed" |

**Labeling requirement (non-negotiable):** Every Genie/Imagen output MUST display:
```
⚡ AI Creative Preview — Not a verified source.
   Generated by Imagen 3 / Genie 3. Does not represent actual property condition.
```

---

## 5. StelarVacay — Destination Tour Agent

### 5.1 Tour Entry Points

Three entry points from the StelarVacay booking flow:

| Button | Context | Tour type |
|---|---|---|
| **"Walk the Neighborhood"** | On any destination card | `vacay_neighborhood_walk` |
| **"Preview Route to [Attraction]"** | On itinerary builder | `vacay_route_preview` |
| **"Compare Arrival Experience"** | On saved plans page | `vacay_arrival_compare` |

### 5.2 Neighborhood Walk Flow

Same Street View + Gemma4 architecture as StelarPeople but tuned for travelers:
- Narration focuses on: safety for tourists, transportation from airport, local food within walking distance, nightlife noise impact, hotel-to-beach/attraction route
- Uses `tour_type: 'vacay_preview'` on the existing gateway endpoint

### 5.3 Route Preview Flow

```
POST /v1/tour/vacay-route
{
  "from_address": "123 Hotel Row, Cancun MX",
  "to_address": "Chichen Itza, Yucatan MX",
  "transit_preference": "cheapest|balanced|fastest",
  "traveler_count": 2,
  "departure_time": "08:00"
}
→ Returns: RouteNarrative with step-by-step Street View anchors + Gemma4 commentary
```

### 5.4 Arrival Comparison Flow

Shows two destinations side-by-side:
- Left: Street View of Destination A neighborhood
- Right: Street View of Destination B neighborhood
- Gemma4 narrates key differences in safety, vibe, walkability, transit

---

## 6. Gateway API Endpoints — New Additions

### 6.1 `POST /v1/tour/street-narrate`

Generates a structured arrival script for a property using Gemma 4.

**Request:**
```json
{
  "tour_id": "uuid",
  "address": "310 Cedar St, Austin TX 78701",
  "lat": 30.2672,
  "lon": -97.7431,
  "listing_facts": {
    "bedrooms": 2,
    "bathrooms": 1,
    "sqft": 850,
    "rent_cents": 180000,
    "amenities": ["parking", "laundry", "pets_ok"],
    "listed_walkability": "very walkable",
    "listed_transit": "excellent"
  },
  "tour_type": "property_arrival"
}
```

**Response:**
```json
{
  "tour_id": "uuid",
  "model": "gemma4:26b",
  "script": {
    "route_to_door": {
      "text": "...",
      "heading_deg": 0,
      "duration_sec": 45
    },
    "parking": { "text": "...", "heading_deg": 90 },
    "transit_access": { "text": "...", "heading_deg": 45 },
    "exterior_condition": { "text": "...", "heading_deg": 180, "inspection_prompts": ["..."] },
    "entry_points": { "text": "...", "heading_deg": 355 },
    "neighborhood_pulse": { "text": "...", "heading_deg": null },
    "fraud_check": { "text": "...", "severity": "medium", "flags": ["..."] }
  },
  "commute_preview": {
    "to_downtown": { "walk_min": 22, "drive_min": 8, "transit_min": 15 },
    "commentary": "..."
  },
  "safety_summary": {
    "grade": "B",
    "score": 71,
    "day_notes": "...",
    "night_notes": "...",
    "women_notes": "..."
  },
  "what_to_inspect_in_person": [
    { "item": "...", "why": "...", "priority": "critical" }
  ],
  "disclaimer": "AI-generated tour. Not a verified source."
}
```

### 6.2 `POST /v1/tour/image-analyze`

Sends uploaded property images to Gemini Vision for analysis.

**Request:** `multipart/form-data`
- `images[]`: up to 6 JPEG/PNG files (max 10MB each)
- `listing_facts`: JSON string with claimed attributes
- `tour_id`: string

**Response:**
```json
{
  "tour_id": "uuid",
  "model": "gemini-2.0-flash",
  "images": [
    {
      "index": 0,
      "detected_type": "exterior_front",
      "building_style": "mid-century modern",
      "condition_signals": ["fresh paint", "clean gutters", "intact foundation"],
      "red_flags": [],
      "stock_photo_risk": 0.05,
      "cgi_artifact_risk": 0.02,
      "estimated_sqft_from_room": null,
      "neighborhood_context": "suburban, moderate density, mature trees"
    }
  ],
  "fraud_assessment": {
    "overall_risk_score": 0.12,
    "risk_level": "low",
    "flags": [],
    "mismatch_signals": ["listing claims 'garden view' — exterior shows adjacent structure"]
  },
  "enhancement_narrative": "Based on uploaded photos, the property appears well-maintained..."
}
```

### 6.3 `POST /v1/tour/genie-transform`

Generates a creative AI preview transformation using Imagen 3 / Genie 3.

**Request:**
```json
{
  "tour_id": "uuid",
  "source_image_b64": "...",
  "transform_type": "staged|renovated|seasonal_spring|potential_max|curb_appeal",
  "product": "stelarpeople|stelarvacay"
}
```

**Response:**
```json
{
  "tour_id": "uuid",
  "transform_type": "staged",
  "model": "imagen-3.0-generate-002",
  "output_image_b64": "...",
  "label": "AI Creative Preview — Not a verified source. Generated by Imagen 3 / Genie 3.",
  "generation_params": { "style": "...", "guidance_scale": 7.5 }
}
```

### 6.4 `POST /v1/tour/vacay-route`

Generates a route narrative between two locations for StelarVacay.

**Request:**
```json
{
  "tour_id": "uuid",
  "from_address": "string",
  "from_lat": 0.0,
  "from_lon": 0.0,
  "to_address": "string",
  "to_lat": 0.0,
  "to_lon": 0.0,
  "transit_preference": "cheapest",
  "traveler_count": 2,
  "departure_time": "08:00"
}
```

**Response:**
```json
{
  "tour_id": "uuid",
  "model": "gemma4:26b",
  "route_narrative": "string",
  "steps": [
    {
      "step": 1,
      "instruction": "Walk out of hotel lobby, turn right...",
      "street_view_lat": 0.0,
      "street_view_lon": 0.0,
      "heading_deg": 90,
      "mode": "walk|transit|drive"
    }
  ],
  "total_estimated_minutes": 45,
  "cost_estimate_usd": 8.50,
  "safety_notes": "string",
  "local_tips": ["string"]
}
```

---

## 7. Frontend Components

### 7.1 Shared: `StreetViewPanel`

- Wraps `google.maps.StreetViewPanorama` (browser-native, interactive)
- Calls `google.maps.StreetViewService.getPanorama()` to verify coverage before render
- Auto-computes heading toward building using `google.maps.geometry.spherical.computeHeading()`
- Shows 404 state with aerial fallback when no Street View coverage exists
- Exposes `onHeadingChange` callback for narration sync
- Props: `lat`, `lon`, `initialHeading`, `overlayChildren`, `onNoPanorama`

### 7.2 Shared: `PhotorealisticAerialView`

- `google.maps.Map` with `tilt: 45`, `mapTypeId: 'satellite'`
- Centers on property, zoom 18
- Overlays property marker with listing fact popover
- Toggle button switches between aerial and Street View

### 7.3 `TourAgentOverlay`

- Floating narration bubble that appears over Street View
- Syncs narration segment to current panorama heading
- Auto-advances through script segments with read/pause controls
- Shows segment type icon (🏠 route · 🚗 parking · 🚌 transit · 🔍 inspection · ⚠ fraud)
- Text-to-speech available (Web Speech API, no external dependency)

### 7.4 `ImageUploadTour`

- Drag-and-drop zone accepting up to 6 images
- Shows upload progress, thumbnail previews
- Calls `POST /api/tour/image-upload` with multipart form
- On response: renders fraud risk score, image analysis cards
- Integrates analysis into tour narration overlay

### 7.5 `GeniePreviewPanel`

- Shows transform type selector (tabs: Original / Staged / Renovated / Seasonal / Max Potential)
- Each non-original tab shows the Imagen/Genie output with a mandatory label banner
- Label: "⚡ AI Creative Preview — Not a verified source. Generated by Imagen 3."
- Download button (labeled as preview, not verified photo)
- Share button with label baked into shared image metadata

### 7.6 `InspectionChecklist`

- Reuses existing `inspection_checklist` structure from `TourResponse`
- Sortable by priority (critical → low), filterable by buyer/renter/all
- Checkbox state persisted to localStorage per property ID
- Export to PDF (client-side, no backend needed)

### 7.7 `FraudFlagPanel`

- Displays fraud flags from both Gemma tour narration and Gemini image analysis
- Color-coded: red=critical, orange=high, yellow=medium
- Each flag shows: claim, observation, recommendation
- Aggregate fraud risk score (0-100)

---

## 8. Google Maps Integration Details

### 8.1 Street View JavaScript Service (browser-native, NOT Static API)

```typescript
// Load once per app using existing mapsLoader.ts pattern
// libraries: maps, streetView, marker, geometry
const sv = new google.maps.StreetViewService();
sv.getPanorama({ location: { lat, lng }, radius: 50, source: google.maps.StreetViewSource.OUTDOOR }, callback);

// Render interactive panorama
const panorama = new google.maps.StreetViewPanorama(containerEl, {
  position: { lat, lng },
  pov: { heading, pitch: 0 },
  zoom: 1,
  fullscreenControl: false,
  linksControl: true,
  panControl: true,
  enableCloseButton: false,
});
```

### 8.2 Heading Computation for Building Face

```typescript
// Compute heading from street position toward building entrance
const propertyPos = new google.maps.LatLng(propertyLat, propertyLon);
const streetViewPos = new google.maps.LatLng(svLat, svLon);
const heading = google.maps.geometry.spherical.computeHeading(streetViewPos, propertyPos);
```

### 8.3 Photorealistic 3D / Aerial View

```typescript
const map = new google.maps.Map(el, {
  center: { lat, lng },
  zoom: 18,
  tilt: 45,
  heading: 0,
  mapTypeId: 'satellite',
  disableDefaultUI: false,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_ID, // required for vector rendering
});
```

### 8.4 Environment Variable Requirements (per web app)

```env
VITE_GOOGLE_MAPS_API_KEY=...      # Google Maps JS API key (browser-side)
VITE_GOOGLE_MAPS_ID=...           # Map ID for photorealistic 3D
VITE_API_URL=...                   # Backend API base
```

### 8.5 Gateway Environment Variables (server-side)

```env
GOOGLE_AI_API_KEY=...              # Gemini + Imagen API access
GOOGLE_CLOUD_PROJECT_ID=...        # Vertex AI project (for Imagen 3)
GOOGLE_CLOUD_REGION=us-central1    # Vertex AI region
```

---

## 9. Data Models

### 9.1 TourSession

```typescript
interface TourSession {
  id: string;                       // UUID
  product: 'stelarpeople' | 'stelarvacay';
  tour_type: TourType;
  entity_id: string;                // property ID or stay ID
  created_at: string;               // ISO 8601
  lat: number | null;
  lon: number | null;
  listing_facts: Record<string, unknown>;
  narration: PropertyArrivalScript | null;
  image_analysis: ImageAnalysisResult | null;
  fraud_aggregate_score: number | null;  // 0-100
}
```

### 9.2 PropertyArrivalScript

```typescript
interface NarrationSegment {
  text: string;
  heading_deg: number | null;       // Street View heading to display this at
  duration_sec: number;
  inspection_prompts?: string[];
}

interface PropertyArrivalScript {
  tour_id: string;
  model: string;
  script: {
    route_to_door: NarrationSegment;
    parking: NarrationSegment;
    transit_access: NarrationSegment;
    exterior_condition: NarrationSegment;
    entry_points: NarrationSegment;
    neighborhood_pulse: NarrationSegment;
    fraud_check: NarrationSegment & { severity: string; flags: string[] };
  };
  commute_preview: CommutePreview;
  safety_summary: SafetySummary;
  what_to_inspect_in_person: InspectionItem[];
  disclaimer: string;
}
```

---

## 10. Labeling Policy for AI-Generated Content

**Rule:** Any image, video, or text generated by Gemini, Imagen 3, or Genie 3 that could be confused with reality **must** display a visible label. Text narration from Gemma 4 is clearly advisory, not photographic, and does not require the same label but must include a disclaimer footer.

| Content type | Required label |
|---|---|
| Imagen/Genie transform image | "⚡ AI Creative Preview — Not a verified source. Generated by Imagen 3 / Genie 3." |
| Gemma tour narration text | Disclaimer footer: "AI-generated narration. Informational only. Not a verified source." |
| Gemini image analysis | "Analysis by Gemini AI. Independent verification recommended." |
| Full neighborhood tour JSON | Existing `disclaimer` field in `meta` |

Labels must:
- Be visible without scrolling (above the fold on mobile)
- Use a distinct visual treatment (amber badge or bordered warning box)
- Not be dismissible on first view (can be collapsed after acknowledged)

---

## 11. Security & Privacy

- All image uploads are processed in-memory; no raw images stored to Blob Storage without explicit opt-in
- Gemini API calls route through the FullStack Gateway — no direct API key exposure to frontend
- Street View API key scoped to `streetviewpublish.readonly` + HTTP referrer restriction
- Maps API key scoped to referrer whitelist (app domains only)
- Tour sessions expire after 24h; no PII in tour session records
- Image EXIF stripped server-side before Gemini analysis
- Fraud flag outputs never state certainty — always framed as "signals to investigate"

---

## 12. Implementation Order

| Phase | Work | Status |
|---|---|---|
| 12.1 | Gateway: `/v1/tour/street-narrate` endpoint (Gemma4) | ✅ Spec'd |
| 12.2 | Gateway: `/v1/tour/image-analyze` endpoint (Gemini Vision) | ✅ Spec'd |
| 12.3 | Gateway: `/v1/tour/genie-transform` endpoint (Imagen3) | ✅ Spec'd |
| 12.4 | Gateway: `/v1/tour/vacay-route` endpoint (Gemma4) | ✅ Spec'd |
| 12.5 | StelarPeople API: tour session routes | ✅ Spec'd |
| 12.6 | StelarVacay API: tour session routes | ✅ Spec'd |
| 12.7 | Shared: `StreetViewPanel` + `PhotorealisticAerialView` components | ✅ Spec'd |
| 12.8 | StelarPeople Web: `PropertyTourPage` + overlay components | ✅ Spec'd |
| 12.9 | StelarVacay Web: `VacayTourPage` + neighborhood walk | ✅ Spec'd |
| 12.10 | Genie preview panel + labeling enforcement | ✅ Spec'd |
