export type TourType = 'neighborhood_walk' | 'property_arrival' | 'vacay_preview' | 'corridor_exploration';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Availability = 'abundant' | 'moderate' | 'scarce';
export type Condition = 'excellent' | 'good' | 'fair' | 'poor';
export type Density = 'very_high' | 'high' | 'moderate' | 'low' | 'sparse';
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export interface TourNarrateRequest {
  neighborhood_id: string;
  tour_type: TourType;
  listing_facts?: Record<string, unknown>;
}

export interface TourMeta {
  tour_id: string;
  neighborhood: string;
  city: string;
  state: string;
  tour_type: TourType;
  generated_at: string;
  model: string;
  confidence_score: number;
  disclaimer: string;
}

export interface TimeOfDayNotes {
  morning: string;
  midday: string;
  evening: string;
  late_night: string;
}

export interface SeasonalityNotes {
  spring: string;
  summer: string;
  fall: string;
  winter: string;
}

export interface TourArrival {
  primary_approach: string;
  approach_vectors: { from_north: string; from_south: string; from_east: string; from_west: string };
  first_impression: string;
  gateway_landmarks: string[];
  boundary_markers: string[];
  arrival_vibe: string;
  time_of_day_notes: TimeOfDayNotes;
  seasonality: SeasonalityNotes;
}

export interface TransitStop {
  name: string;
  type: 'bus' | 'subway' | 'light_rail' | 'commuter_rail' | 'ferry';
  lines: string[];
  distance_ft: number;
  walk_minutes: number;
  frequency_peak_min: number | null;
  frequency_off_peak_min: number | null;
  accessibility: boolean;
}

export interface ParkingZone {
  zone_type: 'street_free' | 'street_metered' | 'permit' | 'garage' | 'lot';
  name: string | null;
  distance_ft: number;
  hourly_rate: number | null;
  max_hours: number | null;
  permit_required: boolean;
  availability: Availability;
}

export interface TourNavigation {
  walk_to_core: string;
  main_pedestrian_routes: string[];
  transit_stops: TransitStop[];
  parking: ParkingZone[];
  bike_infrastructure: {
    has_protected_lanes: boolean;
    has_shared_lanes: boolean;
    has_trail_access: boolean;
    bike_share_docks: { name: string; distance_ft: number }[];
    notes: string;
  };
  accessibility: {
    wheelchair_accessible: boolean;
    curb_cut_quality: Condition | 'unknown';
    elevator_access: boolean;
    notes: string;
  };
  ride_share: {
    pickup_zones: string[];
    typical_wait_minutes: number | null;
    surge_likelihood: 'low' | 'medium' | 'high';
  };
  navigation_landmarks: string[];
  distances_to_key_hubs: {
    downtown_mi: number | null;
    airport_mi: number | null;
    nearest_highway_mi: number | null;
    nearest_park_mi: number | null;
  };
}

export interface SafetyMetric {
  score: number;
  grade: Grade;
  notes: string;
}

export interface EmergencyService {
  name: string;
  type: 'police' | 'fire' | 'hospital' | 'urgent_care' | 'trauma_center';
  distance_ft: number;
  drive_minutes: number;
  walk_minutes: number | null;
}

export interface TourSafety {
  overall_score: number;
  overall_grade: Grade;
  day_safety: SafetyMetric;
  night_safety: SafetyMetric;
  crime_profile: {
    property_crime: SafetyMetric;
    violent_crime: SafetyMetric;
    trend: 'improving' | 'stable' | 'worsening' | 'unknown';
    context: string;
    comparison_to_city_avg: string;
  };
  environmental_safety: {
    flood_zone: boolean;
    flood_zone_type: string | null;
    fire_risk: 'low' | 'moderate' | 'high' | 'unknown';
    air_quality_index: number | null;
    noise_pollution: 'low' | 'moderate' | 'high';
    toxic_sites_nearby: boolean;
    notes: string;
  };
  lighting_quality: Condition;
  foot_traffic_density: Density;
  neighborhood_watch: boolean;
  gated_access: boolean;
  emergency_services: EmergencyService[];
  perceived_safety_notes: string;
  women_safety_notes: string;
  child_safety_notes: string;
}

