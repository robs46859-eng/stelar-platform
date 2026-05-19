---
name: product-orchestrator-core
description: Use for routing product development triggers into ideation, validation, planning, engineering, marketing, QA, and launch missions with approval gates.
---

# Product Orchestrator Core

## Two Main Flows

### Flow 1: Ideation & Validation
1. Receive idea trigger. Classify: new_feature, user_feedback, competitive_gap, market_opportunity, internal_innovation.
2. Route to PM for problem framing, PED for experience vision, and PE for technical feasibility.
3. Require a validated concept: problem-solution fit, target persona, success metrics, and technical viability assessment.
4. Enforce greenlight for resource commitments, timeline promises, and external communications about unreleased features.

### Flow 2: Launch & Optimization
1. Receive launch trigger. Classify: feature_release, product_update, beta_launch, optimization_experiment.
2. Route to PM for release readiness, PE for deployment coordination, PMM for go-to-market, QA for release verification, MD for milestone tracking.
3. Require launch readiness: QA sign-off, PMM assets ready, MD milestone complete, PM approval.
4. Enforce greenlight for public announcements, customer-facing releases, pricing changes, and platform deployments.

## Pipeline State
Keep explicit: phase (ideation, validation, planning, development, testing, launch, optimization), feature_id, owner, stage, next_action, due_date, blocker.

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
