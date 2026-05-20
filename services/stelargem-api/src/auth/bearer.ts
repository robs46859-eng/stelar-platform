import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export async function requireJwtUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSigningKey) as jwt.JwtPayload;
    (req as any).userId = decoded.sub ?? decoded.uid ?? decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Sign in again.' });
  }
}
