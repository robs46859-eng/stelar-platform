import { destinations, type DestinationRecord } from "../data/destinations.ts";
import { getSeasonalContext } from "./seasonal.ts";

export type BudgetProfile = "lean" | "smart" | "comfort";
export type TransportPreference = "cheapest" | "balanced" | "fastest";
export type StayType = "hostel" | "homestay" | "boutique";

export type PlannerRequest = {
  origin: string;
  destinationId: string;
  travelDate: string;
  travelers: number;
  nights: number;
  budgetProfile: BudgetProfile;
  transportPreference: TransportPreference;
  stayType: StayType;
};

export type QuoteLineSource = "modeled" | "live_sample";

export type QuoteBreakdown = {
  label: string;
  amount: number;
  notes: string;
  source: QuoteLineSource;
};

export type PricingTransparency = {
  /** High-level status for the quote header. */
  badge: "planning_estimate" | "sample_fares_mixed" | "sample_fares_both";
  shortTitle: string;
  /** Honesty bullets shown above the fold. */
  bullets: string[];
};

export type PlannerQuote = {
  destination: DestinationRecord;
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
  transparency: PricingTransparency;
  /** Calendar / climate nuance in the model (contingency band). */
  seasonal: {
    monthName: string;
    shortLabel: string;
    lines: string[];
  };
};

const budgetMultipliers: Record<BudgetProfile, number> = {
  lean: 0.84,
  smart: 1,
  comfort: 1.28,
};

const transportMultipliers: Record<TransportPreference, number> = {
  cheapest: 0.85,
  balanced: 1,
  fastest: 1.35,
};

const stayMultipliers: Record<StayType, number> = {
  hostel: 0.65,
  homestay: 0.9,
  boutique: 1.45,
};

function clampWholeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export function parsePlannerRequest(payload: unknown): PlannerRequest {
  const body = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
  const origin = String(body.origin ?? "DEL").trim().toUpperCase();
  const destinationId = String(body.destinationId ?? "").trim();
  const travelDate = String(body.travelDate ?? new Date().toISOString().split("T")[0]).trim();
  const budgetProfile = String(body.budgetProfile ?? "smart") as BudgetProfile;
  const transportPreference = String(body.transportPreference ?? "balanced") as TransportPreference;
  const stayType = String(body.stayType ?? "homestay") as StayType;
  const travelers = clampWholeNumber(body.travelers, 2, 1, 8);
  const nights = clampWholeNumber(body.nights, 3, 1, 21);

  if (!origin) {
    throw new Error("Origin is required.");
  }

  if (!destinationId) {
    throw new Error("Destination is required.");
  }

  if (!["lean", "smart", "comfort"].includes(budgetProfile)) {
    throw new Error("Budget profile is invalid.");
  }

  if (!["cheapest", "balanced", "fastest"].includes(transportPreference)) {
    throw new Error("Transport preference is invalid.");
  }

  if (!["hostel", "homestay", "boutique"].includes(stayType)) {
    throw new Error("Stay type is invalid.");
  }

  return {
    origin,
    destinationId,
    travelDate,
    travelers,
    nights,
    budgetProfile,
    transportPreference,
    stayType,
  };
}

export function listDestinations() {
  return destinations;
}

export type LiveDataValues = {
  flightPrice?: number | null;
  hotelPricePerNight?: number | null;
};

