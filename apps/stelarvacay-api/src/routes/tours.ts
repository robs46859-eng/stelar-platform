import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';

export const vacayTourRouter = express.Router();

interface VacayTourSession {
  id: string;
  stayId: string;
  stayAddress: string;
  destinationName: string;
  lat: number | null;
  lon: number | null;
  tourType: 'vacay_neighborhood_walk' | 'vacay_route_preview' | 'vacay_arrival_compare';
  created_at: string;
}

const sessions = new Map<string, VacayTourSession>();

/** POST /api/stays/tour-neighborhood — direct neighborhood tour without a stay ID */
vacayTourRouter.post('/stays/tour-neighborhood', async (req, res) => {
  const { neighborhood, city, state, lat, lon } = req.body as {
    neighborhood?: string;
    city?: string;
    state?: string;
    lat?: number;
    lon?: number;
  };

  if (!neighborhood) {
    res.status(400).json({ error: 'neighborhood is required' });
    return;
  }

  const tourId = crypto.randomUUID();

  try {
    const result = await requestGatewayTour(tourId, {
      neighborhood,
      city: city ?? '',
      state: state ?? '',
      lat,
      lon,
    });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `Neighborhood tour failed: ${String(err)}` });
  }
});

/** POST /api/stays/:id/tour/session — neighborhood walk for a stay */
vacayTourRouter.post('/stays/:id/tour/session', async (req, res) => {
  const { id } = req.params;
  const { stay_address, destination_name, lat, lon } = req.body as {
    stay_address?: string;
    destination_name?: string;
    lat?: number;
    lon?: number;
  };

  if (!stay_address) {
    res.status(400).json({ error: 'stay_address is required' });
    return;
  }

  const sessionId = crypto.randomUUID();
  const session: VacayTourSession = {
    id: sessionId,
    stayId: id,
    stayAddress: stay_address,
    destinationName: destination_name ?? '',
    lat: lat ?? null,
    lon: lon ?? null,
    tourType: 'vacay_neighborhood_walk',
    created_at: new Date().toISOString(),
  };
  sessions.set(sessionId, session);

  try {
    const narration = await requestNeighborhoodTour(sessionId, session);
    res.json({ session_id: sessionId, narration });
  } catch (err) {
    res.json({ session_id: sessionId, narration: null, error: String(err) });
  }
});

/** POST /api/tour/route-preview — route from stay to attraction */
vacayTourRouter.post('/tour/route-preview', async (req, res) => {
  const {
    from_address, from_lat, from_lon,
    to_address, to_lat, to_lon,
    transit_preference = 'balanced',
    traveler_count = 1,
    departure_time,
  } = req.body as {
    from_address?: string;
    from_lat?: number;
    from_lon?: number;
    to_address?: string;
    to_lat?: number;
    to_lon?: number;
    transit_preference?: string;
    traveler_count?: number;
    departure_time?: string;
  };

  if (!from_address || !to_address) {
    res.status(400).json({ error: 'from_address and to_address are required' });
    return;
  }

  const tourId = crypto.randomUUID();

  try {
    const result = await requestRoutePreview({
      tour_id: tourId,
      from_address,
      from_lat: from_lat ?? null,
      from_lon: from_lon ?? null,
      to_address,
      to_lat: to_lat ?? null,
      to_lon: to_lon ?? null,
      transit_preference,
      traveler_count,
      departure_time: departure_time ?? null,
    });
    res.json({ tour_id: tourId, ...result as object });
  } catch (err) {
    res.status(502).json({ error: `Route preview failed: ${String(err)}` });
  }
});

/** POST /api/tour/arrival-compare — compare two destinations side by side */
vacayTourRouter.post('/tour/arrival-compare', async (req, res) => {
  const { destination_a, destination_b } = req.body as {
    destination_a?: { neighborhood: string; city: string; state: string; lat?: number; lon?: number };
    destination_b?: { neighborhood: string; city: string; state: string; lat?: number; lon?: number };
  };

  if (!destination_a || !destination_b) {
    res.status(400).json({ error: 'destination_a and destination_b are required' });
    return;
  }

  const tourId = crypto.randomUUID();

  try {
    const [tourA, tourB] = await Promise.all([
      requestGatewayTour(tourId + '-a', destination_a),
      requestGatewayTour(tourId + '-b', destination_b),
    ]);
    res.json({ tour_id: tourId, destination_a: tourA, destination_b: tourB });
  } catch (err) {
    res.status(502).json({ error: `Arrival compare failed: ${String(err)}` });
  }
});

// ─── Gateway helpers ─────────────────────────────────────────────────────────

async function gatewayPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${config.gatewayUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.gatewayApiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

async function requestNeighborhoodTour(sessionId: string, session: VacayTourSession): Promise<unknown> {
  return gatewayPost('/v1/tour/narrate', {
    tour_id: sessionId,
    neighborhood: session.destinationName || session.stayAddress.split(',')[0],
    city: session.stayAddress.split(',')[1]?.trim() ?? '',
    state: session.stayAddress.split(',')[2]?.trim() ?? '',
    lat: session.lat,
    lon: session.lon,
    tour_type: 'vacay_preview',
    listing_facts: {},
  });
}

async function requestRoutePreview(params: {
  tour_id: string;
  from_address: string;
  from_lat: number | null;
  from_lon: number | null;
  to_address: string;
  to_lat: number | null;
  to_lon: number | null;
  transit_preference: string;
  traveler_count: number;
  departure_time: string | null;
}): Promise<unknown> {
  return gatewayPost('/v1/tour/vacay-route', params);
}

async function requestGatewayTour(
  tourId: string,
  dest: { neighborhood: string; city: string; state: string; lat?: number; lon?: number },
): Promise<unknown> {
  return gatewayPost('/v1/tour/narrate', {
    tour_id: tourId,
    neighborhood: dest.neighborhood,
    city: dest.city,
    state: dest.state,
    lat: dest.lat ?? null,
    lon: dest.lon ?? null,
    tour_type: 'vacay_preview',
    listing_facts: {},
  });
}
