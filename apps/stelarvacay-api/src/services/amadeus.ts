// TODO: Amadeus API calls are routed through the fullstack-gateway per SPEC §3.1.6.
// The gateway acts as the single egress point for all external provider calls.
// Direct Amadeus SDK usage is replaced by forwarded requests to the gateway's
// /v1/travel/flights and /v1/travel/hotels endpoints, which proxy to Amadeus
// using server-side credentials held by the gateway.

import { config } from "../config.ts";

export async function getFlightPrice(origin: string, destination: string, date: string, adults: number): Promise<number | null> {
  if (!config.gatewayUrl) return null;

  try {
    const res = await fetch(`${config.gatewayUrl}/v1/travel/flights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.gatewayApiKey}`,
      },
      body: JSON.stringify({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: date,
        adults,
        max: 5,
        currencyCode: "INR",
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { price?: number | null };
    return data.price != null ? Math.round(data.price) : null;
  } catch (error) {
    console.error("Gateway flight search error:", error);
    return null;
  }
}

export async function getHotelPrice(cityCode: string, adults: number): Promise<number | null> {
  if (!config.gatewayUrl) return null;

  try {
    const res = await fetch(`${config.gatewayUrl}/v1/travel/hotels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.gatewayApiKey}`,
      },
      body: JSON.stringify({
        cityCode,
        adults,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { pricePerNight?: number | null };
    return data.pricePerNight != null ? Math.round(data.pricePerNight) : null;
  } catch (error) {
    console.error("Gateway hotel search error:", error);
    return null;
  }
}
