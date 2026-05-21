export type TourType = 'neighborhood_walk' | 'property_arrival' | 'vacay_preview' | 'corridor_exploration';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Condition = 'excellent' | 'good' | 'fair' | 'poor';

export interface NearbyPlace {
  name: string;
  distance_ft: number;
  walk_minutes: number;
  notable: string | null;
}

export interface NearbyRestaurant extends NearbyPlace {
  cuisine: string;
  price_range: '$' | '$$' | '$$$' | '$$$$';
}

export interface NearbySchool extends NearbyPlace {
  type: 'public' | 'private' | 'charter' | 'magnet';
  grades: string;
  rating: number | null;
}

export interface TransitStop {
  name: string;
  type: string;
  lines: string[];
  distance_ft: number;
  walk_minutes: number;
  frequency_peak_min: number | null;
  frequency_off_peak_min: number | null;
  accessibility: boolean;
}

export interface SafetyMetric {
  score: number;
  grade: Grade;
  notes: string;
}

export interface EmergencyService {
  name: string;
  type: string;
  distance_ft: number;
  drive_minutes: number;
  walk_minutes: number | null;
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
  flag_type: string;
  claim: string;
  observation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface TourResponse {
  meta: {
    tour_id: string;
    neighborhood: string;
    city: string;
    state: string;
    tour_type: TourType;
    generated_at: string;
    model: string;
    confidence_score: number;
    disclaimer: string;
  };
  arrival: {
    primary_approach: string;
    approach_vectors: Record<string, string>;
    first_impression: string;
    gateway_landmarks: string[];
    boundary_markers: string[];
    arrival_vibe: string;
    time_of_day_notes: Record<string, string>;
    seasonality: Record<string, string>;
  };
  navigation: {
    walk_to_core: string;
    main_pedestrian_routes: string[];
    transit_stops: TransitStop[];
    parking: {
      zone_type: string;
      name: string | null;
      distance_ft: number;
      hourly_rate: number | null;
      availability: string;
      permit_required: boolean;
    }[];
    bike_infrastructure: {
      has_protected_lanes: boolean;
      has_shared_lanes: boolean;
      has_trail_access: boolean;
      bike_share_docks: { name: string; distance_ft: number }[];
      notes: string;
    };
    accessibility: {
      wheelchair_accessible: boolean;
      curb_cut_quality: string;
      elevator_access: boolean;
      notes: string;
    };
    ride_share: {
      pickup_zones: string[];
      typical_wait_minutes: number | null;
      surge_likelihood: string;
    };
    navigation_landmarks: string[];
    distances_to_key_hubs: Record<string, number | null>;
  };
  safety: {
    overall_score: number;
    overall_grade: Grade;
    day_safety: SafetyMetric;
    night_safety: SafetyMetric;
    crime_profile: {
      property_crime: SafetyMetric;
      violent_crime: SafetyMetric;
      trend: string;
      context: string;
      comparison_to_city_avg: string;
    };
    environmental_safety: {
      flood_zone: boolean;
      fire_risk: string;
      air_quality_index: number | null;
      noise_pollution: string;
      toxic_sites_nearby: boolean;
      notes: string;
    };
    lighting_quality: string;
    foot_traffic_density: string;
    neighborhood_watch: boolean;
    emergency_services: EmergencyService[];
    perceived_safety_notes: string;
    women_safety_notes: string;
    child_safety_notes: string;
  };
  physical_environment: {
    street_grid_type: string;
    topography: string;
    sidewalk_quality: { continuity: string; condition: string; width: string };
    road_condition: string;
    tree_canopy: string;
    green_space: {
      parks: { name: string; distance_ft: number; features: string[]; dog_friendly: boolean }[];
      pocket_parks: number;
      community_gardens: { name: string; distance_ft: number }[];
      trails: { name: string; distance_ft: number; length_mi: number | null }[];
      waterfront: boolean;
      waterfront_notes: string | null;
    };
    water_features: string[];
    noise_profile: { primary_sources: string[]; decibel_estimate: string; peak_hours: string; quiet_hours: string };
    air_quality: string;
    street_lighting: string;
    public_seating: string;
    public_art: string[];
  };
  architecture: {
    dominant_style: string;
    era: string;
    building_heights: string;
    facade_condition: string;
    notable_buildings: { name: string; description: string }[];
    historic_designation: boolean;
    historic_notes: string | null;
    new_construction_signals: string[];
    renovation_activity: string;
    street_art_murals: { description: string; location: string }[];
    signage_quality: string;
    vacancy_signals: string[];
    architectural_character: string;
  };
  amenities: {
    food_and_drink: {
      coffee_shops: NearbyPlace[];
      restaurants: NearbyRestaurant[];
      bars_and_nightlife: NearbyPlace[];
      fast_food: NearbyPlace[];
      food_halls: NearbyPlace[];
      food_trucks: string;
      late_night_options: string;
      delivery_coverage: string;
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
      sports_courts: (NearbyPlace & { court_type: string; public: boolean })[];
      public_pools: NearbyPlace[];
      community_centers: NearbyPlace[];
      museums_galleries: NearbyPlace[];
      theaters_venues: NearbyPlace[];
      cinemas: NearbyPlace[];
      religious_institutions: { denomination: string; name: string; distance_ft: number }[];
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
      club_scene: string;
      live_music_venues: NearbyPlace[];
      karaoke: NearbyPlace[];
      late_night_food: NearbyPlace[];
      noise_impact_on_residents: string;
    };
  };
  real_estate: {
    median_rent_1br: number | null;
    median_rent_2br: number | null;
    median_rent_3br: number | null;
    median_home_value: number | null;
    price_per_sqft: number | null;
    rent_trend: string;
    yoy_rent_change_pct: number | null;
    days_on_market_avg: number | null;
    inventory_level: string;
    property_types: string[];
    renter_vs_owner_pct: { renters: number; owners: number } | null;
    recent_development: { new_construction_active: boolean; conversions_active: boolean; demolitions_active: boolean; notes: string };
    zoning: { primary_zone: string; mixed_use_zones: boolean; upzoning_activity: boolean; notes: string };
    gentrification_stage: string;
    investment_signals: string[];
    affordability_notes: string;
    utility_costs_notes: string;
  };
  community: {
    population_estimate: number | null;
    population_density: string;
    age_profile: string;
    notable_demographics: string;
    languages_commonly_spoken: string[];
    cultural_character: string;
    political_climate: string;
    community_engagement: string;
    notable_events: string[];
    neighborhood_associations: string[];
    social_scene: string;
    pet_friendliness: string;
    child_friendliness: string;
    senior_friendliness: string;
    lgbtq_friendliness: string;
  };
  mobility: {
    walk_score: number;
    transit_score: number;
    bike_score: number;
    car_dependency: string;
    rush_hour_traffic: string;
    commute_to_downtown_minutes: Record<string, number | null>;
    road_connectivity: string;
    ev_charging_stations: NearbyPlace[];
    scooter_share: boolean;
    mobility_barriers: string[];
  };
  corridors: {
    id: string;
    name: string;
    type: string;
    key_businesses: string[];
    foot_traffic: string;
    anchor_tenants: string[];
    vibe: string;
    vacancy_rate_pct: number | null;
  }[];
  inspection_checklist: InspectionCategory[];
  fraud_flags: FraudFlag[];
  genie_world: {
    available: boolean;
    session_id: string | null;
    world_url: string | null;
    prompt_used: string | null;
    fallback_reason: string | null;
    suggested_exploration_prompts: string[];
    world_type: string;
  };
  atmosphere: {
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
  };
}
