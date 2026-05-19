#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://127.0.0.1:3000'

function usage() {
  console.error('Usage: node scripts/media-trigger-dispatch.mjs [--dry-run] <payload.json | ->')
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
  return `\n\nRules:\n- Draft all external-facing work; do not publish, post, send, or distribute without explicit human greenlight.\n- Put artifacts under memory/media/ when you create files.\n- Return the required checkpoint format with proof and next action.`
}

function buildAssignments(payload) {
  const type = oneLine(payload.type || payload.trigger || payload.event?.type || 'manual')
  const body = pretty(payload)
  const rawTitle = oneLine(payload.content?.topic || payload.content?.title || payload.content?.piece_title || payload.content?.category || 'untitled')
  const title = `Media trigger: ${type}${rawTitle ? ` - ${rawTitle}` : ''}`
  const context = `Trigger payload:\n${body}`
  const rules = commonRules()

  switch (type) {
    case 'content_idea':
      return { missionTitle: title, assignments: [
        task('content-researcher', `${context}\n\nResearch the topic. Find trends, competitor coverage, audience pain points, and content gaps. Produce a concise research brief with 3-5 recommended angles, source trail, and confidence level.${rules}`, 'Content Researcher validates the idea against market reality.'),
        task('content-planner', `${context}\n\nDraft a multi-channel content plan: formats per channel, hooks, SEO keywords, sequencing, and publishing windows. Include cross-promotion and approval checklist.${rules}`, 'Content Planner structures the idea into actionable plan.'),
        task('media-orchestrator', `${context}\n\nCreate the content routing plan: stage, owner, missing information, suggested workflow, greenlight requests needed before production.${rules}`, 'Media Orchestrator controls pipeline state and approvals.'),
      ] }
    case 'trend_alert':
      return { missionTitle: title, assignments: [
        task('content-researcher', `${context}\n\nAnalyze the trending topic. Assess audience interest, competitor response timing, content angles, and urgency. Return a brief with strongest angle recommendation.${rules}`, 'Content Researcher evaluates trend viability.'),
        task('content-planner', `${context}\n\nCreate a rapid-response content plan: fastest path to publish across channels, hooks tied to the trend, and time-to-publish estimates.${rules}`, 'Content Planner plans trend-reactive distribution.'),
      ] }
    case 'production_request':
      return { missionTitle: title, assignments: [
        task('content-producer', `${context}\n\nProduce the media asset based on the production request. Choose the right toolchain (manim, heartmula, p5js, etc.), generate the content, and provide technical specs and verification.${rules}`, 'Content Producer owns media generation.'),
        task('visual-designer', `${context}\n\nCreate any supporting visual assets: thumbnails, cover art, infographics, or diagrams needed for the production package.${rules}`, 'Visual Designer creates the visual packaging.'),
      ] }
    case 'editorial_deadline':
      return { missionTitle: title, assignments: [
        task('content-writer', `${context}\n\nProduce the content draft based on the deadline and channel. Write channel-optimized copy with SEO elements, title variants, and CTAs.${rules}`, 'Content Writer owns the copy delivery.'),
        task('content-planner', `${context}\n\nReview the editorial plan around this deadline. Confirm sequencing, cross-promotions, and channel alignment are still on track.${rules}`, 'Content Planner keeps calendar coherence.'),
        task('distribution-manager', `${context}\n\nPrepare channel-specific formatting, SEO optimization, UTM tracking, and a distribution schedule for when the piece is ready.${rules}`, 'Distribution Manager preps the publishing pipeline.'),
      ] }
    case 'publish_ready':
      return { missionTitle: title, assignments: [
        task('distribution-manager', `${context}\n\nFormat and prepare all channel-specific posting drafts. Include SEO metadata, UTM parameters, platform-specific formatting, and a publishing schedule.${rules}`, 'Distribution Manager handles channel preparation.'),
        task('media-orchestrator', `${context}\n\nReview the publish-ready package. List all greenlight decisions needed and create the final approval checklist before distribution.${rules}`, 'Media Orchestrator gates the publish decision.'),
        task('analytics-reviewer', `${context}\n\nSet up tracking baseline for this piece: what metrics to watch, success criteria, and when to schedule a performance review.${rules}`, 'Analytics Reviewer preps post-publish measurement.'),
      ] }
    case 'performance_review':
      return { missionTitle: title, assignments: [
        task('analytics-reviewer', `${context}\n\nAnalyze the performance data. Compare against benchmarks, identify strengths, weaknesses, and actionable optimizations. Produce a performance report.${rules}`, 'Analytics Reviewer owns the data analysis.'),
        task('content-planner', `${context}\n\nBased on performance data, recommend content strategy adjustments: which angles to double down on, which to retire, and what to try next.${rules}`, 'Content Planner translates data into strategy.'),
      ] }
    case 'channel_update':
      return { missionTitle: title, assignments: [
        task('distribution-manager', `${context}\n\nAssess the channel update impact. Update posting strategies, reformatting needs, and reschedule any affected content.${rules}`, 'Distribution Manager handles platform adaptation.'),
        task('content-producer', `${context}\n\nIf format changes are needed, update production specs for future content to match new channel requirements.${rules}`, 'Content Producer adapts production guidelines.'),
      ] }
    case 'content_audit':
      return { missionTitle: title, assignments: [
        task('analytics-reviewer', `${context}\n\nAudit the content as specified. Check for SEO issues, broken links, outdated content, engagement drops, and optimization opportunities. Produce an audit report with priority actions.${rules}`, 'Analytics Reviewer owns the content audit.'),
        task('content-researcher', `${context}\n\nIdentify fresh topic angles to replace or update underperforming content. Research current relevance and competitor positioning.${rules}`, 'Content Researcher suggests content refreshes.'),
      ] }
    default:
      return { missionTitle: title, assignments: [
        task('media-orchestrator', `${context}\n\nClassify this media trigger and route it to the right workers. If critical fields are missing, return NEEDS_INPUT with the smallest set of questions.${rules}`, 'Media Orchestrator handles unknown triggers.'),
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
  notifySessionKey: 'media',
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
