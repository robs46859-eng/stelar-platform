import crypto from "node:crypto";
import { Pool } from "pg";
import type { PlannerQuote, PlannerRequest } from "../domain/planner.ts";

export type SavedTripPlan = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  request: PlannerRequest;
  quote: PlannerQuote;
  advice: string;
};

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export async function saveTripPlan(
  userId: string,
  request: PlannerRequest,
  quote: PlannerQuote,
  advice: string,
): Promise<SavedTripPlan> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const plan: SavedTripPlan = {
    id,
    userId,
    createdAt: now,
    updatedAt: now,
    request,
    quote,
    advice,
  };
  await pool.query(
    `INSERT INTO stelarvacay.trip_plans (id, user_id, created_at, updated_at, request, quote, advice)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, now, now, JSON.stringify(request), JSON.stringify(quote), advice],
  );
  return plan;
}

export async function getUserTripPlans(userId: string, limit = 8): Promise<SavedTripPlan[]> {
  const cap = Math.max(1, Math.min(limit, 25));
  const result = await pool.query(
    `SELECT id, user_id, created_at, updated_at, request, quote, advice
     FROM stelarvacay.trip_plans
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, cap],
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request: typeof row.request === "string" ? JSON.parse(row.request) : row.request,
    quote: typeof row.quote === "string" ? JSON.parse(row.quote) : row.quote,
    advice: row.advice,
  }));
}

export async function deleteTripPlan(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM stelarvacay.trip_plans WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