export interface TourPhysicalEnvironment {
  street_grid_type: 'grid' | 'organic' | 'radial' | 'cul_de_sac' | 'mixed';
  topography: 'flat' | 'gentle_hills' | 'steep_hills' | 'steps_required';
  sidewalk_quality: {
    continuity: 'complete' | 'mostly_complete' | 'gaps' | 'minimal';
    condition: Condition;
    width: 'wide' | 'standard' | 'narrow' | 'varies';
  };
  road_condition: Condition;
  tree_canopy: 'dense' | 'moderate' | 'sparse' | 'minimal';
  green_space: {
    parks: { name: string; distance_ft: number; features: string[]; dog_friendly: boolean }[];
    pocket_parks: number;
    community_gardens: { name: string; distance_ft: number }[];
    trails: { name: string; distance_ft: number; length_mi: number | null }[];
    waterfront: boolean;
    waterfront_notes: string | null;
  };
  water_features: string[];
  noise_profile: {
    primary_sources: string[];
    decibel_estimate: 'quiet' | 'moderate' | 'loud' | 'very_loud';
    peak_hours: string;
    quiet_hours: string;
  };
  air_quality: string;
  weather_exposure: {
    wind_corridor: boolean;
    flood_prone: boolean;
    shade_coverage: Condition;
    solar_exposure: 'high' | 'moderate' | 'low';
  };
  street_lighting: Condition;
  public_seating: 'abundant' | 'some' | 'minimal' | 'none';
  public_art: string[];
}

export interface TourArchitecture {
  dominant_style: string;
  era: string;
  building_heights: 'low_rise' | 'mid_rise' | 'high_rise' | 'mixed';
  facade_condition: Condition;
  notable_buildings: { name: string; description: string }[];
  historic_designation: boolean;
  historic_notes: string | null;
  new_construction_signals: string[];
  renovation_activity: 'active' | 'moderate' | 'minimal';
  street_art_murals: { description: string; location: string }[];
  signage_quality: Condition;
  vacancy_signals: string[];
  architectural_character: string;
}

export interface NearbyPlace {
  name: string;
  distance_ft: number;
  walk_minutes: number;
  notable: string | null;
}

export interface NearbyRestaurant extends NearbyPlace {
  cuisine: string;
  price_range: PriceRange;
}

export interface NearbySchool extends NearbyPlace {
  type: 'public' | 'private' | 'charter' | 'magnet';
  grades: string;
  rating: number | null;
}

export interface NearbySportsCourt extends NearbyPlace {
  court_type: string;
  public: boolean;
}

export interface NearbyReligiousInstitution {
  denomination: string;
  name: string;
  distance_ft: number;
}

export interface TourAmenities {
  food_and_drink: {
    coffee_shops: NearbyPlace[];
    restaurants: NearbyRestaurant[];
    bars_and_nightlife: NearbyPlace[];
    fast_food: NearbyPlace[];
    food_halls: NearbyPlace[];
    food_trucks: string;
    late_night_options: string;
    delivery_coverage: Condition;
    grocery: NearbyPlace[];
    specialty_food: NearbyPlace[];
    farmers_market: { name: string; schedule: string; distance_ft: number } | null;
  };
  health_and_wellness: {
    primary_care: NearbyPlace[];
    urgent_care: NearbyPlace[];
    hospitals: NearbyPlace[];
    pharmacies: NearbyPlace[];
    mental_health_services: NearbyPlace[];
    gyms_fitness: NearbyPlace[];
    yoga_pilates: NearbyPlace[];
    spas_wellness: NearbyPlace[];
    dental: NearbyPlace[];
    vision: NearbyPlace[];
    specialty_care: NearbyPlace[];
  };
  education: {
    public_elementary: NearbySchool[];
    public_middle: NearbySchool[];
    public_high: NearbySchool[];
    private_schools: NearbySchool[];
    charter_schools: NearbySchool[];
    universities: NearbyPlace[];
    libraries: NearbyPlace[];
    tutoring_centers: NearbyPlace[];
    childcare_daycare: NearbyPlace[];
    after_school_programs: string;
  };
  retail_and_services: {
    shopping_centers: NearbyPlace[];
    boutique_retail: NearbyPlace[];
    banks_atms: NearbyPlace[];
    laundromats: NearbyPlace[];
    dry_cleaners: NearbyPlace[];
    hardware: NearbyPlace[];
    salons_barbers: NearbyPlace[];
    pet_services: NearbyPlace[];
    auto_services: NearbyPlace[];
    postal: NearbyPlace[];
    coworking_spaces: NearbyPlace[];
    print_copy: NearbyPlace[];
  };
  recreation_and_culture: {
    parks: { name: string; distance_ft: number; features: string[]; dog_friendly: boolean }[];
    playgrounds: NearbyPlace[];
    sports_courts: NearbySportsCourt[];
    public_pools: NearbyPlace[];
    community_centers: NearbyPlace[];
    museums_galleries: NearbyPlace[];
    theaters_venues: NearbyPlace[];
    cinemas: NearbyPlace[];
    religious_institutions: NearbyReligiousInstitution[];
    dog_parks: NearbyPlace[];
    bowling_entertainment: NearbyPlace[];
    escape_rooms_activities: NearbyPlace[];
  };
  outdoor_and_nature: {
    hiking_trails: NearbyPlace[];
    bike_trails: NearbyPlace[];
    water_access: string | null;
    nature_preserves: NearbyPlace[];
    botanical_gardens: NearbyPlace[];
  };
  nightlife: {
    bar_count_radius_half_mile: number | null;
    club_scene: 'active' | 'moderate' | 'minimal' | 'none';
    live_music_venues: NearbyPlace[];
    karaoke: NearbyPlace[];
    late_night_food: NearbyPlace[];
    noise_impact_on_residents: string;
  };
}

