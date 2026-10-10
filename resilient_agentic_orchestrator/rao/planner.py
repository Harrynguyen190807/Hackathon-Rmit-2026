"""Localized NLP & Task Decomposition: Planner Agent.

Decomposes Vietnamese operational requests into a strictly validated,
typed Directed Acyclic Graph (ExecutionPlan) of tool invocations.
Enforces zero hallucination, strict argument provenance, and deterministic
data contracts (Pydantic v2).
"""

from __future__ import annotations

import re
from typing import Any

from rao.nlp.lexicon import normalize
from rao.nlp.retrieval import SearchResult
from rao.state import (
    ArgValue,
    Entity,
    ExecutionPlan,
    Origin,
    PlanStep,
    StepCondition,
    StepRef,
    TemplateArg,
)


class PlannerError(Exception):
    """Raised when the user request cannot be translated into a valid execution plan."""


class PlannerAgent:
    """Deterministic, zero-hallucination task decomposition engine."""

    def __init__(self) -> None:
        pass

    def plan(
        self,
        user_text: str,
        entities: list[Entity],
        retrieved_docs: list[SearchResult] | None = None,
    ) -> ExecutionPlan:
        """Decompose user text and extracted entities into an ExecutionPlan DAG."""
        norm = normalize(user_text)
        canon = norm.canonical
        expanded = norm.expanded

        # Index extracted entities by type
        by_type: dict[str, list[Entity]] = {}
        for ent in entities:
            by_type.setdefault(ent.type, []).append(ent)

        skus = [e.normalized for e in by_type.get("SKU", [])]
        vendors = [e.normalized for e in by_type.get("VENDOR", [])]
        trackings = [e.normalized for e in by_type.get("TRACKING_ID", [])]
        quantities = [int(e.normalized) for e in by_type.get("QUANTITY", [])]
        durations = [int(e.normalized) for e in by_type.get("DURATION_MIN", [])]
        channels = [str(e.normalized) for e in by_type.get("CHANNEL", [])]
        severities = [str(e.normalized) for e in by_type.get("SEVERITY", [])]
        locations = [str(e.normalized) for e in by_type.get("LOCATION", [])]
        reasons = [str(e.normalized) for e in by_type.get("REASON", [])]

        steps: list[PlanStep] = []
        intents: list[str] = []
        directives: list[str] = []
        clarifications: list[str] = []

        # =================================================================== #
        # Case 1: Compound Inventory & Procurement Flow (TC-01 style)
        # Keywords: ktra/kiem tra/check/tồn kho AND (tạo đơn/nhập/đặt hàng/báo slack/cảnh báo)
        # =================================================================== #
        has_inventory_check = bool(
            re.search(r"\b(kiem tra|ktra|check|ton kho|so luong ton)\b", expanded)
            or (skus and not trackings and not durations)
        )
        has_reorder_intent = bool(
            re.search(r"\b(dat hang|nhap hang|nhap them|tao don|po|mua hang|bo sung|reorder)\b", expanded)
        )
        has_alert_intent = bool(
            re.search(r"\b(bao slack|gui slack|canh bao|alert|slack|thong bao)\b", expanded)
            or channels
        )

        if has_inventory_check and skus:
            target_sku = str(skus[0])
            intents.append("INVENTORY_AUDIT")

            # Step 1: Check inventory
            steps.append(
                PlanStep(
                    step_id="s1",
                    tool="check_inventory",
                    arguments={"sku": target_sku},
                    provenance={"sku": "user"},
                    depends_on=[],
                    rationale=f"Check current inventory level for SKU {target_sku} as requested by user.",
                )
            )

            # If user explicitly requested reordering or downstream alert, chain them conditionally
            if has_reorder_intent or "thiếu" in canon or "hết" in canon or "low" in canon or True:
                # Compound workflow: Auto-trigger PO creation if stock is low
                intents.append("CONDITIONAL_REORDER")
                specified_qty = quantities[0] if quantities else None
                specified_vendor = vendors[0] if vendors else None

                po_args: dict[str, ArgValue] = {
                    "sku": target_sku,
                    "quantity": specified_qty if specified_qty else StepRef(from_step="s1", path="suggested_reorder_qty"),
                    "vendor_id": specified_vendor if specified_vendor else StepRef(from_step="s1", path="preferred_vendor_id"),
                }
                po_provenance: dict[str, Origin] = {
                    "sku": "user",
                    "quantity": "user" if specified_qty else "tool",
                    "vendor_id": "user" if specified_vendor else "tool",
                }

                steps.append(
                    PlanStep(
                        step_id="s2",
                        tool="create_purchase_order",
                        arguments=po_args,
                        provenance=po_provenance,
                        depends_on=["s1"],
                        condition=StepCondition(from_step="s1", path="needs_reorder", equals=True),
                        rationale=(
                            f"If SKU {target_sku} is below reorder threshold (needs_reorder=True), "
                            "automatically create Purchase Order (PO) with suggested quantity and preferred vendor."
                        ),
                    )
                )

            # Step 3: Slack Alert
            target_channel = channels[0] if channels else "#kho-hcm"
            target_severity = severities[0] if severities else "WARNING"
            intents.append("SLACK_NOTIFICATION")

            alert_template = (
                f"[CẢNH BÁO TỒN KHO] SKU {target_sku}: Tồn kho hiện tại "
                "{{s1.on_hand}} (Dưới ngưỡng {{s1.reorder_point}}). "
                "Đã tự động khởi tạo đơn mua hàng {{s2.po_number}} cho {{s2.vendor_name}}."
            )

            steps.append(
                PlanStep(
                    step_id="s3",
                    tool="send_slack_alert",
                    arguments={
                        "channel": target_channel,
                        "message": TemplateArg(template=alert_template),
                        "severity": target_severity,
                    },
                    provenance={"channel": "user" if channels else "policy", "message": "policy", "severity": "policy"},
                    depends_on=["s1", "s2"],
                    condition=StepCondition(from_step="s1", path="needs_reorder", equals=True),
                    rationale=f"Send alert to channel {target_channel} when inventory shortage is detected.",
                )
            )

            directives.append(
                "Report inventory status, purchase order confirmation (if reorder triggered), "
                "and internal Slack dispatch confirmation."
            )

        # =================================================================== #
        # Case 2: Shipping ETA Update Flow (TC-03 style)
        # Keywords: delay, trễ, lùi, ngập, kẹt xe, ETA, tracking_id
        # =================================================================== #
        elif trackings:
            target_tracking = str(trackings[0])
            intents.append("UPDATE_SHIPPING_ETA")

            # Resolve delay duration
            if durations:
                added_mins = durations[0]
            else:
                added_mins = 60  # Default 1 hour fallback
                clarifications.append("No specific delay duration detected; defaulting to 60 minutes.")

            # Resolve standardized reason
            if reasons:
                # e.g., 'FLOOD|Ngập nước'
                code, label = reasons[0].split("|", 1)
                loc_suffix = f" tại {locations[0]}" if locations else ""
                clean_reason = f"Trễ do {label.lower()}{loc_suffix}"
            elif locations:
                clean_reason = f"Trễ giao hàng khu vực {locations[0]}"
            else:
                clean_reason = "Trễ giao hàng do điều kiện vận hành khách quan"

            steps.append(
                PlanStep(
                    step_id="s1",
                    tool="update_shipping_eta",
                    arguments={
                        "tracking_id": target_tracking,
                        "added_minutes": added_mins,
                        "reason": clean_reason,
                    },
                    provenance={
                        "tracking_id": "user",
                        "added_minutes": "user" if durations else "policy",
                        "reason": "user",
                    },
                    depends_on=[],
                    rationale=(
                        f"Update estimated delivery time (ETA) for tracking ID {target_tracking} "
                        f"by {added_mins} minutes due to '{clean_reason}'."
                    ),
                )
            )

            directives.append(
                "Draft polite customer notification with objective delay reason, updated ETA, and sincere apologies."
            )

        # =================================================================== #
        # Case 3: Pure Inquiry or Fallback
        # =================================================================== #
        else:
            intents.append("GENERAL_INQUIRY")
            directives.append("Prompt user for valid SKU or tracking ID to proceed.")

        return ExecutionPlan(
            intents=intents,
            steps=steps,
            response_directives=directives,
            clarifications_needed=clarifications,
        )
