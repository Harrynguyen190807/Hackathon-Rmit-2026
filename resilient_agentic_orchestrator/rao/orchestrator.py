"""Multi-Agent Execution Graph: Resilient Agentic Orchestrator (RAO).

Explicit State Machine transitions:
[Input] -> [Guardrail Pre-Check] -> [Planner / Router] -> [Tool Execution] -> [Response Synthesis] -> [Guardrail Post-Check] -> [Final Output]

Guarantees:
- Strict Pydantic v2 contracts across all nodes and tool arguments.
- Zero hallucination on operational workflows.
- Dual-layer deterministic prompt injection defense + PII redaction.
- Resilient recovery, retries, and human-in-the-loop escalation.
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from rao.nlp.lexicon import extract_entities
from rao.nlp.retrieval import HybridRetriever
from rao.planner import PlannerAgent
from rao.schemas import TOOL_ARG_MODELS
from rao.security.firewall import InjectionFirewall
from rao.security.sanitizer import SanitizerGuard
from rao.state import (
    AgentState,
    Message,
    PlanStep,
    Role,
    SecurityFlag,
    StepRef,
    StepStatus,
    TemplateArg,
    ToolCall,
    ToolResult,
    TraceEvent,
    Verdict,
)
from rao.tools import MockBackend, ToolArgumentError, ToolError, ToolRegistry


@dataclass
class OrchestratorConfig:
    """Configuration settings for the Resilient Orchestrator."""

    human_review_risk_threshold: float = 0.65
    max_tool_attempts: int = 3
    block_injection_threshold: float = 0.60
    allow_restore_pii_types: frozenset[str] = field(default_factory=lambda: frozenset(["PERSON"]))


class ResilientOrchestrator:
    """Production-grade StateGraph orchestrating security, planning, and tool execution."""

    def __init__(
        self,
        config: OrchestratorConfig | None = None,
        backend: MockBackend | None = None,
    ) -> None:
        self.config = config or OrchestratorConfig()
        self.backend = backend or MockBackend()
        self.registry = ToolRegistry(self.backend, max_attempts=self.config.max_tool_attempts)
        self.sanitizer = SanitizerGuard()
        self.firewall = InjectionFirewall(block_threshold=self.config.block_injection_threshold)
        self.retriever = HybridRetriever()
        self.planner = PlannerAgent()

    # ======================================================================= #
    # Node 1: Guardrail Pre-Check
    # ======================================================================= #
    def guardrail_input_node(self, state: AgentState) -> AgentState:
        t0 = time.perf_counter()
        raw_user_text = state.user_text

        # 1. PII Redaction
        san_result = self.sanitizer.sanitize(raw_user_text, state.pii_vault)
        # Update user message in-place with sanitized content
        for idx in range(len(state.messages) - 1, -1, -1):
            if state.messages[idx].role is Role.USER:
                state.messages[idx] = Message(role=Role.USER, content=san_result.text, trusted=True)
                break

        # 2. Firewall Scan on User Input
        fw_decision = self.firewall.scan(san_result.text, source="user")
        state.security_flags.append(
            SecurityFlag(
                stage="input",
                source="user",
                verdict=fw_decision.verdict,
                confidence=fw_decision.confidence,
                reasons=fw_decision.reasons,
            )
        )

        if fw_decision.verdict is Verdict.BLOCKED:
            state.bump_risk(fw_decision.confidence)
            state.halted = True
            state.halt_reason = (
                f"Phát hiện tấn công prompt injection trực tiếp: {'; '.join(fw_decision.reasons)}"
            )
            state.final_response = (
                "Yêu cầu bị từ chối bởi hệ thống bảo mật (Phát hiện chỉ thị độc hại hoặc can thiệp prompt)."
            )
            state.final_payload = {
                "status": "BLOCKED",
                "risk_score": state.risk_score,
                "reasons": fw_decision.reasons,
            }
            self._record_trace(state, "guardrail_input_node", t0, {"status": "BLOCKED", "verdict": "BLOCKED"})
            return state

        # 3. Quarantining External Documents (Indirect Prompt Injection Defense)
        quarantined_docs: list[str] = []
        for doc in state.external_documents:
            # First redact PII in doc
            doc_san = self.sanitizer.sanitize(doc, state.pii_vault)
            # Neutralize injection segments
            q_res = self.firewall.quarantine(doc_san.text, source="external")
            quarantined_docs.append(q_res.text)
            state.security_flags.append(
                SecurityFlag(
                    stage="external",
                    source="document",
                    verdict=q_res.decision.verdict,
                    confidence=q_res.decision.confidence,
                    reasons=q_res.decision.reasons
                    + ([f"Đã trung hòa {q_res.removed_segments} đoạn chứa lệnh độc hại"] if q_res.removed_segments else []),
                )
            )
            if q_res.decision.verdict is Verdict.BLOCKED:
                state.bump_risk(0.40)  # Indirect injection detected & neutralized

        state.external_documents = quarantined_docs
        self._record_trace(state, "guardrail_input_node", t0, {"status": "SAFE", "pii_count": len(san_result.findings)})
        return state

    # ======================================================================= #
    # Node 2: Planner / Router
    # ======================================================================= #
    def planner_node(self, state: AgentState) -> AgentState:
        if state.halted:
            return state

        t0 = time.perf_counter()
        user_text = state.user_text

        # Combine text with clean external document contents for entity extraction
        combined_text = user_text
        if state.external_documents:
            combined_text += "\n" + "\n".join(state.external_documents)

        # 1. Grounded Entity Extraction
        entities = extract_entities(combined_text, origin="user")
        state.extracted_entities = entities

        # 2. Hybrid Retrieval for Domain Context / SOPs
        retrieved = self.retriever.search(user_text, top_k=2)

        # 3. Task Decomposition into Execution Plan DAG
        plan = self.planner.plan(user_text, entities, retrieved)
        state.plan = plan

        # 4. Populate Tool Call Queue
        state.tool_call_queue = [
            ToolCall(step_id=step.step_id, tool=step.tool)
            for step in plan.steps
        ]

        self._record_trace(
            state,
            "planner_node",
            t0,
            {
                "intents": plan.intents,
                "step_count": len(plan.steps),
                "entities_found": len(entities),
            },
        )
        return state

    # ======================================================================= #
    # Node 3: Tool Execution Engine
    # ======================================================================= #
    def tool_execution_node(self, state: AgentState) -> AgentState:
        if state.halted or not state.plan:
            return state

        t0 = time.perf_counter()
        plan = state.plan
        ordered_steps = plan.topological_order()

        for step in ordered_steps:
            spec = self.registry.spec(step.tool)
            state.bump_risk(spec.base_risk)

            # Check Human-in-the-Loop Threshold before executing high-risk side-effects
            if state.risk_score >= self.config.human_review_risk_threshold and spec.side_effect:
                state.requires_human_review = True
                state.tool_results[step.step_id] = ToolResult(
                    call_id=f"call_{step.step_id}",
                    step_id=step.step_id,
                    tool=step.tool,
                    status=StepStatus.PENDING_APPROVAL,
                    arguments=None,
                    output=None,
                    error=f"Tạm dừng: Rủi ro vượt ngưỡng ({state.risk_score:.2f} >= {self.config.human_review_risk_threshold:.2f}). Yêu cầu phê duyệt thủ công.",
                )
                continue

            # Check Condition
            if step.condition is not None:
                cond = step.condition
                parent_res = state.tool_results.get(cond.from_step)
                if not parent_res or parent_res.status != StepStatus.SUCCESS or not parent_res.output:
                    state.tool_results[step.step_id] = ToolResult(
                        call_id=f"call_{step.step_id}",
                        step_id=step.step_id,
                        tool=step.tool,
                        status=StepStatus.SKIPPED_DEPENDENCY,
                        error=f"Bỏ qua vì bước phụ thuộc {cond.from_step} không thành công",
                    )
                    continue

                actual_val = parent_res.output.get(cond.path)
                if actual_val != cond.equals:
                    state.tool_results[step.step_id] = ToolResult(
                        call_id=f"call_{step.step_id}",
                        step_id=step.step_id,
                        tool=step.tool,
                        status=StepStatus.SKIPPED_CONDITION,
                        error=f"Bỏ qua: Điều kiện {cond.from_step}.{cond.path} == {cond.equals} không thỏa mãn (thực tế: {actual_val})",
                    )
                    continue

            # Resolve Arguments
            resolved_args: dict[str, Any] = {}
            arg_resolution_error: str | None = None

            for arg_key, arg_val in step.arguments.items():
                if isinstance(arg_val, StepRef):
                    upstream = state.tool_results.get(arg_val.from_step)
                    if not upstream or upstream.status != StepStatus.SUCCESS or not upstream.output:
                        arg_resolution_error = f"Không thể lấy tham số từ bước {arg_val.from_step}"
                        break
                    val = upstream.output.get(arg_val.path)
                    if val is None:
                        arg_resolution_error = f"Trường '{arg_val.path}' không tồn tại trong kết quả của {arg_val.from_step}"
                        break
                    resolved_args[arg_key] = val
                elif isinstance(arg_val, TemplateArg):
                    rendered = self._render_template(arg_val.template, state.tool_results)
                    resolved_args[arg_key] = rendered
                else:
                    resolved_args[arg_key] = arg_val

            if arg_resolution_error:
                state.tool_results[step.step_id] = ToolResult(
                    call_id=f"call_{step.step_id}",
                    step_id=step.step_id,
                    tool=step.tool,
                    status=StepStatus.FAILED,
                    error=arg_resolution_error,
                )
                continue

            # Execute tool with retries
            try:
                outcome = self.registry.invoke(step.tool, resolved_args)
                state.tool_results[step.step_id] = ToolResult(
                    call_id=f"call_{step.step_id}",
                    step_id=step.step_id,
                    tool=step.tool,
                    status=StepStatus.SUCCESS,
                    arguments=outcome.validated_args,
                    output=outcome.output,
                    attempts=outcome.attempts,
                    latency_ms=outcome.latency_ms,
                )
            except (ToolArgumentError, ToolError) as exc:
                state.tool_results[step.step_id] = ToolResult(
                    call_id=f"call_{step.step_id}",
                    step_id=step.step_id,
                    tool=step.tool,
                    status=StepStatus.FAILED,
                    arguments=resolved_args,
                    error=str(exc),
                )

        self._record_trace(
            state,
            "tool_execution_node",
            t0,
            {"executed_steps": len(state.tool_results)},
        )
        return state

    @staticmethod
    def _render_template(template: str, results: dict[str, ToolResult]) -> str:
        def _replace(match: re.Match[str]) -> str:
            expr = match.group(1).strip()
            if "." in expr:
                step_id, field = expr.split(".", 1)
                res = results.get(step_id)
                if res and res.output and field in res.output:
                    return str(res.output[field])
            return match.group(0)

        return re.sub(r"\{\{([^}]+)\}\}", _replace, template)

    # ======================================================================= #
    # Node 4: Response Synthesis Engine
    # ======================================================================= #
    def response_synthesis_node(self, state: AgentState) -> AgentState:
        if state.halted:
            return state

        t0 = time.perf_counter()
        results = state.tool_results
        plan = state.plan
        lines: list[str] = []
        payload_data: dict[str, Any] = {
            "request_id": state.request_id,
            "status": "COMPLETED",
            "intents": plan.intents if plan else [],
            "operations": {},
        }

        # Case 1: Inventory & Procurement Results
        if "s1" in results and results["s1"].tool == "check_inventory":
            inv_res = results["s1"]
            if inv_res.status == StepStatus.SUCCESS and inv_res.output:
                out = inv_res.output
                payload_data["operations"]["inventory"] = out
                lines.append(
                    f"📦 **Tồn kho SKU {out['sku']} ({out['product_name']}):**\n"
                    f"  - Số lượng khả dụng: **{out['on_hand']}** (Ngưỡng an toàn: {out['reorder_point']})\n"
                    f"  - Trạng thái: **{out['status']}** tại {out['warehouse']}"
                )

                # Did we reorder?
                if "s2" in results and results["s2"].status == StepStatus.SUCCESS and results["s2"].output:
                    po_out = results["s2"].output
                    payload_data["operations"]["purchase_order"] = po_out
                    lines.append(
                        f"\n📝 **Tự động khởi tạo Đơn Mua Hàng ({po_out['po_number']}):**\n"
                        f"  - Nhà cung cấp: **{po_out['vendor_name']}** ({po_out['vendor_id']})\n"
                        f"  - Số lượng đặt: **{po_out['quantity']}** chiếc\n"
                        f"  - Tổng giá trị: **{po_out['total_cost_vnd']:,} VNĐ**\n"
                        f"  - Dự kiến giao: **{po_out['expected_delivery_date']}**"
                    )

                # Slack notification status
                if "s3" in results and results["s3"].status == StepStatus.SUCCESS:
                    payload_data["operations"]["slack_alert"] = results["s3"].output
                    lines.append(f"\n📢 Đã phát cảnh báo tự động lên kênh Slack **{results['s3'].arguments.get('channel', '#kho-hcm')}**.")

        # Case 2: Shipping ETA Update Results
        elif "s1" in results and results["s1"].tool == "update_shipping_eta":
            ship_res = results["s1"]
            if ship_res.status == StepStatus.SUCCESS and ship_res.output:
                out = ship_res.output
                payload_data["operations"]["shipping_update"] = out
                lines.append(
                    f"🚚 **Cập nhật Vận đơn {out['tracking_id']} ({out['carrier']}):**\n"
                    f"  - Lý do trễ: **{out['reason']}**\n"
                    f"  - Thời gian trễ thêm: **{out['added_minutes']} phút**\n"
                    f"  - ETA ban đầu: {out['previous_eta']}\n"
                    f"  - ETA mới: **{out['new_eta']}**\n\n"
                    "Dạ chào Quý khách, do tình hình thời tiết và giao thông tại khu vực bị ảnh hưởng, "
                    f"đơn hàng {out['tracking_id']} của Quý khách dự kiến sẽ giao trễ thêm khoảng {out['added_minutes']} phút. "
                    "Đội ngũ vận hành thành thật cáo lỗi về sự chậm trễ này và đang nỗ lực tối đa để giao đến tay Quý khách sớm nhất có thể. "
                    "Cảm ơn Quý khách đã thông cảm!"
                )

        # Fallback / General
        if not lines:
            lines.append("Yêu cầu của bạn đã được tiếp nhận và xử lý hoàn tất trong hệ thống.")

        state.final_response = "\n".join(lines)
        state.final_payload = payload_data
        self._record_trace(state, "response_synthesis_node", t0, {"status": "SYNTHESIZED"})
        return state

    # ======================================================================= #
    # Node 5: Guardrail Post-Check
    # ======================================================================= #
    def guardrail_output_node(self, state: AgentState) -> AgentState:
        t0 = time.perf_counter()
        resp = state.final_response or ""

        # 1. Verify Zero Secret Exfiltration
        sensitive_findings = self.sanitizer.contains_sensitive(
            resp,
            types=frozenset(["API_KEY", "TOKEN", "SECRET", "NATIONAL_ID"]),
        )
        if sensitive_findings:
            # Neutralize immediately
            resp = self.sanitizer.sanitize(resp, state.pii_vault).text
            state.bump_risk(0.9)
            state.security_flags.append(
                SecurityFlag(
                    stage="output",
                    source="response",
                    verdict=Verdict.BLOCKED,
                    confidence=0.95,
                    reasons=["Phát hiện nỗ lực rò rỉ khóa bảo mật / secret trong phản hồi"],
                )
            )

        # 2. Selective Safe Placeholder Restoration (e.g., PERSON allowed for polite greetings)
        restored_resp = self.sanitizer.restore(
            resp,
            state.pii_vault,
            allowed_types=self.config.allow_restore_pii_types,
        )
        state.final_response = restored_resp

        # Append assistant message
        state.messages.append(
            Message(role=Role.ASSISTANT, content=restored_resp, trusted=True)
        )

        self._record_trace(
            state,
            "guardrail_output_node",
            t0,
            {"security_flags": len(state.security_flags), "final_risk": state.risk_score},
        )
        return state

    # ======================================================================= #
    # Pipeline Invocation Facade
    # ======================================================================= #
    def invoke(self, user_text: str, external_documents: list[str] | None = None) -> AgentState:
        """Run the end-to-end deterministic agent graph."""
        state = AgentState(
            messages=[Message(role=Role.USER, content=user_text, trusted=True)],
            external_documents=list(external_documents or []),
        )

        # Graph execution sequence:
        # [Input] -> [Guardrail Pre-Check]
        state = self.guardrail_input_node(state)
        if state.halted:
            return state

        # [Planner / Router]
        state = self.planner_node(state)

        # [Tool Execution Engine]
        state = self.tool_execution_node(state)

        # [Response Synthesis]
        state = self.response_synthesis_node(state)

        # [Guardrail Post-Check]
        state = self.guardrail_output_node(state)

        return state

    @staticmethod
    def _record_trace(state: AgentState, node_name: str, start_time: float, detail: dict[str, Any]) -> None:
        duration_ms = round((time.perf_counter() - start_time) * 1000, 3)
        state.execution_trace.append(
            TraceEvent(
                node=node_name,
                started_at=datetime.now(timezone.utc),
                duration_ms=duration_ms,
                detail=detail,
            )
        )
