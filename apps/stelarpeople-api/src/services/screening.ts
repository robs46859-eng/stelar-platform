import { execute, queryAll, queryOne } from "../db/client.js";
import { applyScreeningOutcome } from "./crm.js";

interface ScreeningApplication { id: string; prospect_id?: string; unit_id?: string; status: string; decision?: string; decision_notes?: string; }

type ScreeningOverviewApplication = Record<string, unknown> & {
  prospect_name: string;
  decision?: string;
};

// Deterministic policy evaluation — returns { decision, reasons }
function evaluatePolicy(input: Record<string, unknown>, policy: Record<string, unknown> | null | undefined, unit: Record<string, unknown> | null | undefined): { decision: string; reasons: string[] } {
  const reasons: string[] = [];
  let conditional = false;

  const credit = Number(input.credit_score ?? 0);
  const minCredit = Number(policy?.min_credit_score ?? 0);
  if (minCredit > 0 && credit < minCredit) {
    reasons.push(`Credit score ${credit} below minimum ${minCredit}`);
  }

  const rentCents = Number(unit?.market_rent_cents ?? 0);
  const incomeCents = Number(input.gross_monthly_income_cents ?? (input.gross_monthly_income != null ? Math.round(Number(input.gross_monthly_income) * 100) : 0));
  const minRatio = Number(policy?.min_income_rent_ratio ?? 0);
  if (minRatio > 0 && rentCents > 0 && incomeCents / rentCents < minRatio) {
    reasons.push(`Income ratio ${(incomeCents / rentCents).toFixed(2)} below minimum ${minRatio}`);
  }

  const collections = Number(input.open_collections_cents ?? (input.open_collections != null ? Math.round(Number(input.open_collections) * 100) : 0));
  const maxCollections = Number(policy?.max_open_collections_cents ?? Infinity);
  if (collections > maxCollections) {
    reasons.push(`Open collections $${(collections / 100).toFixed(2)} exceeds max $${(maxCollections / 100).toFixed(2)}`);
  }

  if (input.has_eviction) reasons.push("Eviction on record");
  if (input.has_felony) reasons.push("Felony on record");

  if (policy?.requires_identity_pass && !input.identity_verified) {
    reasons.push("Identity verification required");
  }

  if (policy?.require_income_docs && !input.income_docs_verified) {
    conditional = true;
  }

  if (reasons.length > 0) return { decision: "denied", reasons };
  if (conditional) return { decision: "conditional", reasons: ["Income documents pending verification"] };
  return { decision: "approved", reasons: ["All policy criteria met"] };
}

const screeningDecisions = new Set(["pending", "approved", "conditional", "denied"]);

function parseReasons(value: unknown): string[] {
  if (value == null || value === "") return [];
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return [String(value)];
  }
}

function normalizeApplication(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    gross_monthly_income: row.gross_monthly_income_cents != null ? (row.gross_monthly_income_cents as number) / 100 : null,
    open_collections: row.open_collections_cents != null ? (row.open_collections_cents as number) / 100 : null,
    decision_reasons: parseReasons(row.decision_reasons),
    meets_credit_policy:
      row.credit_score != null && row.min_credit_score != null ? Number(row.credit_score) >= Number(row.min_credit_score) : null,
    meets_income_policy:
      row.gross_monthly_income_cents != null && row.market_rent_cents != null && row.min_income_rent_ratio != null
        ? (row.gross_monthly_income_cents as number) / Math.max(row.market_rent_cents as number, 1) >= Number(row.min_income_rent_ratio)
        : null,
  };
}

export async function listScreeningOverview() {
  const policies = await queryAll<Record<string, unknown>>(
    `
      SELECT *
      FROM stelarpeople.screening_policies
      WHERE is_active = TRUE
      ORDER BY policy_code
    `,
  );

  const applications: ScreeningOverviewApplication[] = (await queryAll<Record<string, unknown>>(`
    SELECT
      sa.*,
      cp.prospect_id AS lead_code,
      cp.first_name,
      cp.last_name,
      cp.stage,
      sp.policy_code,
      sp.label AS policy_label,
      sp.min_credit_score,
      sp.min_income_rent_ratio,
      sp.max_open_collections_cents,
      sp.requires_identity_pass,
      sp.require_income_docs,
      u.unit_number,
      u.market_rent_cents,
      a.asset_id AS asset_code
    FROM stelarpeople.screening_applications sa
    JOIN stelarpeople.crm_prospects cp ON sa.prospect_id = cp.id
    LEFT JOIN stelarpeople.screening_policies sp ON sa.policy_id = sp.id
    LEFT JOIN stelarpeople.units u ON sa.unit_id = u.id
    LEFT JOIN stelarpeople.assets a ON u.asset_id = a.id
    ORDER BY
      CASE sa.decision
        WHEN 'pending' THEN 0
        WHEN 'conditional' THEN 1
        WHEN 'approved' THEN 2
        ELSE 3
      END,
      sa.submitted_at DESC,
      sa.id DESC
  `)).map((row) => ({
    ...normalizeApplication(row),
    prospect_name: [row.first_name, row.last_name].filter(Boolean).join(" "),
  }));

  return {
    policies,
    applications,
    summary: {
      pending: applications.filter((application) => application.decision === "pending").length,
      approved: applications.filter((application) => application.decision === "approved").length,
      conditional: applications.filter((application) => application.decision === "conditional").length,
      denied: applications.filter((application) => application.decision === "denied").length,
    },
  };
}

