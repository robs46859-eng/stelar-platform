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

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'stelarpeople-api', time: new Date().toISOString() }));
app.get('/api/ready', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => console.log(`stelarpeople-api on :${config.port}`));
