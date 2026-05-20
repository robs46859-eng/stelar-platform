import { Pool } from 'pg';
import { config } from '../config.js';

export const pool = new Pool({ connectionString: config.postgresUrl });

export async function queryAll<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | undefined> {
  const result = await pool.query(text, params);
  return result.rows[0];
}

export async function execute(text: string, params?: unknown[]) {
  return pool.query<Record<string, unknown>>(text, params);
}
