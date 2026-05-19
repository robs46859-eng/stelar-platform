---
name: swarm-worker-provisioning
description: Add new swarm workers to Hermes Workspace — skills, profiles, wrappers, triggers, dispatch scripts, and agent docs.
---

# Swarm Worker Provisioning

When adding new workers to `~/hermes-workspace`, you must keep six artifacts aligned: `swarm.yaml`, `~/.hermes/skills/`, `~/.hermes/profiles/`, `~/.local/bin/` wrappers, `triggers/` directory, and `agents/` READMEs.

## Procedure

### 1. Define the worker
Pick id, name, role, specialty, mission, modes, tools, skills, capabilities, preferredTaskTypes, greenlightRequiredFor, and wrapper name (format: `domain:action` e.g. `media:orchestrate`).

### 2. Append to swarm.yaml
Append a full worker block to `~/hermes-workspace/swarm.yaml`. Must be valid YAML -- verify with `python3 -c "import yaml; yaml.safe_load(open(...))"` after patching.

Required fields per worker:
```yaml
- id: worker-id
  name: Display Name
  role: Role / Title
  specialty: comma-separated specialties
  model: openrouter/...
  mission: One-line mission sentence.
  profile: worker-id   # MUST match id exactly
  modes: [mode1, mode2]
  tools: [tool1, tool2]
  skills: [skill1-core, skill2]
  capabilities: [cap1, cap2]
  preferredTaskTypes: [type1, type2]
  greenlightRequiredFor: [action1, action2]
  maxConcurrentTasks: 1
  acceptsBroadcast: true
  plugins: []
  pluginToolsets: []
  mcpServers: []
  wrapper: domain:action
```

### 3. Create the core skill
```
~/.hermes/skills/media/<worker-id>-core/SKILL.md   (or your category dir)
```
Frontmatter must include `name` and `description`. Body should include `## Procedure` with numbered steps and an `## Output Shape` section.

### 4. Create the profile
```
~/.hermes/profiles/<worker-id>/config.yaml        # Copy from an existing profile (market-intel is a good baseline)
~/.hermes/profiles/<worker-id>/SOUL.md            # Role description
~/.hermes/profiles/<worker-id>/memories/MEMORY.md
~/.hermes/profiles/<worker-id>/memory/IDENTITY.md
~/.hermes/profiles/<worker-id>/runtime.json        # {"status": "initialized"}
~/.hermes/profiles/<worker-id>/logs/              # (empty dir)
```
The `config.yaml` profile copy MUST have the correct `model.default` and `model.provider` matching the swarm.yaml entry.

### 5. Create the CLI wrapper
```
~/.local/bin/<wrapper-name>
```
Content:
```sh
#!/bin/sh
exec hermes -p <worker-id> "$@"
```
Then `chmod +x`. The wrapper name MUST match `swarm.yaml` worker's `wrapper` field exactly.

### 6. Create trigger infrastructure (optional but recommended)
For any swarm with event-driven workflows:

```
~/hermes-workspace/triggers/<swarm-name>/README.md
~/hermes-workspace/triggers/<swarm-name>/trigger-map.yaml
~/hermes-workspace/triggers/<swarm-name>/templates/<trigger-1>.json
...
~/hermes-workspace/scripts/<swarm-name>-trigger-dispatch.mjs
```

**trigger-map.yaml format:**
```yaml
version: 1
greenlight: Human-readable greenlight summary.
triggers:
  trigger_type_name:
  - worker-id-1
  - worker-id-2
```

**trigger template format:**
```json
{"type": "trigger_type_name", "source": "manual|cron|webhook", "content": {}, "channel": "", "notes": ""}
```

**dispatch script:** Mirror `scripts/revenue-trigger-dispatch.mjs`. Key elements:
- Read JSON payload, map trigger type to worker assignments
- Inject `commonRules()` text into each task
- POST to `${WORKSPACE_URL}/api/swarm-dispatch`
- Support `--dry-run` flag
- Use `notifySessionKey` matching the swarm name

### 7. Create agent README
```
~/hermes-workspace/agents/<worker-id>/README.md
```
Mirrors swarm.yaml fields. This file is user-facing documentation.

### 8. Update AGENTS.md
Add the new worker to the roster table in `~/hermes-workspace/AGENTS.md`.

## Verification checklist
1. `swarm.yaml` parses as valid YAML
2. Worker `profile` field matches `id`
3. Worker `wrapper` field matches file in `~/.local/bin/`
4. Wrapper content: `exec hermes -p <id> "$@"`
5. Skill file exists at `~/.hermes/skills/<cat>/<id>-core/SKILL.md`
6. Profile `config.yaml` exists and is valid YAML
7. Trigger templates (if any) parse as valid JSON
8. Map between trigger-map.yaml and swarm.yaml: every worker in `triggers.*` exists as a worker id in swarm.yaml
9. Dry-run dispatch returns valid JSON with `missionTitle`, `assignments`, `notifySessionKey`

## Alignment rules
- Keep `swarm.yaml`, profile `config.yaml`, profile core skills, and wrappers aligned when changing a worker.
- `profile` MUST equal `id` exactly (lowercase, hyphens).
- `wrapper` pattern is `<domain>:<action>` matching the swarm's namespace.
- Greenlight in worker definition must also be documented in the trigger README and dispatch script's commonRules().

## Pitfalls
- YAML patch with `---` style can inject stray `|` literal block indicators. Always validate YAML after patching.
- If swarm.yaml reaches ~1000+ lines, patch errors become harder to debug. Consider writing the full file via python script instead of patch.
- Profile config.yaml is large (~500 lines). Copy from an existing working profile rather than building from scratch.
- Workers with `gbrain` MCP need `mcpServers: [gbrain]` in swarm.yaml AND the profile config must have gbrain configured.
