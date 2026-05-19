# fscompanion Agent Swarm — Concrete Implementation

## Base Agent (`src/agents/base_agent.py`)

- Abstract class with `__init_subclass__` to auto-register in the swarm registry
- Lifecycle: `initialize() → execute() → finalize()` — each can be overridden
- Error wrapper: `safe_execute()` wraps `execute()` with retry (3x), fallback, and structured logging
- Agents declare `role: str` and `capabilities: set[str]` class attributes for routing

## Agent Registry

- Global `SwarmRegistry` singleton maps `role` string → agent class
- Intake agent queries registry to route requests: `registry.find(capability="scheduling")`
- Agents can also directly reference siblings: `self.registry.get("safety_auditor")`

## Specialized Agents (10)

| Agent | Role String | Key Capability |
|-------|------------|----------------|
| Intake | `intake` | `route_request`, `triage` |
| Support | `support` | `emotional_support`, `resource_generation` |
| Tone | `tone` | `adapt_style`, `persona_switching` |
| Logistics | `logistics` | `scheduling`, `task_assignment`, `optimization` |
| Relationship | `relationship` | `relational_dynamics`, `intervention_suggestion` |
| Resource | `resource` | `external_discovery`, `medical_legal_financial` |
| Safety Auditor | `safety_auditor` | `risk_monitoring`, `zone_enforcement` |
| Drift Watcher | `drift_watcher` | `behavioral_drift_detection`, `cross_agent_monitoring` |
| Memory Validator | `memory_validator` | `contradiction_detection`, `accuracy_scoring` |
| Gemma Router | `gemma_router` | `model_selection`, `tone_routing`, `prompt_selection` |

## Shared Context

```python
@dataclass
class AgentContext:
    family_id: UUID
    active_memories: list[Memory]
    config: dict
    active_agents: dict[str, BaseAgent]
    timestamp: datetime
```

## Integration Points

- Agents publish events to a shared `EventBus` (asyncio)
- Safety agent subscribes to all high-risk events
- Memory validator subscribes to all memory-write events
- Drift watcher subscribes to all agent-output events

## Lessons Learned

- Start with base agent + 3 specialists, expand later
- Error handling in base prevents cascading failures
- Shared context dataclass avoids passing 5+ params to every method
- Capability-based routing is more flexible than role-based routing alone