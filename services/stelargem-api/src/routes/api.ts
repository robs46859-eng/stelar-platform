import { Router } from 'express';
import { requireJwtUser } from '../auth/bearer.js';
import { listNeighborhoods, getNeighborhood, listCorridors } from '../services/graph.js';
import { generateTour } from '../services/tourNarrator.js';
import type { TourNarrateRequest } from '../types/tour.js';

export function createApiRouter(): Router {
  const router = Router();

  router.get('/neighborhoods', requireJwtUser, async (_req, res) => {
    try {
      const neighborhoods = await listNeighborhoods();
      res.json({ neighborhoods });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: message });
    }
  });

  router.get('/neighborhoods/:id', requireJwtUser, async (req, res) => {
    try {
      const neighborhood = await getNeighborhood(req.params.id);
      if (!neighborhood) {
        res.status(404).json({ error: 'Neighborhood not found.' });
        return;
      }
      res.json({ neighborhood });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: message });
    }
  });

  router.get('/corridors', requireJwtUser, async (_req, res) => {
    try {
      const corridors = await listCorridors();
      res.json({ corridors });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(500).json({ error: message });
    }
  });

  router.post('/tour/narrate', requireJwtUser, async (req, res) => {
    const body = req.body as Partial<TourNarrateRequest>;
    if (!body.neighborhood_id || !body.tour_type) {
      res.status(400).json({ error: 'neighborhood_id and tour_type are required.' });
      return;
    }
    const validTypes = ['neighborhood_walk', 'property_arrival', 'vacay_preview', 'corridor_exploration'];
    if (!validTypes.includes(body.tour_type)) {
      res.status(400).json({ error: `tour_type must be one of: ${validTypes.join(', ')}.` });
      return;
    }
    try {
      const neighborhood = await getNeighborhood(body.neighborhood_id);
      if (!neighborhood) {
        res.status(404).json({ error: 'Neighborhood not found.' });
        return;
      }
      const corridors = await listCorridors();
      const neighborhoodCorridors = corridors.filter(
        (c) =>
          c.from_neighborhood_id === body.neighborhood_id ||
          c.to_neighborhood_id === body.neighborhood_id
      );
      const tour = await generateTour(
        { neighborhood_id: body.neighborhood_id, tour_type: body.tour_type, listing_facts: body.listing_facts },
        neighborhood,
        neighborhoodCorridors
      );
      res.json(tour);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      res.status(502).json({ error: message });
    }
  });

  router.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  return router;
}