export async function createScreeningApplication(input: Record<string, unknown>) {
  if (!input.prospect_id) {
    throw new Error("prospect_id is required");
  }

  // Load policy and unit for auto-decision
  const policy = input.policy_id
    ? await queryOne<Record<string, unknown>>(`SELECT * FROM stelarpeople.screening_policies WHERE id = $1`, [input.policy_id])
    : null;
  const unit = input.unit_id
    ? await queryOne<Record<string, unknown>>(`SELECT * FROM stelarpeople.units WHERE id = $1`, [input.unit_id])
    : null;

  // Auto-run policy evaluation unless caller explicitly passes a decision
  const incomeCents = input.gross_monthly_income_cents ?? (input.gross_monthly_income != null ? Math.round(Number(input.gross_monthly_income) * 100) : null);
  const autoResult = evaluatePolicy({ ...input, gross_monthly_income_cents: incomeCents }, policy, unit);
  const decision = input.decision && input.decision !== "pending" ? String(input.decision).trim().toLowerCase() : autoResult.decision;
  const decisionReasons = Array.isArray(input.decision_reasons) && (input.decision_reasons as unknown[]).length > 0
    ? input.decision_reasons
    : autoResult.reasons;

  if (!screeningDecisions.has(decision)) {
    throw new Error("Invalid screening decision");
  }

  const reasons = JSON.stringify(decisionReasons);

  const result = await execute(
    `
      INSERT INTO stelarpeople.screening_applications (
        prospect_id, unit_id, policy_id, gross_monthly_income_cents, credit_score,
        open_collections_cents, occupants_count, has_eviction, has_felony,
        identity_verified, income_docs_verified, decision, decision_reasons, reviewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `,
    [
      input.prospect_id,
      input.unit_id || null,
      input.policy_id || null,
      incomeCents,
      input.credit_score == null ? null : Number(input.credit_score),
      input.open_collections == null ? 0 : Math.round(Number(input.open_collections) * 100),
      input.occupants_count == null ? 1 : Number(input.occupants_count),
      input.has_eviction ? true : false,
      input.has_felony ? true : false,
      input.identity_verified ? true : false,
      input.income_docs_verified ? true : false,
      decision,
      reasons,
      new Date().toISOString(),
    ],
  );

  const id = result.rows[0]?.id;

  // Auto-advance CRM stage based on decision
  await applyScreeningOutcome(Number(input.prospect_id), decision);

  return getScreeningApplicationById(Number(id));
}

export async function updateScreeningDecision(applicationId: number, input: Record<string, unknown>) {
  const existing = await getScreeningApplicationById(applicationId);
  if (!existing) {
    throw new Error("Screening application not found");
  }

  const decision = String(input.decision || existing.decision).trim().toLowerCase();
  if (!screeningDecisions.has(decision)) {
    throw new Error("Invalid screening decision");
  }

  const reasons = Array.isArray(input.decision_reasons)
    ? JSON.stringify(input.decision_reasons)
    : JSON.stringify(existing.decision_reasons || []);

  await execute(
    `
      UPDATE stelarpeople.screening_applications
      SET decision = $1, decision_reasons = $2, reviewed_at = $3, identity_verified = $4, income_docs_verified = $5
      WHERE id = $6
    `,
    [
      decision,
      reasons,
      decision === "pending" ? null : new Date().toISOString(),
      input.identity_verified == null ? (existing.identity_verified ? true : false) : input.identity_verified ? true : false,
      input.income_docs_verified == null ? (existing.income_docs_verified ? true : false) : input.income_docs_verified ? true : false,
      applicationId,
    ],
  );

  return getScreeningApplicationById(applicationId);
}

export async function getScreeningApplicationById(applicationId: number): Promise<Record<string, unknown> | null> {
  const row = await queryOne<Record<string, unknown>>(
    `
      SELECT
        sa.*,
        cp.prospect_id AS lead_code,
        cp.first_name,
        cp.last_name,
        cp.stage,
        sp.policy_code,
        sp.label AS policy_label,
        sp.min_credit_score,
        sp.min_income_rent_ratio,
        sp.max_open_collections_cents,
        sp.requires_identity_pass,
        sp.require_income_docs,
        u.unit_number,
        u.market_rent_cents,
        a.asset_id AS asset_code
      FROM stelarpeople.screening_applications sa
      JOIN stelarpeople.crm_prospects cp ON sa.prospect_id = cp.id
      LEFT JOIN stelarpeople.screening_policies sp ON sa.policy_id = sp.id
      LEFT JOIN stelarpeople.units u ON sa.unit_id = u.id
      LEFT JOIN stelarpeople.assets a ON u.asset_id = a.id
      WHERE sa.id = $1
    `,
    [applicationId],
  );
  return row
    ? {
        ...normalizeApplication(row),
        prospect_name: [row.first_name, row.last_name].filter(Boolean).join(" "),
      }
    : null;
}
