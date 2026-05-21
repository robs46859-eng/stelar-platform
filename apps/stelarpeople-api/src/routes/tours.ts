import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';

export const tourRouter = express.Router();

interface TourSession {
  id: string;
  propertyId: string;
  address: string;
  lat: number | null;
  lon: number | null;
  listing_facts: Record<string, unknown>;
  created_at: string;
}

// In-memory session store — replace with Redis/DB in production
const sessions = new Map<string, TourSession>();

/** POST /api/properties/:id/tour/session — create a tour session */
tourRouter.post('/properties/:id/tour/session', async (req, res) => {
  const { id } = req.params;
  const { address, lat, lon, listing_facts = {} } = req.body as {
    address?: string;
    lat?: number;
    lon?: number;
    listing_facts?: Record<string, unknown>;
  };

  if (!address) {
    res.status(400).json({ error: 'address is required' });
    return;
  }

  const sessionId = crypto.randomUUID();
  const session: TourSession = {
    id: sessionId,
    propertyId: id,
    address,
    lat: lat ?? null,
    lon: lon ?? null,
    listing_facts,
    created_at: new Date().toISOString(),
  };
  sessions.set(sessionId, session);

  try {
    const narration = await requestStreetNarration(sessionId, session);
    res.json({ session_id: sessionId, narration });
  } catch (err) {
    // Return session even if narration fails — frontend can retry
    res.json({ session_id: sessionId, narration: null, error: String(err) });
  }
});

/** POST /api/tour/image-upload — forward images to gateway for Gemini analysis */
tourRouter.post('/tour/image-upload', async (req, res) => {
  const { tour_id, listing_facts, images } = req.body as {
    tour_id?: string;
    listing_facts?: Record<string, unknown>;
    images?: Array<{ mime: string; data: string }>;
  };

  if (!tour_id || !images?.length) {
    res.status(400).json({ error: 'tour_id and images[] are required' });
    return;
  }

  try {
    const result = await forwardImageAnalysis(tour_id, listing_facts ?? {}, images);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `Image analysis failed: ${String(err)}` });
  }
});

/** POST /api/tour/genie-transform — request a creative property transformation */
tourRouter.post('/tour/genie-transform', async (req, res) => {
  const { tour_id, source_image_b64, transform_type } = req.body as {
    tour_id?: string;
    source_image_b64?: string;
    transform_type?: string;
  };

  if (!tour_id || !source_image_b64 || !transform_type) {
    res.status(400).json({ error: 'tour_id, source_image_b64, and transform_type are required' });
    return;
  }

  try {
    const result = await requestGenieTransform(tour_id, source_image_b64, transform_type);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `Transform failed: ${String(err)}` });
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
    throw new Error(`Gateway ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}

async function requestStreetNarration(sessionId: string, session: TourSession): Promise<unknown> {
  return gatewayPost('/v1/tour/street-narrate', {
    tour_id: sessionId,
    address: session.address,
    lat: session.lat,
    lon: session.lon,
    listing_facts: session.listing_facts,
    tour_type: 'property_arrival',
  });
}

async function forwardImageAnalysis(
  tourId: string,
  listingFacts: Record<string, unknown>,
  images: Array<{ mime: string; data: string }>,
): Promise<unknown> {
  // Build multipart form manually — gateway expects multipart/form-data
  const formData = new FormData();
  formData.append('tour_id', tourId);
  formData.append('listing_facts', JSON.stringify(listingFacts));

  for (const img of images.slice(0, 6)) {
    const bytes = Buffer.from(img.data, 'base64');
    const blob = new Blob([bytes], { type: img.mime });
    formData.append('images', blob, `image.${img.mime.split('/')[1] || 'jpg'}`);
  }

  const res = await fetch(`${config.gatewayUrl}/v1/tour/image-analyze`, {
    method: 'POST',
    headers: { 'X-API-Key': config.gatewayApiKey },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway image-analyze returned ${res.status}: ${text}`);
  }
  return res.json();
}

async function requestGenieTransform(tourId: string, imageB64: string, transformType: string): Promise<unknown> {
  return gatewayPost('/v1/tour/genie-transform', {
    tour_id: tourId,
    source_image_b64: imageB64,
    transform_type: transformType,
    product: 'stelarpeople',
  });
}
