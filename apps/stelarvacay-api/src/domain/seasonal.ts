import type { DestinationRecord } from "../data/destinations.ts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Broad Indian monsoon months for coastal / W. Ghats; hills differ—use per-destination `monsoonSensitive`. */
const TYPICAL_MONSOON = new Set(["June", "July", "August", "September"]);

export type SeasonalContext = {
  monthName: string;
  /** Multiplier applied to contingency (only) to reflect weather/demand seasonality, typically 0.95–1.1 */
  contingencyMultiplier: number;
  shortLabel: string;
  /** Extra honesty lines for the quote */
  lines: string[];
};

export function getSeasonalContext(travelDateIso: string, destination: DestinationRecord): SeasonalContext {
  const d = new Date(travelDateIso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) {
    return {
      monthName: "Unknown",
      contingencyMultiplier: 1,
      shortLabel: "Season not evaluated",
      lines: [],
    };
  }
  const monthName = MONTH_NAMES[d.getUTCMonth()] ?? "Unknown";
  const inBest = destination.bestMonths.includes(monthName);
  const inAvoid = destination.avoidMonths.length > 0 && destination.avoidMonths.includes(monthName);
  const monsoonHere = destination.monsoonSensitive && TYPICAL_MONSOON.has(monthName);

  let contingencyMultiplier = 1;
  const lines: string[] = [];

  if (inBest) {
    contingencyMultiplier *= 0.97;
    lines.push(
      `Travel month (${monthName}) is usually a strong value window for ${destination.name} in our model—contingency is slightly leaner.`,
    );
  } else if (inAvoid) {
    contingencyMultiplier *= 1.06;
    lines.push(
      `${monthName} is often a pricier or trickier window for ${destination.name}, so the plan adds a small buffer in contingency.`,
    );
  } else {
    lines.push(
      `${monthName} is treated as a normal shoulder window; fares can still move with holidays and long weekends not modeled here.`,
    );
  }

  if (monsoonHere) {
    contingencyMultiplier *= 1.04;
    lines.push(
      "Monsoon season can mean more transport disruption and rebooking—contingency is nudged up (not a weather guarantee).",
    );
  }

  return {
    monthName,
    contingencyMultiplier: Math.min(1.12, Math.max(0.92, contingencyMultiplier)),
    shortLabel: inBest ? "In typical value season" : inAvoid ? "Peak/avoid window" : monsoonHere ? "Monsoon consideration" : "Shoulder / mixed",
    lines,
  };
}
