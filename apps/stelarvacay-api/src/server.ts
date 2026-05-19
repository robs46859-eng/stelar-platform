import express from 'express';
import crypto from 'crypto';
import { config } from './config.js';

const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => { req.requestId = crypto.randomUUID(); next(); });
app.get('/health', (_req, res) => res.json({ ok: true, service: 'stelarvacay-api' }));
app.get('/ready', (_req, res) => res.json({ ok: true }));
app.listen(config.port, () => console.log(`stelarvacay-api on :${config.port}`));
