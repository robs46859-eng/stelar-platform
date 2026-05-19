CREATE SCHEMA IF NOT EXISTS stelarvacay;

-- Users Table
CREATE TABLE stelarvacay.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    loyalty_score INTEGER DEFAULT 0
);

-- Destinations Table
CREATE TABLE stelarvacay.destinations (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    country VARCHAR(255) DEFAULT 'India',
    base_cost_index DECIMAL(3, 2) DEFAULT 1.0,
    description TEXT,
    avg_hotel_price DECIMAL(10, 2),
    image_url TEXT,
    travel_profile VARCHAR(50),
    zone VARCHAR(50),
    nearest_rail_hub VARCHAR(255),
    nearest_airport VARCHAR(255),
    best_months TEXT[],
    avoid_months TEXT[],
    budget_highlights TEXT[],
    local_transport_note TEXT,
    sample_budget_per_day DECIMAL(10, 2),
    sample_mid_budget_per_day DECIMAL(10, 2),
    tags TEXT[],
    planning_score DECIMAL(3, 2) DEFAULT 4.4
);

-- Trips Table
CREATE TABLE stelarvacay.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES stelarvacay.users(id),
    origin VARCHAR(255) NOT NULL,
    destination_id UUID REFERENCES stelarvacay.destinations(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    traveler_count INTEGER DEFAULT 1,
    budget_level VARCHAR(50) DEFAULT 'budget',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE stelarvacay.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES stelarvacay.trips(id),
    type VARCHAR(50) NOT NULL, -- 'bus', 'taxi'
    duration INTEGER, -- in minutes
    estimated_cost DECIMAL(10, 2),
    provider VARCHAR(255),
    metadata JSONB
);

-- Hotels Table
CREATE TABLE stelarvacay.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES stelarvacay.destinations(id),
    name VARCHAR(255) NOT NULL,
    price_per_night DECIMAL(10, 2),
    rating DECIMAL(3, 2),
    metadata JSONB
);

-- Stops Table
CREATE TABLE stelarvacay.stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES stelarvacay.routes(id),
    name VARCHAR(255) NOT NULL,
    cost_impact DECIMAL(10, 2) DEFAULT 0,
    duration_impact INTEGER DEFAULT 0
);

-- Budgets Table
CREATE TABLE stelarvacay.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES stelarvacay.trips(id),
    transport_cost DECIMAL(10, 2) DEFAULT 0,
    hotel_cost DECIMAL(10, 2) DEFAULT 0,
    food_estimate DECIMAL(10, 2) DEFAULT 0,
    activities_cost DECIMAL(10, 2) DEFAULT 0,
    misc_cost DECIMAL(10, 2) DEFAULT 0,
    buffer DECIMAL(10, 2) DEFAULT 0,
    total_cost DECIMAL(10, 2) DEFAULT 0
);

-- Ratings Table
CREATE TABLE stelarvacay.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES stelarvacay.trips(id),
    cost_score INTEGER,
    safety_score INTEGER,
    comfort_score INTEGER,
    time_score INTEGER,
    reliability_score INTEGER
);

-- Deals Table
CREATE TABLE stelarvacay.deals (
    id TEXT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    code VARCHAR(100) NOT NULL,
    discount_type VARCHAR(50), -- 'percentage', 'fixed'
    value DECIMAL(10, 2),
    eligibility_rule TEXT,
    expires_at TEXT
);

-- Trip Plans Table (for saved planner quotes)
CREATE TABLE stelarvacay.trip_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    request JSONB NOT NULL,
    quote JSONB NOT NULL,
    advice TEXT NOT NULL
);
