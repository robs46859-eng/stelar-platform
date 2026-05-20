import { Router } from 'express';
import { requireJwtUser } from '../auth/bearer.js';
import { listNeighborhoods, getNeighborhood, listCorridors } from '../services/graph.js';

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

  router.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  return router;
}
