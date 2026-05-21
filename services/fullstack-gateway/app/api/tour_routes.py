import asyncio
import base64
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.gemini_vision import analyze_images, generate_creative_transform

logger = logging.getLogger(__name__)
tour_router = APIRouter(prefix="/v1/tour")

GEMINI_NARRATE_MODEL = "gemini-2.5-flash"


def _call_gemini_sync(system: str, user: str, api_key: str) -> str:
    from google import genai
    from google.genai import types as genai_types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_NARRATE_MODEL,
        contents=[{"role": "user", "parts": [{"text": user}]}],
        config=genai_types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
            max_output_tokens=4096,
            thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
        ),
    )
    return (response.text or "").strip()


async def _call_gemini(system: str, user: str) -> str:
    settings = get_settings()
    return await asyncio.to_thread(_call_gemini_sync, system, user, settings.google_ai_api_key)

SCHEMA_DESCRIPTION = """
Return ONLY a valid JSON object — no prose, no markdown fences, no extra text.
Populate every field. Use your training knowledge about the neighborhood to fill fields you aren't given data for.
Schema type hints: where you see "number" write a real number, "boolean" write true or false, "number|null" write a number or null, "string" write real text, "A|B|C|D|F" pick one letter grade. All values must be valid JSON.

Schema (fill every key):
{
  "meta": {
    "tour_id": "<provided>",
    "neighborhood": "string",
    "city": "string",
    "state": "string",
    "tour_type": "string",
    "generated_at": "ISO8601",
    "model": "gemini-2.5-flash",
    "confidence_score": 0.0-1.0,
    "disclaimer": "AI-generated tour. Informational only. Not a verified source."
  },
  "arrival": {
    "primary_approach": "string",
    "approach_vectors": {"from_north":"string","from_south":"string","from_east":"string","from_west":"string"},
    "first_impression": "string",
    "gateway_landmarks": ["string"],
    "boundary_markers": ["string"],
    "arrival_vibe": "string",
    "time_of_day_notes": {"morning":"string","midday":"string","evening":"string","late_night":"string"},
    "seasonality": {"spring":"string","summer":"string","fall":"string","winter":"string"}
  },
  "navigation": {
    "walk_to_core": "string",
    "main_pedestrian_routes": ["string"],
    "transit_stops": [{"name":"string","type":"bus|subway|light_rail|commuter_rail|ferry","lines":["string"],"distance_ft":number,"walk_minutes":number,"frequency_peak_min":number|null,"frequency_off_peak_min":number|null,"accessibility":boolean}],
    "parking": [{"zone_type":"street_free|street_metered|permit|garage|lot","name":null,"distance_ft":number,"hourly_rate":null,"max_hours":null,"permit_required":boolean,"availability":"abundant|moderate|scarce"}],
    "bike_infrastructure": {"has_protected_lanes":boolean,"has_shared_lanes":boolean,"has_trail_access":boolean,"bike_share_docks":[{"name":"string","distance_ft":number}],"notes":"string"},
    "accessibility": {"wheelchair_accessible":boolean,"curb_cut_quality":"good|fair|poor|unknown","elevator_access":boolean,"notes":"string"},
    "ride_share": {"pickup_zones":["string"],"typical_wait_minutes":number|null,"surge_likelihood":"low|medium|high"},
    "navigation_landmarks": ["string"],
    "distances_to_key_hubs": {"downtown_mi":number|null,"airport_mi":number|null,"nearest_highway_mi":number|null,"nearest_park_mi":number|null}
  },
  "safety": {
    "overall_score": number,
    "overall_grade": "A|B|C|D|F",
    "day_safety": {"score":number,"grade":"A|B|C|D|F","notes":"string"},
    "night_safety": {"score":number,"grade":"A|B|C|D|F","notes":"string"},
    "crime_profile": {
      "property_crime": {"score":number,"grade":"A|B|C|D|F","notes":"string"},
      "violent_crime": {"score":number,"grade":"A|B|C|D|F","notes":"string"},
      "trend": "improving|stable|worsening|unknown",
      "context": "string",
      "comparison_to_city_avg": "string"
    },
    "environmental_safety": {"flood_zone":boolean,"flood_zone_type":null,"fire_risk":"low|moderate|high|unknown","air_quality_index":number|null,"noise_pollution":"low|moderate|high","toxic_sites_nearby":boolean,"notes":"string"},
    "lighting_quality": "excellent|good|fair|poor",
    "foot_traffic_density": "very_high|high|moderate|low|sparse",
    "neighborhood_watch": boolean,
    "gated_access": boolean,
    "emergency_services": [{"name":"string","type":"police|fire|hospital|urgent_care|trauma_center","distance_ft":number,"drive_minutes":number,"walk_minutes":number|null}],
    "perceived_safety_notes": "string",
    "women_safety_notes": "string",
    "child_safety_notes": "string"
  },
  "physical_environment": {
    "street_grid_type": "grid|organic|radial|cul_de_sac|mixed",
    "topography": "flat|gentle_hills|steep_hills|steps_required",
    "sidewalk_quality": {"continuity":"complete|mostly_complete|gaps|minimal","condition":"excellent|good|fair|poor","width":"wide|standard|narrow|varies"},
    "road_condition": "excellent|good|fair|poor",
    "tree_canopy": "dense|moderate|sparse|minimal",
    "green_space": {
      "parks": [{"name":"string","distance_ft":number,"features":["string"],"dog_friendly":boolean}],
      "pocket_parks": number,
      "community_gardens": [{"name":"string","distance_ft":number}],
      "trails": [{"name":"string","distance_ft":number,"length_mi":number|null}],
      "waterfront": boolean,
      "waterfront_notes": null
    },
    "water_features": ["string"],
    "noise_profile": {"primary_sources":["string"],"decibel_estimate":"quiet|moderate|loud|very_loud","peak_hours":"string","quiet_hours":"string"},
    "air_quality": "string",
    "weather_exposure": {"wind_corridor":boolean,"flood_prone":boolean,"shade_coverage":"excellent|good|fair|poor","solar_exposure":"high|moderate|low"},
    "street_lighting": "excellent|good|fair|poor",
    "public_seating": "abundant|some|minimal|none",
    "public_art": ["string"]
  },
  "architecture": {
    "dominant_style": "string",
    "era": "string",
    "building_heights": "low_rise|mid_rise|high_rise|mixed",
    "facade_condition": "excellent|good|fair|poor",
    "notable_buildings": [{"name":"string","description":"string"}],
    "historic_designation": boolean,
    "historic_notes": null,
    "new_construction_signals": ["string"],
    "renovation_activity": "active|moderate|minimal",
    "street_art_murals": [{"description":"string","location":"string"}],
    "signage_quality": "excellent|good|fair|poor",
    "vacancy_signals": ["string"],
    "architectural_character": "string"
  },
  "amenities": {
    "food_and_drink": {
      "coffee_shops": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "restaurants": [{"name":"string","distance_ft":number,"walk_minutes":number,"cuisine":"string","price_range":"$|$$|$$$|$$$$"}],
      "bars_and_nightlife": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "fast_food": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "food_halls": [],
      "food_trucks": "string",
      "late_night_options": "string",
      "delivery_coverage": "excellent|good|fair|limited",
      "grocery": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "specialty_food": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "farmers_market": null
    },
    "health_and_wellness": {
      "primary_care": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "urgent_care": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "hospitals": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "pharmacies": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "mental_health_services": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "gyms_fitness": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "yoga_pilates": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "spas_wellness": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "dental": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "vision": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "specialty_care": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}]
    },
    "education": {
      "public_elementary": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null,"type":"public","grades":"string","rating":null}],
      "public_middle": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null,"type":"public","grades":"string","rating":null}],
      "public_high": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null,"type":"public","grades":"string","rating":null}],
      "private_schools": [],
      "charter_schools": [],
      "universities": [],
      "libraries": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "tutoring_centers": [],
      "childcare_daycare": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "after_school_programs": "string"
    },
    "retail_and_services": {
      "shopping_centers": [],
      "boutique_retail": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "banks_atms": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "laundromats": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "dry_cleaners": [],
      "hardware": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "salons_barbers": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "pet_services": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "auto_services": [],
      "postal": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "coworking_spaces": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "print_copy": []
    },
    "recreation_and_culture": {
      "parks": [{"name":"string","distance_ft":number,"features":["string"],"dog_friendly":boolean}],
      "playgrounds": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "sports_courts": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null,"court_type":"string","public":boolean}],
      "public_pools": [],
      "community_centers": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "museums_galleries": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "theaters_venues": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "cinemas": [],
      "religious_institutions": [{"denomination":"string","name":"string","distance_ft":number}],
      "dog_parks": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "bowling_entertainment": [],
      "escape_rooms_activities": []
    },
    "outdoor_and_nature": {
      "hiking_trails": [],
      "bike_trails": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "water_access": null,
      "nature_preserves": [],
      "botanical_gardens": []
    },
    "nightlife": {
      "bar_count_radius_half_mile": number|null,
      "club_scene": "active|moderate|minimal|none",
      "live_music_venues": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "karaoke": [],
      "late_night_food": [{"name":"string","distance_ft":number,"walk_minutes":number,"notable":null}],
      "noise_impact_on_residents": "string"
    }
  },
  "real_estate": {
    "median_rent_1br": number|null,
    "median_rent_2br": number|null,
    "median_rent_3br": number|null,
    "median_home_value": number|null,
    "price_per_sqft": number|null,
    "rent_trend": "rising_fast|rising|stable|falling|unknown",
    "yoy_rent_change_pct": number|null,
    "days_on_market_avg": number|null,
    "inventory_level": "very_tight|tight|balanced|abundant",
    "property_types": ["string"],
    "renter_vs_owner_pct": {"renters":number,"owners":number},
    "recent_development": {"new_construction_active":boolean,"conversions_active":boolean,"demolitions_active":boolean,"notes":"string"},
    "zoning": {"primary_zone":"string","mixed_use_zones":boolean,"upzoning_activity":boolean,"notes":"string"},
    "gentrification_stage": "stable|early_signs|transitioning|advanced|post_gentrification",
    "investment_signals": ["string"],
    "affordability_notes": "string",
    "utility_costs_notes": "string"
  },
  "community": {
    "population_estimate": number|null,
    "population_density": "very_dense|dense|moderate|sparse",
    "age_profile": "young_professionals|families|seniors|college|mixed",
    "notable_demographics": "string",
    "languages_commonly_spoken": ["string"],
    "cultural_character": "string",
    "political_climate": "string",
    "community_engagement": "high|moderate|low",
    "notable_events": ["string"],
    "neighborhood_associations": ["string"],
    "social_scene": "string",
    "pet_friendliness": "very_friendly|friendly|neutral|restricted",
    "child_friendliness": "excellent|good|fair|poor",
    "senior_friendliness": "excellent|good|fair|poor",
    "lgbtq_friendliness": "string"
  },
  "mobility": {
    "walk_score": number,
    "transit_score": number,
    "bike_score": number,
    "car_dependency": "walker_paradise|very_walkable|walkable|car_dependent|driving_only",
    "rush_hour_traffic": "severe|heavy|moderate|light",
    "commute_to_downtown_minutes": {"walk":number|null,"drive":number|null,"transit":number|null,"bike":number|null},
    "road_connectivity": "excellent|good|fair|poor",
    "ev_charging_stations": [],
    "scooter_share": boolean,
    "mobility_barriers": ["string"]
  },
  "corridors": [
    {"id":"string","name":"string","type":"commercial|mixed-use|residential|transit","key_businesses":["string"],"foot_traffic":"very_high|high|moderate|low","anchor_tenants":["string"],"vibe":"string","vacancy_rate_pct":number|null}
  ],
  "inspection_checklist": [
    {"category":"string","icon":"string","items":[{"item":"string","what_to_look_for":"string","red_flags":["string"],"priority":"critical|high|medium|low","applies_to":"all|renter|buyer"}]}
  ],
  "fraud_flags": [
    {"flag_type":"listing_photo_mismatch|address_discrepancy|amenity_misrepresentation|pricing_anomaly|description_inconsistency|duplicate_listing|synthetic_photo_indicator","claim":"string","observation":"string","severity":"critical|high|medium|low","recommendation":"string"}
  ],
  "atmosphere": {
    "tagline": "string — one punchy memorable line",
    "morning_character": "string",
    "daytime_character": "string",
    "evening_character": "string",
    "late_night_character": "string",
    "weekend_vs_weekday": "string",
    "seasonal_highlights": [{"season":"string","description":"string"}],
    "who_lives_here": "string",
    "who_visits_here": "string",
    "why_people_love_it": ["string"],
    "common_complaints": ["string"],
    "hidden_gems": ["string"],
    "local_insider_tips": ["string"],
    "what_to_know_before_moving_in": ["string"],
    "is_ai_generated_label": "AI Creative Preview — Not a verified source"
  }
}
"""

