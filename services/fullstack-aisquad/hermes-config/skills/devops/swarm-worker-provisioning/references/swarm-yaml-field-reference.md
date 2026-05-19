# swarm.yaml Worker Field Reference

Captured from a 27-worker Hermes Workspace swarm.yaml (revenue + media + base workers). Every worker entry must include these fields.

## Required Fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | Lowercase + hyphens, must match profile dir name exactly |
| `name` | string | Display name, Title Case |
| `role` | string | One-line role title (e.g. "Content Pipeline Orchestrator / Greenlight Gate") |
| `specialty` | string | Comma-separated list of specialties |
| `model` | string | Full model identifier, e.g. `openrouter/inclusionai/ring-2.6-1t:free` |
| `mission` | string | One sentence mission statement |
| `profile` | string | MUST equal `id` exactly |
| `modes` | array | Operation modes (e.g. `[route, pipeline]`, `[write, script]`) |
| `tools` | array | Hermes tool names (see below) |
| `skills` | array | Skill names (e.g. `content-writer-core`, `humanizer`, `gstack-for-hermes`) |
| `capabilities` | array | Short capability labels for routing |
| `preferredTaskTypes` | array | Task types this worker prefers |
| `greenlightRequiredFor` | array | Actions requiring human approval |
| `maxConcurrentTasks` | int | Always 1 for non-orchestrator workers |
| `acceptsBroadcast` | bool | Always true |
| `plugins` | array | Usually `[]` |
| `pluginToolsets` | array | Usually `[]` |
| `mcpServers` | array | Server names, e.g. `[gbrain]` or `[]` |
| `wrapper` | string | CLI wrapper name, format `domain:action` |

## Common Greenlight Actions

- `publish`, `external-send`, `public-claim` — media/content workers
- `price-commitment`, `contract`, `customer-commitment` — revenue workers
- `credential-use`, `deploy`, `customer-system-write` — technical workers
- `merge`, `push`, `destructive` — code workers
- `refund`, `discount`, `ad-spend`, `platform-change`

## Common Tools

- Core: `terminal`, `file`, `web`, `browser`, `skills`, `session_search`
- Planning: `todo`, `kanban`, `delegation`, `clarify`
- Automation: `cronjob`
- Media: `vision`
- Orchestration: `delegation` (orchestrator only)

## Worker Role Patterns

**Orchestrator pattern:** Has `task`, `kanban`, `delegation`, `clarify` tools. Routes to other workers, controls greenlight gates, manages pipeline state.

**Researcher pattern:** Has `web`, `browser`, `todo` tools. Produces briefs with source trails and confidence ratings.

**Builder/Producer pattern:** Has `terminal`, `file`, `browser`, `vision` tools. Creates artifacts, demos, or media.

**Reviewer/QA pattern:** Has `terminal`, `file`, `web` tools (no `browser` for pure code review). Gates quality.

**Writer/Copy pattern:** Has `file`, `web`, `browser`, `todo` tools. Produces text drafts.

**Distribution pattern:** Has `file`, `web`, `browser`, `terminal` tools. Prepares channel-specific content.

## Naming Convention

Worker IDs: kebab-case, hyphen-separated (e.g. `content-researcher`)
Wrappers: `<namespace>:<action>` (e.g. `content:research`, `distribution:manage`)
Skills: `<worker-id>-core` (e.g. `content-researcher-core`)
Profiles: `~/.hermes/profiles/<worker-id>/`
