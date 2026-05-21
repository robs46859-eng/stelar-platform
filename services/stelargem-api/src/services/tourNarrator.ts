import { config } from '../config.js';
import { rootLogger } from '../lib/logger.js';
import { GenieWorldAdapter, buildGeniePrompt } from '../adapters/worldModel.js';
import type { TourNarrateRequest, TourResponse } from '../types/tour.js';
import type { Neighborhood, Corridor } from './graph.js';

const log = rootLogger.child({ service: 'tourNarrator' });
const genieAdapter = new GenieWorldAdapter();

interface GatewayTourPayload {
  tour_id: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number | null;
  lon: number | null;
  tour_type: string;
  scores: {
    walk_score: number | null;
    transit_score: number | null;
    bike_score: number | null;
    safety_index: number | null;
    median_rent: number | null;
    population: number | null;
  };
  corridors: { id: string; name: string; type: string | null }[];
  listing_facts: Record<string, unknown>;
}

export async function generateTour(
  req: TourNarrateRequest,
  neighborhood: Neighborhood,
  corridors: Corridor[]
): Promise<TourResponse> {
  const tourId = `tour_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const geniePrompt = buildGeniePrompt(
    neighborhood.name,
    neighborhood.city,
    neighborhood.region,
    ''
  );
  const [genieWorld] = await Promise.all([genieAdapter.generateWorld(geniePrompt)]);

  const payload: GatewayTourPayload = {
    tour_id: tourId,
    neighborhood: neighborhood.name,
    city: neighborhood.city,
    state: neighborhood.region,
    lat: neighborhood.lat,
    lon: neighborhood.lon,
    tour_type: req.tour_type,
    scores: {
      walk_score: (neighborhood.properties as any)?.walk_score ?? null,
      transit_score: (neighborhood.properties as any)?.transit_score ?? null,
      bike_score: (neighborhood.properties as any)?.bike_score ?? null,
      safety_index: (neighborhood.properties as any)?.safety_index ?? null,
      median_rent: (neighborhood.properties as any)?.median_rent ?? null,
      population: (neighborhood.properties as any)?.population ?? null,
    },
    corridors: corridors.map((c) => ({
      id: c.id,
      name: `${c.from_neighborhood_id} → ${c.to_neighborhood_id}`,
      type: c.mode,
    })),
    listing_facts: req.listing_facts ?? {},
  };

  log.info({ tour_id: tourId, neighborhood: neighborhood.name, tour_type: req.tour_type }, 'requesting tour narration');

  const res = await fetch(`${config.gatewayUrl}/v1/tour/narrate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.internalApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gateway tour narration failed: ${res.status} ${text}`);
  }

  const tourData = (await res.json()) as TourResponse;

  // Merge Genie world data that was generated locally (avoids a second round-trip)
  tourData.genie_world = genieWorld;

  return tourData;
}
