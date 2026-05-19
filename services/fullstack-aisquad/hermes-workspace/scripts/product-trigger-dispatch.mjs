#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://127.0.0.1:3000'

function usage() {
  console.error('Usage: node scripts/product-trigger-dispatch.mjs [--dry-run] <payload.json | ->')
  process.exit(2)
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const file = args.find((arg) => arg !== '--dry-run')
if (!file) usage()

async function readPayload(path) {
  const raw = path === '-'
    ? await new Promise((resolve, reject) => {
        let data = ''
        process.stdin.setEncoding('utf8')
        process.stdin.on('data', (chunk) => { data += chunk })
        process.stdin.on('end', () => resolve(data))
        process.stdin.on('error', reject)
      })
    : await readFile(path, 'utf8')
  return JSON.parse(raw)
}

function pretty(value) {
  return JSON.stringify(value ?? {}, null, 2)
}

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function task(workerId, text, rationale) {
  return { workerId, task: text.trim(), rationale }
}

function commonRules() {
  return `\n\nRules:\n- Draft all external-facing work; do not release, publish, announce, deploy, or change pricing without explicit human greenlight.\n- Put artifacts under memory/product/ when you create files.\n- Return the required checkpoint format with proof and next action.`
}

function buildAssignments(payload) {
  const type = oneLine(payload.type || payload.trigger || payload.event?.type || 'manual')
  const body = pretty(payload)
  const rawTitle = oneLine(payload.feature?.name || payload.feature?.idea || payload.feature?.feature_name || payload.feature?.area || payload.feature?.opportunity || payload.feature?.area_to_optimize || payload.product?.name || 'untitled')
  const title = `Product trigger: ${type}${rawTitle ? ` - ${rawTitle}` : ''}`
  const context = `Trigger payload:\n${body}`
  const rules = commonRules()

  switch (type) {
    case 'new_feature':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nFrame the problem: define the problem statement, target persona, success metrics, and success criteria. Draft a PRD with user stories, acceptance criteria, and timeline estimate.${rules}`, 'PM defines the problem and writes requirements.'),
        task('product-experience-director', `${context}\n\nMap the user journey for this feature: entry point, core flow, success moment. Identify experience risks and opportunities. Propose the UX vision and accessibility requirements.${rules}`, 'PED owns the experience design.'),
        task('product-engineer', `${context}\n\nAssess technical feasibility: can we build this? What architecture, data model, and API changes are needed? Effort estimate, dependencies, and technical risks.${rules}`, 'Engineering validates technical viability.'),
        task('project-manager', `${context}\n\nCreate the project charter: phases, milestones, resource allocation, risk register, and communication cadence. Identify critical path dependencies.${rules}`, 'Project Manager plans the delivery.'),
        task('product-orchestrator', `${context}\n\nRoute this feature idea through the ideation-and-validation flow. Define phase, owner, next action, and greenlight requests needed to move to planning.${rules}`, 'Product Orchestrator controls the pipeline.'),
      ] }
    case 'user_feedback':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nAssess the feedback: is it isolated, recurring, or widespread? Should this become a feature request, a bug fix, or a UX improvement? Prioritize against the backlog.${rules}`, 'PM triages feedback into action.'),
        task('product-experience-director', `${context}\n\nReview the experience issue. Does this indicate a usability pattern failure, accessibility gap, or journey breakdown? Propose a fix direction.${rules}`, 'PED diagnoses the experience root cause.'),
        task('product-qa', `${context}\n\nVerify the user-reported issue: reproduce it, assess severity, and check if QA missed it in regression. Update test coverage if needed.${rules}`, 'QA validates and fixes the verification gap.'),
        task('project-manager', `${context}\n\nEstimate the effort to address this feedback and slot it into the appropriate milestone. Track resolution through completion.${rules}`, 'Project Manager tracks the fix.'),
      ] }
    case 'competitive_gap':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nAssess the competitive gap: how significant is it, what would closing it cost, and does the gap threaten our positioning? Recommend a response strategy.${rules}`, 'PM evaluates the gap strategically.'),
        task('product-marketing-manager', `${context}\n\nAnalyze competitive positioning: what does the competitor do better, how do we reposition, and what is the messaging response? Draft a differentiation plan.${rules}`, 'PMM crafts the positioning response.'),
        task('product-engineer', `${context}\n\nAssess the technical feasibility of the competitor feature: do we have the infrastructure, what would the timeline be, and what are the technical risks of replicating or innovating?${rules}`, 'Engineering evaluates technical path.'),
        task('product-orchestrator', `${context}\n\nClassify the competitive gap and route to the right response mode: immediate feature, strategic response, or messaging pivot. Define next action and urgency.${rules}`, 'Product Orchestrator sets response urgency.'),
      ] }
    case 'market_opportunity':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nEvaluate this market opportunity: size, timing, strategic fit, and whether the team should act. Draft a preliminary PRD and success metrics.${rules}`, 'PM evaluates opportunity viability.'),
        task('product-marketing-manager', `${context}\n\nResearch the market segment: customer personas, pain points, existing solutions, and channel access. Draft a go-to-market outline.${rules}`, 'PMM maps the market landscape.'),
        task('product-experience-director', `${context}\n\nIdentify the UX requirements for this market: what would this audience expect, how is our current experience adequate or inadequate, and what design investment is needed?${rules}`, 'PED aligns experience to market needs.'),
      ] }
    case 'internal_innovation':
      return { missionTitle: title, assignments: [
        task('product-engineer', `${context}\n\nAssess this internal innovation idea: technical feasibility, novelty value, effort estimate, and whether it could become a product feature or platform capability.${rules}`, 'Engineering evaluates technical potential.'),
        task('product-manager', `${context}\n\nEvaluate strategic alignment: does this innovation connect to our roadmap, what problem does it solve, and should it move from experiment to product feature?${rules}`, 'PM evaluates strategic fit.'),
        task('product-orchestrator', `${context}\n\nRoute the innovation idea: is this a spike, a feature experiment, or a new product wedge? Define the validation path and next action.${rules}`, 'Product Orchestrator classifies and routes.'),
      ] }
    case 'feature_release':
      return { missionTitle: title, assignments: [
        task('project-manager', `${context}\n\nBuild the release plan: go/no-go checklist, milestone status, rollback procedure, launch day runbook, and escalation paths. Confirm all teams are synchronized.${rules}`, 'Project Manager owns the release plan.'),
        task('product-qa', `${context}\n\nRun the release verification: test against acceptance criteria, performance benchmarks, regression suite, and accessibility checks. Provide a ship/hold recommendation with evidence.${rules}`, 'QA owns the release quality gate.'),
        task('product-marketing-manager', `${context}\n\nPrepare go-to-market assets: positioning, messaging, launch narrative, blog post draft, product update email, social posts, and sales enablement materials. Do not publish.${rules}`, 'PMM owns launch communications.'),
        task('product-orchestrator', `${context}\n\nReview the release package: list all greenlight decisions needed, confirm all teams are ready, and define the go/no-go gate timeline.${rules}`, 'Product Orchestrator gates the release.'),
        task('product-engineer', `${context}\n\nConfirm deployment readiness: feature flags configured, monitoring and alerting set, rollback procedure tested, and canary plan defined.${rules}`, 'Engineering ensures deployment readiness.'),
      ] }
    case 'product_update':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nAssess the update: define the scope, customer impact analysis, and the communication strategy. Draft stakeholder alignment notes.${rules}`, 'PM owns the update strategy.'),
        task('product-marketing-manager', `${context}\n\nDraft the customer communication: what is changing, how it affects them, what to do next, and the timeline. Include FAQ and support team brief. Do not send.${rules}`, 'PMM owns customer communication drafts.'),
        task('project-manager', `${context}\n\nTrack the update coordination: timeline, affected teams, dependency management, and communication cadence until all customers are informed.${rules}`, 'Project Manager tracks coordination.'),
      ] }
    case 'beta_launch':
      return { missionTitle: title, assignments: [
        task('project-manager', `${context}\n\nPlan the beta program: target user list, recruitment plan, feedback collection cadence, milestone reviews during beta, and the transition plan from beta to GA.${rules}`, 'Project Manager owns beta coordination.'),
        task('product-qa', `${context}\n\nSet up beta quality monitoring: how will user-reported issues be triaged, what is the severity threshold for beta bugs, and what telemetry is needed to measure stability?${rules}`, 'QA owns beta quality monitoring.'),
        task('product-marketing-manager', `${context}\n\nDraft the beta announcement, recruitment landing page, and early access communication. Include the beta program terms and feedback expectations. Do not publish.${rules}`, 'PMM owns beta communications.'),
        task('product-engineer', `${context}\n\nEnsure beta infrastructure: telemetry, error tracking, feature flag for beta users, and a way to push fixes rapidly during the beta window.${rules}`, 'Engineering ensures beta infrastructure.'),
      ] }
    case 'optimization_experiment':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nDefine the experiment: hypothesis, success metrics, guardrail metrics, minimum sample size, and decision criteria for win/lose/inconclusive.${rules}`, 'PM owns experiment design.'),
        task('product-qa', `${context}\n\nVerify the experiment setup: correct tracking implementation, data integrity, no cross-contamination between variants, and that the measurement system is accurate.${rules}`, 'QA validates experiment integrity.'),
        task('product-engineer', `${context}\n\nImplement the experiment infrastructure: A/B test framework, traffic splitting, variant assignment, and data collection. Ensure statistical validity in the implementation.${rules}`, 'Engineering implements the experiment.'),
        task('project-manager', `${context}\n\nTrack the experiment timeline: when it starts, minimum duration, when results are expected, and when the implementation decision must be made.${rules}`, 'Project Manager tracks experiment timing.'),
      ] }
    case 'domain_acquisition':
      return { missionTitle: title, assignments: [
        task('product-manager', `${context}\n\nAssess this domain for product potential: what digital service, SaaS product, or agency could this domain anchor? Draft a PRD concept with target market, revenue model, and go-to-market strategy.${rules}`, 'PM evaluates domain as product anchor.'),
        task('brand-visionary', `${context}\n\nCreate a full brand concept and prospect-specific sales kit for this domain. Build: (1) Brand identity: name variations, tagline, positioning for the target vertical. (2) Custom landing page copy tailored to prospective clients. (3) Client-specific case study template. (4) ROI demonstration. (5) Email pitch template personalized to the target vertical. Do not send any outreach materials.${rules}`, 'Brand Visionary creates the customized brand vision and prospect materials.'),
        task('product-experience-director', `${context}\n\nDesign the user experience vision for a product/agency built on this domain. Map the user journey, key screens, and brand experience. Note any design system requirements.${rules}`, 'PED owns the experience vision.'),
        task('product-engineer', `${context}\n\nAssess what it would take to build a product/agency on this domain: technical approach, stack recommendations, MVP scope, and estimated timeline.${rules}`, 'Engineering assesses build feasibility.'),
        task('content-writer', `${context}\n\nWrite SEO-optimized landing page copy, blog post series, and social content for launching this domain-based product. Include title variants, meta descriptions, and CTAs.${rules}`, 'Content Writer crafts launch copy.'),
        task('product-orchestrator', `${context}\n\nRoute this domain through the product acquisition pipeline. Define phase (concept validation vs build), next actions, and greenlight requests needed before outreach.${rules}`, 'Product Orchestrator controls the pipeline.'),
      ] }

    default:
      return { missionTitle: title, assignments: [
        task('product-orchestrator', `${context}\n\nClassify this product development trigger and route it to the right workers. If critical fields are missing, return NEEDS_INPUT with the smallest set of questions.${rules}`, 'Product Orchestrator handles unknown triggers.'),
      ] }
  }
}

const payload = await readPayload(file)
const dispatch = buildAssignments(payload)
const request = {
  missionTitle: dispatch.missionTitle,
  assignments: dispatch.assignments,
  waitForCheckpoint: false,
  allowAsync: true,
  notifySessionKey: 'product',
}

if (dryRun) {
  console.log(JSON.stringify(request, null, 2))
  process.exit(0)
}

const response = await fetch(`${WORKSPACE_URL}/api/swarm-dispatch`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
})
const text = await response.text()
if (!response.ok) {
  console.error(`Dispatch failed: HTTP ${response.status}`)
  console.error(text)
  process.exit(1)
}
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2))
} catch {
  console.log(text)
}
