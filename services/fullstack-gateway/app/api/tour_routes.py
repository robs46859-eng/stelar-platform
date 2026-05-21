import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.pipeline import build_pipeline
from app.schemas.inference import InferenceRequest, Message

logger = logging.getLogger(__name__)
tour_router = APIRouter(prefix="/v1/tour")
_pipeline = build_pipeline()

SCHEMA_DESCRIPTION = """
Return ONLY a valid JSON object — no prose, no markdown fences, no extra text.
Populate every field. Use null for unknown numbers, empty arrays [] for unknown lists.
Use your training knowledge about the neighborhood to fill fields you aren't given data for.

Schema (fill every key):
{
  "meta": {
    "tour_id": "<provided>",
    "neighborhood": "string",
    "city": "string",
    "state": "string",
    "tour_type": "string",
    "generated_at": "ISO8601",
    "model": "gemma4:26b",
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

    inference_req = InferenceRequest(
        model="gemma4:26b",
        messages=[
            Message(role="system", content=SYSTEM_PROMPT),
            Message(role="user", content=user_message),
        ],
        temperature=0.2,
        max_tokens=8000,
    )

    try:
        result = await _pipeline.execute(
            payload=inference_req,
            presented_api_key=x_api_key,
            idempotency_key=str(uuid.uuid4()),
            client_host=None,
        )
    except (PermissionError, RuntimeError) as exc:
        logger.error("tour_pipeline_error", exc_info=exc)
        raise HTTPException(status_code=502, detail=f"Inference pipeline error: {exc}") from exc

    raw = result.output_text.strip()

    # Strip any accidental markdown fences Gemma may add
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0].strip()

    try:
        tour_data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error(
            "tour_json_parse_error",
            raw_preview=raw[:500],
            exc_info=exc,
        )
        raise HTTPException(status_code=502, detail="Tour agent returned malformed JSON.") from exc

    logger.info(
        "tour_generated",
        tour_id=body.tour_id,
        neighborhood=body.neighborhood,
        tour_type=body.tour_type,
    )
    return tour_data