SYSTEM_PROMPT = (
    "You are StelarGem Tour Agent — a spatial intelligence assistant for the Stelar platform. "
    "Your job is to produce a comprehensive, accurate, and structured JSON tour of a neighborhood. "
    "You have deep knowledge of US neighborhoods from your training. "
    "Use that knowledge to fill every field. Where you are genuinely uncertain, use null for numbers "
    "and empty arrays for lists — never invent specific business names unless you are confident they exist. "
    "Be precise about distances (convert blocks to feet: 1 block ≈ 300ft). "
    "Safety scores: 0=worst, 100=best. Grades: A=80-100, B=60-79, C=40-59, D=20-39, F=0-19. "
    "For inspection_checklist, generate exhaustive categories: Exterior Access, Building Envelope, "
    "Interior Common Areas, Unit Interior, Utilities & Mechanicals, Safety & Compliance, "
    "Documentation, Neighborhood Context. "
    "For fraud_flags, only include flags when the provided listing_facts contain suspicious patterns. "
    "Return ONLY the JSON object. No explanation, no markdown, no code fences."
)


class TourRequest(BaseModel):
    tour_id: str
    neighborhood: str
    city: str
    state: str
    lat: float | None = None
    lon: float | None = None
    tour_type: str
    scores: dict = {}
    corridors: list[dict] = []
    listing_facts: dict = {}


