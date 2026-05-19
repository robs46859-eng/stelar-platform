export type InternationalVisitorHints = {
  visa: string;
  health: string;
  advisor: string;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  vibe: string;
  hero: string;
  imageUrl: string;
  summary: string;
  bestMonths: string[];
  avoidMonths: string[];
  monsoonSensitive: boolean;
  internationalVisitor: InternationalVisitorHints;
  averageNightlyStay: number;
  averageMealBudget: number;
  localTransitDaily: number;
  tags: string[];
  highlights: string[];
};

export type PlannerRequest = {
  origin: string;
  destinationId: string;
  travelDate: string;
  travelers: number;
  nights: number;
  budgetProfile: "lean" | "smart" | "comfort";
  transportPreference: "cheapest" | "balanced" | "fastest";
  stayType: "hostel" | "homestay" | "boutique";
};

export type QuoteLineSource = "modeled" | "live_sample";

export type QuoteBreakdown = {
  label: string;
  amount: number;
  notes: string;
  /** May be missing on old saved plans */
  source?: QuoteLineSource;
};

export type PricingTransparency = {
  badge: "planning_estimate" | "sample_fares_mixed" | "sample_fares_both";
  shortTitle: string;
  bullets: string[];
};

export type PlannerQuote = {
  destination: Destination;
  request: PlannerRequest;
  travelMode: string;
  rationale: string[];
  breakdown: QuoteBreakdown[];
  total: number;
  dailyAverage: number;
  scorecard: {
    value: string;
    comfort: string;
    complexity: string;
  };
  isLiveData?: boolean;
  /** Present on new quotes; old saved plans may omit. */
  transparency?: PricingTransparency;
  /** May be absent on very old saved plans. */
  seasonal?: {
    monthName: string;
    shortLabel: string;
    lines: string[];
  };
};

export type PlannerResponse = {
  quote: PlannerQuote;
  advice: string;
  savedPlan: SavedTripPlan;
};

export type SavedTripPlan = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  request: PlannerRequest;
  quote: PlannerQuote;
  advice: string;
};
