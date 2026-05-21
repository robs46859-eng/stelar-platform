import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { config } from './config.js';
import { httpLogger } from './middleware/httpLogger.js';
import { generalApiLimiter } from './middleware/rateLimits.js';
import { tourRouter } from './routes/tours.js';

const app = express();
app.use(cors({ origin: config.corsAllowedOrigins.length > 0 ? config.corsAllowedOrigins : false }));
app.use(httpLogger);
app.use(express.json({ limit: '1mb' }));
app.use((req: any, _res: any, next: any) => {
  req.requestId = crypto.randomUUID();
  next();
});

const healthHandler = (_req: express.Request, res: express.Response) =>
  res.json({ ok: true, service: 'stelarpeople-api', time: new Date().toISOString() });
const readyHandler = (_req: express.Request, res: express.Response) => res.json({ ok: true });

app.get('/health', healthHandler);
app.get('/ready', readyHandler);
app.get('/api/health', healthHandler);
app.get('/api/ready', readyHandler);

app.use(generalApiLimiter);
app.use('/api', tourRouter);

app.listen(config.port, () => console.log(`stelarpeople-api on :${config.port}`));
