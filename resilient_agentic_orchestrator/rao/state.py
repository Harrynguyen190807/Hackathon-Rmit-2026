"""Global agent state and inter-agent message contracts (Pydantic v2)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from rao.schemas import ToolName

Origin = Literal["user", "external", "tool", "policy"]


class Role(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class Message(BaseModel):
    """A single conversational message. ``trusted=False`` marks data-only content."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    role: Role
    content: str
    trusted: bool = True
    name: str | None = None


# --------------------------------------------------------------------------- #
# Security
# --------------------------------------------------------------------------- #
class Verdict(str, Enum):
    SAFE = "SAFE"
    BLOCKED = "BLOCKED"


class SecurityFlag(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    stage: Literal["input", "external", "tool", "output"]
    source: str
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    reasons: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# NLP entities
# --------------------------------------------------------------------------- #
EntityType = Literal[
    "SKU",
    "PRODUCT",
    "VENDOR",
    "TRACKING_ID",
    "QUANTITY",
    "DURATION_MIN",
    "CHANNEL",
    "SEVERITY",
    "LOCATION",
    "REASON",
]


class Entity(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    type: EntityType
    surface: str = Field(description="Text as it appeared in the (sanitized) input")
    normalized: str | int
    origin: Origin = "user"


# --------------------------------------------------------------------------- #
# Plan / DAG
# --------------------------------------------------------------------------- #
class StepRef(BaseModel):
    """Reference to a field of an upstream step output, e.g. ``s1.preferred_vendor_id``."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    from_step: str
    path: str


class TemplateArg(BaseModel):
    """String template rendered from upstream outputs: ``"Tồn {{s1.on_hand}}"``."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    template: str


ArgValue = StepRef | TemplateArg | bool | int | str


class StepCondition(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    from_step: str
    path: str
    equals: bool | int | str


class StepStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED_CONDITION = "SKIPPED_CONDITION"
    SKIPPED_DEPENDENCY = "SKIPPED_DEPENDENCY"
    PENDING_APPROVAL = "PENDING_APPROVAL"


class PlanStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step_id: str = Field(pattern=r"^s\d{1,3}$")
    tool: ToolName
    arguments: dict[str, ArgValue]
    provenance: dict[str, Origin] = Field(default_factory=dict)
    depends_on: list[str] = Field(default_factory=list)
    condition: StepCondition | None = None
    rationale: str


class ExecutionPlan(BaseModel):
    """A validated Directed Acyclic Graph of tool invocations."""

    model_config = ConfigDict(extra="forbid")

    intents: list[str] = Field(default_factory=list)
    steps: list[PlanStep] = Field(default_factory=list)
    response_directives: list[str] = Field(default_factory=list)
    clarifications_needed: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_dag(self) -> "ExecutionPlan":
        ids = [s.step_id for s in self.steps]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate step_id in plan")
        known = set(ids)
        for step in self.steps:
            for dep in step.depends_on:
                if dep not in known:
                    raise ValueError(f"{step.step_id} depends on unknown step {dep}")
                if dep == step.step_id:
                    raise ValueError(f"{step.step_id} depends on itself")
            referenced = {v.from_step for v in step.arguments.values() if isinstance(v, StepRef)}
            if step.condition is not None:
                referenced.add(step.condition.from_step)
            missing = referenced - set(step.depends_on)
            if missing:
                raise ValueError(f"{step.step_id} references {sorted(missing)} without declaring depends_on")
        self.topological_order()  # raises on cycles
        return self

    def topological_order(self) -> list[PlanStep]:
        """Kahn's algorithm, stable with respect to declaration order."""
        by_id = {s.step_id: s for s in self.steps}
        indegree = {s.step_id: len(s.depends_on) for s in self.steps}
        children: dict[str, list[str]] = {s.step_id: [] for s in self.steps}
        for s in self.steps:
            for dep in s.depends_on:
                children[dep].append(s.step_id)
        ready = [s.step_id for s in self.steps if indegree[s.step_id] == 0]
        order: list[PlanStep] = []
        while ready:
            current = ready.pop(0)
            order.append(by_id[current])
            for child in children[current]:
                indegree[child] -= 1
                if indegree[child] == 0:
                    ready.append(child)
        if len(order) != len(self.steps):
            raise ValueError("plan contains a cycle")
        return order


# --------------------------------------------------------------------------- #
# Execution
# --------------------------------------------------------------------------- #
class ToolCall(BaseModel):
    model_config = ConfigDict(extra="forbid")

    call_id: str = Field(default_factory=lambda: f"call_{uuid.uuid4().hex[:10]}")
    step_id: str
    tool: ToolName


class ToolResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    call_id: str
    step_id: str
    tool: ToolName
    status: StepStatus
    arguments: dict[str, Any] | None = None
    output: dict[str, Any] | None = None
    error: str | None = None
    attempts: int = 0
    latency_ms: float = 0.0


class TraceEvent(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    node: str
    started_at: datetime
    duration_ms: float
    detail: dict[str, Any] = Field(default_factory=dict)


class AgentState(BaseModel):
    """Single source of truth flowing through the StateGraph."""

    model_config = ConfigDict(extra="forbid", validate_assignment=True)

    request_id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    messages: list[Message] = Field(default_factory=list)
    external_documents: list[str] = Field(default_factory=list, description="Sanitized, quarantined docs")

    plan: ExecutionPlan | None = None
    tool_call_queue: list[ToolCall] = Field(default_factory=list)
    tool_results: dict[str, ToolResult] = Field(default_factory=dict)

    extracted_entities: list[Entity] = Field(default_factory=list)
    security_flags: list[SecurityFlag] = Field(default_factory=list)
    execution_trace: list[TraceEvent] = Field(default_factory=list)

    # Placeholder -> original value. Never serialized, never logged.
    pii_vault: dict[str, str] = Field(default_factory=dict, exclude=True, repr=False)

    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_human_review: bool = False
    halted: bool = False
    halt_reason: str | None = None

    final_response: str | None = None
    final_payload: dict[str, Any] | None = None

    @property
    def user_text(self) -> str:
        for msg in reversed(self.messages):
            if msg.role is Role.USER:
                return msg.content
        return ""

    def bump_risk(self, value: float) -> None:
        """Noisy-OR accumulation keeps the score in [0, 1]."""
        self.risk_score = round(1.0 - (1.0 - self.risk_score) * (1.0 - max(0.0, min(1.0, value))), 4)