export function buildQuote(request: PlannerRequest, liveData: LiveDataValues = {}): PlannerQuote {
  const destination = destinations.find((entry) => entry.id === request.destinationId);
  if (!destination) {
    throw new Error("Destination not found.");
  }

  const budgetMultiplier = budgetMultipliers[request.budgetProfile];
  const transportMultiplier = transportMultipliers[request.transportPreference];
  const stayMultiplier = stayMultipliers[request.stayType];
  const roomCount = Math.max(1, Math.ceil(request.travelers / 2));

  // Use live data if available, else fall back to model
  const intercityBase = 1200 + destination.averageNightlyStay * 0.25;
  const modeledIntercity = Math.round(intercityBase * request.travelers * transportMultiplier);
  const intercityTravel = liveData.flightPrice
    ? liveData.flightPrice * request.travelers
    : modeledIntercity;

  const modeledStay = Math.round(destination.averageNightlyStay * roomCount * request.nights * budgetMultiplier * stayMultiplier);
  const stay = liveData.hotelPricePerNight
    ? Math.round(liveData.hotelPricePerNight * roomCount * request.nights)
    : modeledStay;

  const food = Math.round(destination.averageMealBudget * request.travelers * request.nights * budgetMultiplier);
  const local = Math.round(destination.localTransitDaily * request.nights * transportMultiplier);
  const activities = Math.round((destination.averageNightlyStay * 0.42) * request.nights * budgetMultiplier);
  const baseSubtotal = intercityTravel + stay + food + local + activities;
  const seasonal = getSeasonalContext(request.travelDate, destination);
  const baseContingency = baseSubtotal * 0.12;
  const contingency = Math.max(0, Math.round(baseContingency * seasonal.contingencyMultiplier));

  const total = baseSubtotal + contingency;

  const hasLiveFlight = Boolean(liveData.flightPrice);
  const hasLiveStay = Boolean(liveData.hotelPricePerNight);
  const isLiveData = hasLiveFlight || hasLiveStay; // local only — isLiveData field removed from PlannerQuote

  let badge: PricingTransparency["badge"] = "planning_estimate";
  if (hasLiveFlight && hasLiveStay) badge = "sample_fares_both";
  else if (hasLiveFlight || hasLiveStay) badge = "sample_fares_mixed";

  const transparency: PricingTransparency = {
    badge,
    shortTitle:
      badge === "planning_estimate"
        ? "Planning estimate (benchmarks only)"
        : badge === "sample_fares_both"
          ? "Sample live fares (flights + stay) mixed with estimates"
          : "Mix of sample fares and benchmarks",
    bullets: [
      "StelarVacay is not a travel agency. We do not sell tickets, rooms, or insurance.",
      "Totals are planning numbers to compare trips—not invoices, holds, or guaranteed prices.",
      hasLiveFlight
        ? "Intercity: uses a small sample of public flight offers (lowest in the set), not a chosen airline or seat."
        : "Intercity: uses modeled regional cost bands when no bookable offer is available.",
      hasLiveStay
        ? "Stay: uses a few hotel list prices as a sample; it is not a confirmed reservation."
        : "Stay: uses modeled nightly bands for your room count and style—actual hotels vary.",
      "Food, local travel, and activities are always modeled; refine with your own receipts over time.",
      `Season: ${seasonal.monthName} — ${seasonal.shortLabel}. Only the contingency line is nudged (not a weather or fare guarantee).`,
      ...seasonal.lines,
    ],
  };

  const travelMode = request.transportPreference === "fastest"
    ? "Flight first, local cab/rideshare support"
    : request.transportPreference === "cheapest"
      ? "Sleeper train or bus first, low-friction local transfers"
      : "Hybrid train/flight search with local transit backstop";

  return {
    destination,
    request,
    travelMode,
    transparency,
    rationale: [
      `${destination.name} fits a ${request.nights}-night trip using ${request.stayType} lodging.`,
      isLiveData
        ? "Some lines use a small sample of public fares; the rest are modeled in INR."
        : "Estimated costs from regional budget benchmarks in INR (no live hold).",
      `${request.budgetProfile === "lean" ? "Spend is constrained aggressively, so activities and stay quality are trimmed first." : "Budget leaves room for a cleaner stay and small experience buffer."}`,
    ],
    breakdown: [
      {
        label: "Intercity travel",
        amount: intercityTravel,
        notes: hasLiveFlight
          ? `Sample one-way style fare ≈ ${liveData.flightPrice} INR/person (not a hold). ${travelMode}`
          : `${travelMode}. Modeled, not a ticket price.`,
        source: hasLiveFlight ? "live_sample" : "modeled",
      },
      {
        label: "Stay",
        amount: stay,
        notes: hasLiveStay
          ? `Sample nightly rate from a few listed hotels: ≈ ${liveData.hotelPricePerNight} INR/night for ${roomCount} room(s) (not a booking).`
          : `${roomCount} room${roomCount > 1 ? "s" : ""} in a ${request.stayType}. Modeled band.`,
        source: hasLiveStay ? "live_sample" : "modeled",
      },
      { label: "Food", amount: food, notes: "Daily meal band from destination benchmarks (modeled).", source: "modeled" },
      { label: "Local movement", amount: local, notes: "Airport/station and in-city transfer band (modeled).", source: "modeled" },
      { label: "Activities", amount: activities, notes: "Modest activities buffer—not tours sold here.", source: "modeled" },
      {
        label: "Contingency",
        amount: contingency,
        notes: `~12% of subtotal, adjusted for ${seasonal.monthName} (${seasonal.shortLabel}); not a fee—planning buffer only.`,
        source: "modeled",
      },
    ],
    total,
    dailyAverage: Math.round(total / Math.max(1, request.nights)),
    seasonal: {
      monthName: seasonal.monthName,
      shortLabel: seasonal.shortLabel,
      lines: seasonal.lines,
    },
    scorecard: {
      value: request.budgetProfile === "lean" ? "High if dates stay flexible" : "Balanced value",
      comfort: request.stayType === "boutique" ? "Elevated boutique comfort" : request.budgetProfile === "comfort" ? "Above baseline comfort" : "Efficient, not indulgent",
      complexity: request.transportPreference === "cheapest" ? "Moderate" : "Low to moderate",
    },
  };
}
