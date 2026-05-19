"""Base agent class for the fscompanion agent swarm."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID
from typing import Any
import logging

logger = logging.getLogger(__name__)


@dataclass
class AgentContext:
    """Shared context passed to all agents in the swarm."""
    family_id: UUID
    active_memories: list[Any] = field(default_factory=list)
    config: dict[str, Any] = field(default_factory=dict)
    active_agents: dict[str, "BaseAgent"] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class SwarmRegistry:
    """Global registry mapping role strings to agent classes."""

    def __init__(self):
        self._agents: dict[str, type["BaseAgent"]] = {}

    def register(self, agent_cls: type["BaseAgent"]) -> None:
        role = getattr(agent_cls, "role", None)
        if role is None:
            raise ValueError(f"Agent {agent_cls.__name__} missing 'role' class attribute")
        self._agents[role] = agent_cls

    def get(self, role: str) -> type["BaseAgent"] | None:
        return self._agents.get(role)

    def find(self, capability: str) -> list[type["BaseAgent"]]:
        return [
            cls for cls in self._agents.values()
            if capability in getattr(cls, "capabilities", set())
        ]

    def __contains__(self, role: str) -> bool:
        return role in self._agents


# Module-level singleton
registry = SwarmRegistry()


class BaseAgent(ABC):
    """Abstract base agent with lifecycle management, error handling, and swarm integration."""

    role: str = "base"
    capabilities: set[str] = set()

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # Auto-register in the swarm registry unless explicitly disabled
        if getattr(cls, "_skip_registry", False):
            return
        registry.register(cls)

    def __init__(self, context: AgentContext):
        self.context = context
        self.context.active_agents[self.role] = self

    async def initialize(self) -> None:
        """Called once before the agent starts processing."""

    @abstractmethod
    async def execute(self, request: dict) -> dict:
        """Main entry point — must be overridden by subclasses."""

    async def finalize(self) -> None:
        """Called once when the agent is shutting down."""

    async def safe_execute(self, request: dict, retries: int = 3) -> dict:
        """Execute with retry, fallback, and structured error handling."""
        last_error = None
        for attempt in range(1, retries + 1):
            try:
                return await self.execute(request)
            except Exception as e:
                last_error = e
                logger.warning(
                    "Agent %s failed (attempt %d/%d): %s",
                    self.role, attempt, retries, e,
                )
                if attempt == retries:
                    break
                await self._backoff(attempt)

        logger.error("Agent %s exhausted retries: %s", self.role, last_error)
        return {
            "status": "error",
            "agent": self.role,
            "error": str(last_error),
            "fallback": True,
        }

    async def _backoff(self, attempt: int) -> None:
        """Exponential backoff between retries."""
        import asyncio
        delay = 0.5 * (2 ** (attempt - 1))
        await asyncio.sleep(delay)

    def delegate(self, role: str, request: dict) -> "BaseAgent":
        """Get a sibling agent from the swarm by role."""
        agent_cls = registry.get(role)
        if agent_cls is None:
            raise ValueError(f"No agent registered with role '{role}'")
        return agent_cls(self.context)