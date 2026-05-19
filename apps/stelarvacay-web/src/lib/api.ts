import type { Destination, PlannerRequest, PlannerResponse, SavedTripPlan } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function authHeader(): Promise<Record<string, string>> {
  const token = localStorage.getItem('stelar_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error || "Request failed.");
  }
  return response.json() as Promise<T>;
}

export async function fetchDestinations() {
  const response = await fetch(`${BASE_URL}/destinations`);
  const payload = await parseJson<{ destinations: Destination[] }>(response);
  return payload.destinations;
}

export async function requestQuote(input: PlannerRequest) {
  const response = await fetch(`${BASE_URL}/planner/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify(input),
  });
  return parseJson<PlannerResponse>(response);
}

export async function fetchSavedPlans() {
  const response = await fetch(`${BASE_URL}/plans`, {
    headers: {
      ...(await authHeader()),
    },
  });
  return parseJson<{ plans: SavedTripPlan[] }>(response);
}
