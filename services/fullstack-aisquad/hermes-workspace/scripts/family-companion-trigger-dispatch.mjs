#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://127.0.0.1:3000'

function usage() {
  console.error('Usage: node scripts/family-companion-trigger-dispatch.mjs [--dry-run] <payload.json | ->')
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

function commonRules(payload) {
  const project = payload.project || {}
  return `\n\nProject constants:\n- Root: ${project.root || '/home/azureuser/family-companion'}\n- Backend: ${project.backend || '/home/azureuser/family-companion/backend'}\n- Android: ${project.android || '/home/azureuser/family-companion/android'}\n- Ollama OpenAI-compatible base URL: ${project.ollama_base_url || 'http://localhost:11434/v1'}\n- Required model: ${project.local_model || 'gemma4:26b'}\n\nRules:\n- Preserve dirty worktree changes and do not revert unrelated edits.\n- Production deploys, destructive DB actions, credential use, external sends, and public announcements require human greenlight.\n- Return the required checkpoint format with exact proof and next action.`
}

function buildAssignments(payload) {
  const type = oneLine(payload.type || payload.trigger || payload.event?.type || 'ship_merger')
  const body = pretty(payload)
  const projectName = oneLine(payload.project?.name || 'family-companion merger')
  const title = `Family companion trigger: ${type} - ${projectName}`
  const context = `Trigger payload:\n${body}`
  const rules = commonRules(payload)

  const backendTask = task(
    'family-backend-integrator',
    `${context}\n\nHarden the backend Android/API and local Gemma path for ship readiness. Confirm config is wired to Ollama at http://localhost:11434/v1 with model gemma4:26b, then smoke /health and /api/v1/android/chat on the updated backend. If port 8000 is stale, use a non-conflicting local smoke port and report it. Fix only scoped backend issues needed to make the smoke clean.${rules}`,
    'Backend owns FastAPI Android contracts and local Gemma routing.'
  )
  const androidTask = task(
    'family-android-integrator',
    `${context}\n\nInspect the Android app and wire the next missing integration slice for chat, pregnancy journey, or health tools through Retrofit/Repository/ViewModel while preserving Room/offline behavior. Run the closest available Gradle compile/check command and report exact blockers if the app cannot build.${rules}`,
    'Android owns client integration and offline-safe app behavior.'
  )
  const dbTask = task(
    'family-db-migration',
    `${context}\n\nConvert the current manual DB bootstrap for resources, pregnancy_journeys, and health_metrics into a repeatable migration or safe bootstrap path. Verify current DB revision/status and smoke journey/health metric flows with real test IDs. Do not drop, reset, or truncate data without greenlight.${rules}`,
    'DB migration owner turns manual tables/enums into repeatable schema work.'
  )
  const qaTask = task(
    'family-qa-smoke',
    `${context}\n\nProduce a ship/hold smoke report covering: Ollama /v1/models and chat completion for gemma4:26b; backend /health; Android chat endpoint route/model proof; journey create/read; health metric create/filter; places; and Android compile/build status. Include exact commands, ports, status codes, and response excerpts.${rules}`,
    'QA owns concrete release evidence.'
  )
  const docsTask = task(
    'family-release-docs',
    `${context}\n\nUpdate or draft the merger runbook/demo checklist so it reflects actual VM paths, model tag gemma4:26b, Ollama URL, backend smoke commands, Android build commands, and remaining ship blockers. Do not claim unverified tests passed.${rules}`,
    'Release docs owns operator-ready handoff and demo truth.'
  )

  switch (type) {
    case 'backend_smoke':
      return { missionTitle: title, assignments: [backendTask, qaTask] }
    case 'android_sync':
      return { missionTitle: title, assignments: [androidTask, qaTask] }
    case 'release_gate':
    case 'ship_merger':
      return { missionTitle: title, assignments: [dbTask, backendTask, androidTask, qaTask, docsTask] }
    default:
      return { missionTitle: title, assignments: [dbTask, backendTask, androidTask, qaTask, docsTask] }
  }
}

const payload = await readPayload(file)
const dispatch = buildAssignments(payload)
const request = {
  missionTitle: dispatch.missionTitle,
  assignments: dispatch.assignments,
  waitForCheckpoint: false,
  allowAsync: true,
  notifySessionKey: 'family-companion',
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