@tour_router.post("/narrate")
async def narrate_tour(
    body: TourRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if x_api_key != settings.dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    scores_summary = ""
    if body.scores:
        parts = [f"{k.replace('_', ' ').title()}: {v}" for k, v in body.scores.items() if v is not None]
        if parts:
            scores_summary = "Provided data scores: " + ", ".join(parts) + ". "

    corridors_summary = ""
    if body.corridors:
        names = [c.get("name", "") for c in body.corridors[:6]]
        corridors_summary = f"Known corridors: {', '.join(names)}. "

    listing_summary = ""
    if body.listing_facts:
        facts = [f"{k}: {v}" for k, v in list(body.listing_facts.items())[:10]]
        listing_summary = "Listing claims: " + "; ".join(facts) + ". "

    coords = f"Approximate coordinates: {body.lat}, {body.lon}. " if body.lat and body.lon else ""

    user_message = (
        f"Generate a complete tour JSON for: {body.neighborhood}, {body.city}, {body.state}. "
        f"Tour type: {body.tour_type}. "
        f"Tour ID: {body.tour_id}. "
        f"Generated at: {datetime.now(timezone.utc).isoformat()}. "
        f"{coords}{scores_summary}{corridors_summary}{listing_summary}"
        f"\n\n{SCHEMA_DESCRIPTION}"
    )

    try:
        raw = (await _call_gemini(SYSTEM_PROMPT, user_message)).strip()
    except Exception as exc:
        logger.error("tour_gemma_error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Inference error: {exc}") from exc

    # Strip any accidental markdown fences Gemma may add
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        tour_data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("tour_json_parse_error raw=%s", raw[:500], exc_info=True)
        tour_data = {
            "meta": {
                "tour_id": body.tour_id,
                "neighborhood": body.neighborhood,
                "city": body.city,
                "state": body.state,
                "tour_type": body.tour_type,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "model": "gemini-2.5-flash",
            },
            "narration": raw,
        }

    logger.info("tour_generated tour_id=%s neighborhood=%s type=%s", body.tour_id, body.neighborhood, body.tour_type)
    return tour_data


# ─── Street-Narrate: Gemma4 property arrival script ──────────────────────────

STREET_NARRATE_SYSTEM = (
    "You are StelarPeople Tour Agent. Generate a structured JSON arrival script for a property. "
    "Be conversational, warm, and specific — like a knowledgeable local friend guiding someone. "
    "For each segment: route_to_door, parking, transit_access, exterior_condition, entry_points, "
    "neighborhood_pulse, fraud_check. "
    "Assign heading_deg (0-359, compass degrees) to each segment so it can be synced to Street View rotation. "
    "0=North, 90=East, 180=South, 270=West. Point toward the relevant feature. "
    "Return ONLY valid JSON. No markdown, no code fences, no explanation. "
    "All values must be valid JSON: write real numbers not 'number', true/false not 'boolean'."
)

STREET_NARRATE_SCHEMA = """{
  "tour_id": "<tour_id>",
  "model": "gemini-2.5-flash",
  "narration": "2-3 sentence arrival description of the property and its immediate surroundings",
  "route_to_door": "how to approach and enter the property",
  "parking": "nearby parking options",
  "neighborhood_vibe": "character and feel of the neighborhood",
  "safety_grade": "A",
  "commute_notes": "walkability and transit access summary",
  "what_to_inspect": ["key thing to check in person"],
  "disclaimer": "AI-generated tour. Informational only. Not a verified source."
}"""


class StreetNarrateRequest(BaseModel):
    tour_id: str
    address: str
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    lat: float | None = None
    lon: float | None = None
    listing_facts: dict[str, Any] = {}
    tour_type: str = "property_arrival"


@tour_router.post("/street-narrate")
async def street_narrate(
    body: StreetNarrateRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if x_api_key != settings.dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    coords = f"Coordinates: {body.lat}, {body.lon}. " if body.lat and body.lon else ""
    facts = "; ".join(f"{k}: {v}" for k, v in list(body.listing_facts.items())[:15])
    listing_block = f"Listing claims: {facts}. " if facts else ""

    user_message = (
        f"Generate an arrival tour script for: {body.address}. "
        f"Tour ID: {body.tour_id}. "
        f"Tour type: {body.tour_type}. "
        f"{coords}{listing_block}"
        f"Generated at: {datetime.now(timezone.utc).isoformat()}. "
        f"\n\nSchema to fill:\n{STREET_NARRATE_SCHEMA}"
    )

    try:
        raw = (await _call_gemini(STREET_NARRATE_SYSTEM, user_message)).strip()
    except Exception as exc:
        logger.error("street_narrate_gemma_error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Inference error: {exc}") from exc
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("street_narrate_json_error raw=%s", raw[:300], exc_info=True)
        data = {
            "tour_id": body.tour_id,
            "address": body.address,
            "model": "gemini-2.5-flash",
            "narration": raw,
        }

    logger.info("street_narrate_generated tour_id=%s address=%s", body.tour_id, body.address)
    return data


# ─── Image-Analyze: Gemini Vision property photo analysis ────────────────────

@tour_router.post("/image-analyze")
async def image_analyze(
    tour_id: str = Form(...),
    listing_facts: str = Form(default="{}"),
    images: list[UploadFile] = File(default=[]),
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if x_api_key != settings.dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not settings.google_ai_api_key:
        raise HTTPException(status_code=503, detail="Google AI not configured on this gateway.")

    if len(images) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 images allowed.")

    image_data: list[tuple[str, bytes]] = []
    for img in images:
        if img.size and img.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image {img.filename} exceeds 10MB limit.")
        content = await img.read()
        mime = img.content_type or "image/jpeg"
        image_data.append((mime, content))

    try:
        facts = json.loads(listing_facts)
    except json.JSONDecodeError:
        facts = {}

    try:
        result = await analyze_images(
            tour_id=tour_id,
            image_data=image_data,
            listing_facts=facts,
            api_key=settings.google_ai_api_key,
        )
    except Exception as exc:
        logger.error("image_analyze_error tour_id=%s: %s", tour_id, exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Image analysis failed: {exc}") from exc

    logger.info("image_analyzed tour_id=%s count=%d", tour_id, len(images))
    return result


# ─── Genie-Transform: Imagen3 / Genie creative property preview ──────────────

VALID_TRANSFORMS = {"staged", "renovated", "seasonal_spring", "seasonal_winter", "potential_max", "curb_appeal"}


class GenieTransformRequest(BaseModel):
    tour_id: str
    source_image_b64: str
    transform_type: str
    product: str = "stelarpeople"


@tour_router.post("/genie-transform")
async def genie_transform(
    body: GenieTransformRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if x_api_key != settings.dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not settings.google_ai_api_key:
        raise HTTPException(status_code=503, detail="Google AI not configured on this gateway.")

    if body.transform_type not in VALID_TRANSFORMS:
        raise HTTPException(status_code=400, detail=f"Invalid transform_type. Must be one of: {', '.join(sorted(VALID_TRANSFORMS))}")

    try:
        image_bytes = base64.b64decode(body.source_image_b64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.") from exc

    try:
        result = await generate_creative_transform(
            tour_id=body.tour_id,
            image_bytes=image_bytes,
            transform_type=body.transform_type,
            api_key=settings.google_ai_api_key,
        )
    except Exception as exc:
        logger.error("genie_transform_error tour_id=%s transform=%s: %s", body.tour_id, body.transform_type, exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Creative transform failed: {exc}") from exc

    logger.info("genie_transform_generated tour_id=%s transform=%s", body.tour_id, body.transform_type)
    return result


# ─── Vacay-Route: Gemma4 route narrative for StelarVacay ────────────────────

VACAY_ROUTE_SYSTEM = (
    "You are StelarVacay Route Agent — a travel guide AI. "
    "Generate a friendly, practical route narrative from a stay to a destination. "
    "Include: step-by-step directions, transit options, cost estimates, safety notes, local tips. "
    "Assign street_view_lat/lon and heading_deg to each step so they can be displayed in Google Maps Street View. "
    "Be warm and helpful — like a well-traveled local friend. "
    "Return ONLY valid JSON. No markdown, no code fences."
)

VACAY_ROUTE_SCHEMA = """{
  "tour_id": "<tour_id>",
  "model": "gemini-2.5-flash",
  "route_narrative": "2-3 sentence summary of the journey",
  "steps": [
    {
      "step": 1,
      "instruction": "step description",
      "mode": "walk",
      "street_view_lat": 40.7128,
      "street_view_lon": -74.006,
      "heading_deg": 90,
      "duration_min": 5,
      "distance_m": 400,
      "cost_usd": 0,
      "tip": "optional local tip"
    }
  ],
  "total_estimated_minutes": 20,
  "cost_estimate_usd": 5.0,
  "safety_notes": "general safety note",
  "local_tips": ["local tip"],
  "accessibility_notes": "wheelchair accessibility info or null",
  "disclaimer": "AI-generated route estimate. Verify with live maps before travel."
}"""


class VacayRouteRequest(BaseModel):
    tour_id: str
    from_address: str
    from_lat: float | None = None
    from_lon: float | None = None
    to_address: str
    to_lat: float | None = None
    to_lon: float | None = None
    transit_preference: str = "balanced"
    traveler_count: int = 1
    departure_time: str | None = None


@tour_router.post("/vacay-route")
async def vacay_route(
    body: VacayRouteRequest,
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> dict:
    settings = get_settings()
    if x_api_key != settings.dev_api_key_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    from_coords = f"({body.from_lat}, {body.from_lon})" if body.from_lat and body.from_lon else ""
    to_coords = f"({body.to_lat}, {body.to_lon})" if body.to_lat and body.to_lon else ""

    user_message = (
        f"Generate a route narrative from '{body.from_address}' {from_coords} "
        f"to '{body.to_address}' {to_coords}. "
        f"Transit preference: {body.transit_preference}. "
        f"Travelers: {body.traveler_count}. "
        f"Departure time: {body.departure_time or 'flexible'}. "
        f"Tour ID: {body.tour_id}. "
        f"\n\nSchema to fill:\n{VACAY_ROUTE_SCHEMA}"
    )

    try:
        raw = (await _call_gemini(VACAY_ROUTE_SYSTEM, user_message)).strip()
    except Exception as exc:
        logger.error("vacay_route_gemma_error: %s", exc, exc_info=True)
        raise HTTPException(status_code=502, detail=f"Inference error: {exc}") from exc
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("vacay_route_json_error raw=%s", raw[:300], exc_info=True)
        data = {
            "tour_id": body.tour_id,
            "neighborhood": body.neighborhood,
            "city": body.city,
            "state": body.state,
            "model": "gemini-2.5-flash",
            "route_narration": raw,
        }

    logger.info("vacay_route_generated tour_id=%s from=%s", body.tour_id, body.from_address)
    return data