export interface TourRealEstate {
  median_rent_1br: number | null;
  median_rent_2br: number | null;
  median_rent_3br: number | null;
  median_home_value: number | null;
  price_per_sqft: number | null;
  rent_trend: 'rising_fast' | 'rising' | 'stable' | 'falling' | 'unknown';
  yoy_rent_change_pct: number | null;
  days_on_market_avg: number | null;
  inventory_level: 'very_tight' | 'tight' | 'balanced' | 'abundant';
  property_types: string[];
  renter_vs_owner_pct: { renters: number; owners: number } | null;
  recent_development: {
    new_construction_active: boolean;
    conversions_active: boolean;
    demolitions_active: boolean;
    notes: string;
  };
  zoning: {
    primary_zone: string;
    mixed_use_zones: boolean;
    upzoning_activity: boolean;
    notes: string;
  };
  gentrification_stage: 'stable' | 'early_signs' | 'transitioning' | 'advanced' | 'post_gentrification';
  investment_signals: string[];
  affordability_notes: string;
  utility_costs_notes: string;
}

export interface TourCommunity {
  population_estimate: number | null;
  population_density: 'very_dense' | 'dense' | 'moderate' | 'sparse';
  age_profile: 'young_professionals' | 'families' | 'seniors' | 'college' | 'mixed';
  notable_demographics: string;
  languages_commonly_spoken: string[];
  cultural_character: string;
  political_climate: string;
  community_engagement: 'high' | 'moderate' | 'low';
  notable_events: string[];
  neighborhood_associations: string[];
  social_scene: string;
  pet_friendliness: 'very_friendly' | 'friendly' | 'neutral' | 'restricted';
  child_friendliness: Condition;
  senior_friendliness: Condition;
  lgbtq_friendliness: string;
}

export interface TourMobility {
  walk_score: number;
  transit_score: number;
  bike_score: number;
  car_dependency: 'walker_paradise' | 'very_walkable' | 'walkable' | 'car_dependent' | 'driving_only';
  rush_hour_traffic: 'severe' | 'heavy' | 'moderate' | 'light';
  commute_to_downtown_minutes: {
    walk: number | null;
    drive: number | null;
    transit: number | null;
    bike: number | null;
  };
  road_connectivity: Condition;
  ev_charging_stations: NearbyPlace[];
  scooter_share: boolean;
  mobility_barriers: string[];
}

export interface TourCorridor {
  id: string;
  name: string;
  type: 'commercial' | 'mixed-use' | 'residential' | 'transit';
  key_businesses: string[];
  foot_traffic: 'very_high' | 'high' | 'moderate' | 'low';
  anchor_tenants: string[];
  vibe: string;
  vacancy_rate_pct: number | null;
}

export interface ChecklistItem {
  item: string;
  what_to_look_for: string;
  red_flags: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  applies_to: 'all' | 'renter' | 'buyer';
}

export interface InspectionCategory {
  category: string;
  icon: string;
  items: ChecklistItem[];
}

export interface FraudFlag {
  flag_type:
    | 'listing_photo_mismatch'
    | 'address_discrepancy'
    | 'amenity_misrepresentation'
    | 'pricing_anomaly'
    | 'description_inconsistency'
    | 'duplicate_listing'
    | 'synthetic_photo_indicator';
  claim: string;
  observation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface GenieWorldData {
  available: boolean;
  session_id: string | null;
  world_url: string | null;
  prompt_used: string | null;
  fallback_reason: string | null;
  suggested_exploration_prompts: string[];
  world_type: 'real_time_interactive' | 'static_preview' | 'unavailable';
}

export interface TourAtmosphere {
  tagline: string;
  morning_character: string;
  daytime_character: string;
  evening_character: string;
  late_night_character: string;
  weekend_vs_weekday: string;
  seasonal_highlights: { season: string; description: string }[];
  who_lives_here: string;
  who_visits_here: string;
  why_people_love_it: string[];
  common_complaints: string[];
  hidden_gems: string[];
  local_insider_tips: string[];
  what_to_know_before_moving_in: string[];
  is_ai_generated_label: string;
}

export interface TourResponse {
  meta: TourMeta;
  arrival: TourArrival;
  navigation: TourNavigation;
  safety: TourSafety;
  physical_environment: TourPhysicalEnvironment;
  architecture: TourArchitecture;
  amenities: TourAmenities;
  real_estate: TourRealEstate;
  community: TourCommunity;
  mobility: TourMobility;
  corridors: TourCorridor[];
  inspection_checklist: InspectionCategory[];
  fraud_flags: FraudFlag[];
  genie_world: GenieWorldData;
  atmosphere: TourAtmosphere;
}
