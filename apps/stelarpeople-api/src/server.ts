import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import { config } from './config.js';

const app = express();
app.use(cors());
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

app.listen(config.port, () => console.log(`stelarpeople-api on :${config.port}`));
