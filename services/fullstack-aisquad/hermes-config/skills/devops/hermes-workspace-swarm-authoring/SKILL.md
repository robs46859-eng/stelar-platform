---
name: hermes-workspace-swarm-authoring
description: Build new Hermes Workspace swarms — workers, skills, profiles, wrappers, triggers, and dispatch scripts following the established pattern.
category: devops
---

# Hermes Workspace Swarm Authoring

Build complete swarm pipelines in the Hermes Workspace. Each swarm is a collection of specialized workers that collaborate on a domain (revenue, media, product, etc.) with trigger-based dispatch.

## Pattern Overview

A swarm requires these components, all aligned to each other:

| Component | Location | Purpose |
|-----------|----------|---------|
| Core skills | `~/.hermes/skills/<category>/<worker-id>-core/SKILL.md` | Worker behavior and procedures |
| swarm.yaml workers | `~/hermes-workspace/swarm.yaml` | Worker definitions in the swarm registry |
| Profile configs | `~/.hermes/profiles/<worker-id>/config.yaml` | Per-model, per-tool, per-agent configuration |
| CLI wrappers | `~/.local/bin/<wrapper-name>` | Shorthand launch: `hermes -p <profile-id>` |
| Trigger system | `~/hermes-workspace/triggers/<category>/trigger-map.yaml` + `templates/*.json` | Event-to-worker routing |
| Dispatch script | `~/hermes-workspace/scripts/<category>-trigger-dispatch.mjs` (or `.py`) | Reads trigger JSON, builds assignments, POSTs to `/api/swarm-dispatch` |
| Agent READMEs | `~/hermes-workspace/agents/<worker-id>/README.md` | Doc mirror of swarm.yaml for each agent |
| AGENTS.md table | `~/hermes-workspace/AGENTS.md` | Roster table with all workers across all swarms |

## Procedure

### Step 1: Create Core Skills

One SKILL.md per worker under `~/.hermes/skills/<category>/<worker-id>-core/`:

```
---
name: <worker-id>-core
description: Use for <specific task class the worker handles>.
---

# <Title Case Worker Name> Core

## Procedure
1. <step 1>
2. <step 2>
...

## Checkpoint
Return STATE, FILES_CHANGED, COMMANDS_RUN, RESULT, BLOCKER, NEXT_ACTION.
```

Naming convention: `<worker-id>-core` (e.g., `product-manager-core`, `media-orchestrator-core`).

### Step 2: Append Workers to swarm.yaml

Each worker entry follows this exact structure:

```yaml
- id: <worker-id>
  name: <Display Name>
  role: <Role title>
  specialty: <one-line specialty>
  model: openrouter/inclusionai/ring-2.6-1t:free
  mission: <one-line mission>
  profile: <worker-id>          # MUST match id
  modes:
  - <mode1>
  - <mode2>
  tools:
  - <tool names matching available toolsets>
  skills:
  - <worker-id>-core            # MUST include own skill
  - <shared skills as needed>
  capabilities:
  - <capability tags>
  preferredTaskTypes:
  - <task type tags>
  greenlightRequiredFor:
  - <actions needing human approval>
  maxConcurrentTasks: 1
  acceptsBroadcast: true
  plugins: []
  pluginToolsets: []
  mcpServers: []
  wrapper: <short-name:action>   # e.g., pm:frame, content:write
```

**Critical rules:**
- `profile` MUST equal `id`
- `wrapper` MUST be unique across all swarms (no collisions)
- Must be valid YAML — no stray characters between entries
- Append after the last existing worker definition (read the tail of swarm.yaml first to find the append point)

### Step 3: Create Profile Directories

For each worker:
```
~/.hermes/profiles/<worker-id>/
├── config.yaml           # Copy from an existing profile (e.g., market-intel)
├── SOUL.md               # Brief: name, profile ID, modes
├── memories/MEMORY.md    # "# Memory for <Name>\n\nNo memories yet."
├── memory/IDENTITY.md    # "# <worker-id>\nProfile: <id>\nWrapper: <wrapper>\nSwarm: <category>"
├── runtime.json          # '{"status": "initialized"}'
├── logs/                 # Empty directory
└── skills/               # Empty directory (for skill symlinks)
```

