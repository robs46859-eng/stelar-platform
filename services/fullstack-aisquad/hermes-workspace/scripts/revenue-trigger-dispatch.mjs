#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://127.0.0.1:3000'

function usage() {
  console.error('Usage: node scripts/revenue-trigger-dispatch.mjs [--dry-run] <payload.json | ->')
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
  return `\n\nRules:\n- Draft external-facing work only; do not send, publish, buy ads, change customer systems, use credentials, commit final prices, or make customer commitments without explicit human greenlight.\n- Put artifacts under memory/revenue/ when you create files.\n- Return the required checkpoint format with proof and next action.`
}

function buildAssignments(payload) {
  const type = oneLine(payload.type || payload.trigger || payload.event?.type || 'manual')
  const body = pretty(payload)
  const rawLeadName = oneLine(payload.lead?.company || payload.customer?.company || payload.offer?.title || payload.project?.title || '')
  const title = `Revenue trigger: ${type}${rawLeadName ? ` - ${rawLeadName}` : ''}`
  const context = `Trigger payload:\n${body}`
  const rules = commonRules()

  switch (type) {
    case 'market_scan':
    case 'daily_market_scan':
      return { missionTitle: title, assignments: [
        task('market-intel', `${context}\n\nResearch 5-10 reachable B2B niches for custom AI widgets, automations, integrations, and consulting. Score each by buyer pain, willingness to pay, access path, feasibility, proof/demo potential, and sales cycle. Produce memory/revenue/market-scan-<date>.md.${rules}`, 'Market Intel owns opportunity research.'),
        task('offer-architect', `${context}\n\nDraft 3 productized service offers that could be sold from this market scan: one low-friction AI widget, one automation/integration package, and one B2B consulting wedge. Include scope, deliverables, price bands, timeline assumptions, and acceptance criteria.${rules}`, 'Offer Architect packages research into sellable services.'),
        task('revenue-orchestrator', `${context}\n\nCreate a prioritized next-action plan after the market scan. Define which offers should move to listing, promotion, or validation. Include greenlight requests needed before public action.${rules}`, 'Revenue Orchestrator turns research into pipeline actions.'),
      ] }
    case 'lead_created':
      return { missionTitle: title, assignments: [
        task('market-intel', `${context}\n\nQualify this lead. Research company context, likely pain, integration surfaces, budget/urgency signals, decision-maker hints, and best-fit service angle. Produce a concise lead brief with confidence and source trail.${rules}`, 'Market Intel qualifies the lead.'),
        task('sales-closer', `${context}\n\nDraft discovery questions, a first-response message, and a recommended next step for this lead. Keep it approval-ready and do not send.${rules}`, 'Sales Closer owns discovery and response drafts.'),
        task('revenue-orchestrator', `${context}\n\nCreate the lead routing plan: stage, owner, missing information, suggested offer path, follow-up due date, and explicit greenlight request if an outbound response is ready.${rules}`, 'Revenue Orchestrator controls pipeline state.'),
      ] }
    case 'offer_idea':
      return { missionTitle: title, assignments: [
        task('market-intel', `${context}\n\nValidate the service idea against buyer pain, competitors/substitutes, reachable channels, and proof examples. Return risks and strongest niche.${rules}`, 'Market Intel validates demand.'),
        task('offer-architect', `${context}\n\nTurn this idea into a scoped offer one-pager with buyer, promise, deliverables, non-goals, inputs needed, price bands, timeline assumptions, proof, risks, and FAQ.${rules}`, 'Offer Architect packages the offer.'),
        task('solution-builder', `${context}\n\nCreate a technical feasibility note and demo/prototype plan for this offer. Include the smallest demo that would help sell it and any required APIs/data/credentials.${rules}`, 'Solution Builder tests technical feasibility.'),
      ] }
    case 'proposal_request':
      return { missionTitle: title, assignments: [
        task('sales-closer', `${context}\n\nDraft a discovery summary, open questions, proposal email draft, and close plan. Do not send or commit pricing.${rules}`, 'Sales Closer owns proposal conversation.'),
        task('offer-architect', `${context}\n\nDraft proposal scope options with deliverables, assumptions, exclusions, acceptance criteria, and price bands.${rules}`, 'Offer Architect owns scope and package.'),
        task('solution-builder', `${context}\n\nAssess technical feasibility, dependencies, integration risks, and a delivery approach for the proposal.${rules}`, 'Solution Builder owns technical proof.'),
        task('revenue-orchestrator', `${context}\n\nAssemble the proposal readiness checklist and list exact greenlight decisions needed before sending.${rules}`, 'Revenue Orchestrator gates customer commitments.'),
      ] }
    case 'build_request':
      return { missionTitle: title, assignments: [
        task('delivery-manager', `${context}\n\nCreate a delivery plan with milestones, required customer inputs, acceptance tests, communication cadence, risks, and change-order triggers.${rules}`, 'Delivery Manager owns fulfillment control.'),
        task('solution-builder', `${context}\n\nCreate the technical implementation plan or first prototype task list. Include verification steps and blockers.${rules}`, 'Solution Builder owns the build lane.'),
      ] }
    case 'list_offer':
      return { missionTitle: title, assignments: [
        task('listing-manager', `${context}\n\nDraft service listing copy for requested channels. Include headline options, buyer pain, deliverables, requirements, price-band language, FAQ, proof placeholders, and approval checklist.${rules}`, 'Listing Manager owns catalog/listing drafts.'),
        task('offer-architect', `${context}\n\nReview the offer scope behind this listing for deliverability, claims risk, exclusions, and acceptance criteria.${rules}`, 'Offer Architect keeps the listing grounded.'),
      ] }
    case 'promote_offer':
      return { missionTitle: title, assignments: [
        task('growth-promoter', `${context}\n\nDraft a promotion plan and campaign assets for the channels listed. Include audience, hooks, content drafts, CTA, metrics, and compliance/approval notes. Do not publish or send.${rules}`, 'Growth Promoter owns campaign drafts.'),
        task('sales-closer', `${context}\n\nDraft sales follow-up snippets and discovery CTAs aligned to this promotion. Do not send.${rules}`, 'Sales Closer connects promotion to pipeline conversion.'),
      ] }
    case 'closed_won':
      return { missionTitle: title, assignments: [
        task('delivery-manager', `${context}\n\nConvert this win into an onboarding and delivery plan. Capture scope, milestones, required inputs, risks, acceptance criteria, and next customer meeting agenda.${rules}`, 'Delivery Manager owns won-work handoff.'),
        task('solution-builder', `${context}\n\nCreate the initial technical kickoff checklist and build plan. Flag credentials/data/systems needed and approval gates.${rules}`, 'Solution Builder prepares execution.'),
        task('customer-success', `${context}\n\nDraft onboarding/check-in message and customer success plan. Do not send.${rules}`, 'Customer Success owns onboarding follow-up.'),
      ] }
    case 'follow_up_due':
      return { missionTitle: title, assignments: [
        task('customer-success', `${context}\n\nDraft a helpful follow-up based on lifecycle stage and reason. Include value delivered, question/CTA, issue check, and next touch date. Do not send.${rules}`, 'Customer Success owns customer follow-up.'),
        task('sales-closer', `${context}\n\nIdentify renewal, upsell, referral, or testimonial opportunity only if customer value is clear. Draft optional language for approval.${rules}`, 'Sales Closer handles expansion opportunities.'),
      ] }
    case 'customer_issue':
      return { missionTitle: title, assignments: [
        task('customer-success', `${context}\n\nTriage the customer issue, draft acknowledgement and next-step response, and identify severity. Do not send.${rules}`, 'Customer Success owns customer communication draft.'),
        task('delivery-manager', `${context}\n\nAssess delivery impact, owner, priority, and resolution plan. Route technical work if needed.${rules}`, 'Delivery Manager owns issue resolution path.'),
        task('solution-builder', `${context}\n\nIf technical, inspect the issue context and propose reproduction/diagnosis steps. Do not touch customer systems without approval.${rules}`, 'Solution Builder owns technical diagnosis.'),
      ] }
    case 'domain_flip':
      return { missionTitle: title, assignments: [
        task('offer-architect', `${context}\n\nCreate a domain flip offer: target buyer profile, positioning, price bands based on comparable sales, and listing details. Include what makes the domain premium and to whom.${rules}`, 'Offer Architect packages the domain as a sellable offer.'),
        task('listing-manager', `${context}\n\nDraft marketplace listings for Sedo, Afternic, Dan.com, and Namecheap. Include compelling descriptions, pricing strategy, and what to fill in for each platform. Do not publish.${rules}`, 'Listing Manager creates platform-specific listings.'),
        task('market-intel', `${context}\n\nResearch comparable domain sales in this category. Find recent sales of similar-length, similar-TLD domains. Identify the most likely buyer verticals and their acquisition budgets.${rules}`, 'Market Intel validates pricing and buyer pool.'),
        task('sales-closer', `${context}\n\nDraft outreach emails and pitch materials for prospective domain buyers. Personalize to the vertical and make a compelling case. Do not send.${rules}`, 'Sales Closer prepares buyer outreach.'),
        task('revenue-orchestrator', `${context}\n\nCreate the domain flip pipeline: listing status, pricing strategy, outreach schedule, and greenlight requests needed before publishing listings or sending outreach.${rules}`, 'Revenue Orchestrator controls the sale pipeline.'),
      ] }

    default:
      return { missionTitle: title, assignments: [
        task('revenue-orchestrator', `${context}\n\nClassify this revenue trigger and route it to the right workers. If critical fields are missing, return NEEDS_INPUT with the smallest set of questions.${rules}`, 'Revenue Orchestrator handles unknown triggers.'),
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
  notifySessionKey: 'revenue',
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
