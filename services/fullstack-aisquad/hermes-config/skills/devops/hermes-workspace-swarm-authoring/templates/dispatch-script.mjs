#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const WORKSPACE_URL = process.env.WORKSPACE_URL || 'http://127.0.0.1:3000'

function usage() {
  console.error('Usage: node scripts/<category>-trigger-dispatch.mjs [--dry-run] <payload.json | ->')
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
  return `\n\nRules:\n- Draft all external-facing work; do not publish, post, send, or distribute without explicit human greenlight.\n- Put artifacts under memory/<category>/ when you create files.\n- Return the required checkpoint format with proof and next action.`
}

function buildAssignments(payload) {
  const type = oneLine(payload.type || payload.trigger || payload.event?.type || 'manual')
  const body = pretty(payload)
  const rawTitle = oneLine(payload.content?.topic || payload.feature?.name || payload.content?.title || 'untitled')
  const title = `<Category> trigger: ${type}${rawTitle ? \` - \${rawTitle}\` : ''}`
  const context = `Trigger payload:\n${body}`
  const rules = commonRules()

  switch (type) {
    // Add cases for each trigger type defined in trigger-map.yaml
    // case 'trigger_type_1':
    //   return { missionTitle: title, assignments: [
    //     task('worker-id', `${context}\n\n<worker task description>.${rules}`, '<worker rationale>.'),
    //   ] }
    default:
      return { missionTitle: title, assignments: [
        task('<category>-orchestrator', `${context}\n\nClassify this trigger and route it to the right workers.${rules}`, 'Orchestrator handles unknown triggers.'),
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
  notifySessionKey: '<category>',
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