Copy an existing profile's `config.yaml` verbatim as the baseline. The model should already match the `swarm.yaml` worker definition (ring-2.6-1t:free via openrouter is the default in the workspace).

### Step 4: Create CLI Wrappers

```sh
#!/bin/sh
exec hermes -p <profile-id> "$@"
```

Save to `~/.local/bin/<wrapper-name>` and `chmod +x`.

**Pitfall:** Each wrapper name MUST be globally unique across all swarms. `qa:smoke` (base swarm), `qa:verify` (product swarm), and `qa:gate` (reviewer) are ALL different wrappers pointing to different profiles. Always `ls ~/.local/bin/` and cross-check before creating.

**Important:** When passing prompts or arguments to hermes via wrappers, use the proper CLI syntax:
- For chat: `hermes -p <profile-id> chat -z "your prompt here"`
- For other commands: `hermes -p <profile-id> <command> [options]`
- Do NOT pass raw text as positional arguments after the profile - use the appropriate command flags.

### Step 5: Create Trigger System

**trigger-map.yaml:**
```yaml
version: 1
greenlight: <brief description of approval requirements>
triggers:
  <trigger_type_1>:
  - <worker-id>
  - <worker-id>
  <trigger_type_2>:
  - <worker-id>
  ...
```

**JSON templates** in `triggers/<category>/templates/<kebab-case>.json`:
```json
{
  "type": "<snake_case_trigger_type>",
  "source": "manual | cron | webhook | customer | jira | github",
  "<category_domain>": {},
  "stakeholders": {},
  "notes": ""
}
```

To extend an *existing* swarm with a new trigger: add the entry to `trigger-map.yaml`, create the JSON template, AND update the dispatch script's `buildAssignments()` function with the new `case`.

### Step 6: Create Dispatch Script

Model after existing dispatch scripts. Key sections:
- `commonRules()` — standard greenlight rules
- `buildAssignments(payload)` — switch on trigger type, return `{missionTitle, assignments: [{workerId, task, rationale}]}`
- POST to `${WORKSPACE_URL}/api/swarm-dispatch`
- Support `--dry-run` flag

For cross-swarm pipelines (e.g., domain hunting feeding both product and revenue swarms), create a Python dispatcher that reads the JSON output from an upstream tool, scores/routers, and POSTs dispatch payloads to the appropriate swarm via `/api/swarm-dispatch`.

### Step 7: Create Agent READMEs

```markdown
# <Display Name>

Profile: `<worker-id>`
Wrapper: `<wrapper>`
Modes: <mode1>, <mode2>

## Role
<from swarm.yaml>

## Specialty
<from swarm.yaml>

## Mission
<from swarm.yaml>

## Skills
<comma-separated from swarm.yaml>

## Greenlight Required
<comma-separated from swarm.yaml>

This file mirrors `swarm.yaml` and the profile config under `~/.hermes/profiles/<worker-id>/`.
```

### Step 8: Update AGENTS.md

Add the new workers to the roster table in `AGENTS.md`. Group by swarm:

```markdown
### <Swarm Name> Swarm

| Worker | Wrapper | Tools | Skills | MCP |
|---|---|---|---|---|
| `<id>` | `<wrapper>` | <tools> | <skills> | <mcp> |
```

## Verification Checklist

After building a swarm, verify:

1. `swarm.yaml` parses as valid YAML: `python3 -c "import yaml; d=yaml.safe_load(open('path/to/swarm.yaml')); workers=d.get('workers',[]) if isinstance(d,dict) else data; print(len(workers))"`
2. All worker `id` values appear in swarm
3. All worker `profile` values match their `id`
4. All `<id>-core` skills exist in `~/.hermes/skills/<category>/`
5. All profiles have `config.yaml`
6. All wrappers exist, are executable — `ls ~/.local/bin/` — and have unique names
7. Trigger map YAML is valid and references worker IDs that exist
8. All trigger templates are valid JSON
9. Dispatch script runs with `--dry-run` for each template
10. AGENTS.md updated with the new roster
11. If extending an existing swarm's triggers, the dispatch script's `buildAssignments()` includes the new `case`

