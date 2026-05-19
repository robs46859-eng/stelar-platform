---
name: Agent Swarm Design
description: Design and build multi-agent systems with a base agent + specialized role agents architecture.
tags: [agents, swarm, architecture, multi-agent, orchestration, base-agent, role-agents]
created: 2026-05-13
---

# Agent Swarm Design

Designing and building multi-agent systems with a **base agent + specialized role agents** architecture.

## Pattern

1. **Base agent** (`base_agent.py`) — abstract class providing:
   - Standard lifecycle (`initialize`, `execute`, `finalize`)
   - Error handling wrapper (retry + fallback + logging)
   - Shared context access (memory, config, other agents)
   - Role-agnostic orchestration hooks

2. **Specialized agents** — each inherits from the base and owns a domain:
   - Single-responsibility: one agent = one concern (intake, safety, tone, logistics, etc.)
   - Declare capabilities upfront (what they accept, produce, and delegate)
   - Communicate via structured messages / shared state, not direct calls
   - Can escalate to other agents when a request falls outside their scope

3. **Orchestration layer** — routes incoming requests to the right agent:
   - Intake agent acts as triage / router
   - Agents can call peer agents through a shared registry
   - Fallback to human escalation when agent confidence is low

## Key Design Decisions (fscompanion)

- All agents share a common `AgentContext` dataclass (family_id, active memories, config)
- Error handling is centralized in base_agent — specialized agents focus on logic, not boilerplate
- Each agent has a `role` string and `capabilities` set used for routing
- Drift detection agent monitors outputs of other agents for behavioral consistency
- Memory validation agent cross-checks claims across agent outputs

## When to Use

- System requires **multiple AI concerns** (scheduling + emotional support + safety monitoring)
- Concerns have **different data requirements** and **different failure modes**
- You need **graceful degradation** (one agent failing doesn't kill the system)
- Natural routing exists (intake → triage → specialist)

## Pitfalls

- **Avoid circular dependencies** between agents — use the orchestrator to break cycles
- **Don't over-specialize** early — start with 3–4 agents, split later when a single agent has >2 concerns
- **Shared state is the integration surface** — keep it versioned and validated
- **Base agent must handle partial failure** — a crashed logistics agent shouldn't kill the intake flow

## References

- `references/fscompanion-agent-architecture.md` — concrete implementation from the fscompanion project
- `templates/base_agent.py` — starter scaffolding for a new swarm agent