## Pitfalls

**swarm.yaml structure:** The file uses `{version: N, workers: [...]}` not a top-level list. Parse with `yaml.safe_load(f)['workers']` or `data.get('workers', [])`. Verifying with a root-level `for w in data:` will silently fail and report 0 workers. Always check `type(data)` first — if it's a dict, look for the `workers` key.

**YAML corruption:** patch can insert a stray `|` at the boundary between the old last line and the new worker. Always read lines around the insertion point after patching. Validate with `python3 -c "import yaml; yaml.safe_load(...)"`.

**Wrapper collisions:** `qa:smoke` (base), `qa:verify` (product swarm), and `qa:gate` (reviewer) all coexist. Always `ls ~/.local/bin/` before creating.

**Python JSON template bug:** when writing JSON from Python, use `False`/`True` (Python), not `false`/`true` (JSON literal). Python interprets `false` as undefined variable.

**Missing dispatch case when extending triggers:** adding a trigger type to `trigger-map.yaml` without adding the corresponding `case` in the dispatch script's `buildAssignments()` means the trigger silently routes to default. Always update both files and verify with `--dry-run`.

**Scrape-based domain sources are dead:** expireddomains.net, NameJet, DropCatch, SnapNames, GoDaddy Auctions, and all major expired-domain scrapers return 0 results or 403s. The reliable approach is **proactive name generation** (combine trending keywords, commercial prefixes/suffixes, brandable syllable combos) + **RDAP availability checking** (free, no key, reliable for 12+ TLDs). Build a generation engine rather than scraping.

**RDAP reliability:** `rdap.verisign.com` (.com/.net), `rdap.nic.io/domain/` (.io), `rdap.nic.ai/domain/` (.ai), `rdap.nic.google/rdap/domain/` (.app/.dev), `rdap.nic.co/domain/` (.co), and others all work without API keys. HTTP 404 = available, 200 = taken.

**Sleeping agents:** To pause a worker without deleting it, add `status: sleeping` and a `notes` field. The worker remains in swarm.yaml and the profile stays intact. Reactivate by removing the `status` field. Example:
```yaml
- id: market-intel
  status: sleeping
  notes: B2B swarm paused. B2C focus takes priority.
  # ... all other fields unchanged
```
**Do NOT** set wrapper to something else or change the worker id.

**swarm.yaml structure:** The file uses `{version: N, workers: [...]}` not a top-level list.
 Do NOT set wrapper to something else or change the worker id. The worker remains in swarm.yaml and the profile stays intact. Reactivate by removing the `status` field. Example:
```yaml
- id: market-intel
  status: sleeping
  notes: B2B swarm paused. B2C focus takes priority.
  # ... all other fields unchanged
```

**Python dispatch scripts (vs MJS):** Some swarms use Python (`.py`) dispatch scripts instead of JavaScript (`.mjs`). The engagement swarm uses `engagement-trigger-dispatch.py`. Python dispatch scripts accept `--stdin` or `--json FILE` flags and support `--dry-run`. They POST the same payload to `/api/swarm-dispatch` but with `trigger` and `payload` keys instead of a `message` object. The dispatch logic uses a `ROUTING` dict mapping trigger type strings to worker ID lists.

**Cross-swarm triggers:** Triggers can route to workers in different swarms. Example: the `domain_acquisition` trigger routes from the product swarm trigger-map to both product workers (product-manager, brand-visionary) AND the revenue swarm's brand-visionary. The dispatch script can post to multiple swarm endpoints. When adding cross-swarm triggers, ensure both swarms' trigger-maps and both dispatch scripts handle the new trigger type.

**Credential management for swarm agents:** Store platform credentials (API keys, passwords, tokens) as `.credentials-*.json` files in `~/hermes-workspace/` with `chmod 600` permissions. Add `*.credentials-*.json` to `.gitignore`. Never store credentials in environment variables long-term; read from the credential file at runtime. Each agent's profile can reference its credential file in its SOUL.md or IDENTITY.md.
