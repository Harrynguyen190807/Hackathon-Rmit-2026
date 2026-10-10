"""Mock operational tools and a strictly-validated tool registry.

The registry is the *only* path through which the executor can produce side
effects: unknown tool names are rejected, arguments are validated against the
strict Pydantic contracts, and results are validated against return types.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any

from pydantic import BaseModel, TypeAdapter, ValidationError

from rao.schemas import (
    TOOL_ARG_MODELS,
    InventoryStatus,
    OrderConfirmation,
    StrictArgs,
    TrackingUpdate,
)

ICT = timezone(timedelta(hours=7), name="ICT")


class ToolError(Exception):
    """Permanent tool failure (bad business input, not found...). Not retried."""


class TransientToolError(ToolError):
    """Retryable failure (timeouts, 5xx, rate limiting)."""


class ToolArgumentError(ToolError):
    """Arguments failed strict schema validation."""


@dataclass(frozen=True)
class _Product:
    name: str
    warehouse: str
    on_hand: int
    reorder_point: int
    target_stock: int
    vendor_id: str
    unit_cost_vnd: int


@dataclass(frozen=True)
class _Shipment:
    carrier: str
    eta: datetime


VENDORS: dict[str, tuple[str, int]] = {
    # vendor_id: (name, lead_time_days)
    "NCC-009": ("Công ty TNHH Phụ Kiện Số Sài Gòn", 3),
    "NCC-017": ("Công ty CP Phân Phối Thiết Bị Miền Nam", 5),
    "NCC-021": ("Công ty TNHH Cáp Mạng Bình Dương", 2),
}


def _default_inventory() -> dict[str, _Product]:
    return {
        "LAP-1001": _Product("Laptop Dell Latitude 5440", "Kho Tân Bình (TP. Hồ Chí Minh)", 12, 50, 150, "NCC-017", 18_500_000),
        "MOU-2040": _Product("Chuột không dây Logitech M331", "Kho Thủ Đức (TP. Hồ Chí Minh)", 340, 100, 400, "NCC-009", 290_000),
        "CAB-3300": _Product("Cáp mạng Cat6 hộp 305m", "Kho Dĩ An (Bình Dương)", 0, 80, 200, "NCC-021", 2_150_000),
        "MON-4410": _Product("Màn hình LG 27 inch 27MP400", "Kho Long Biên (Hà Nội)", 75, 40, 120, "NCC-017", 3_890_000),
    }


def _default_shipments() -> dict[str, _Shipment]:
    return {
        "GHN202610001": _Shipment("Giao Hàng Nhanh", datetime(2026, 10, 10, 14, 0, tzinfo=ICT)),
        "GHTK88001234": _Shipment("Giao Hàng Tiết Kiệm", datetime(2026, 10, 11, 9, 30, tzinfo=ICT)),
        "VTP550012345": _Shipment("Viettel Post", datetime(2026, 10, 12, 16, 0, tzinfo=ICT)),
    }


@dataclass
class MockBackend:
    """Deterministic in-memory backend standing in for ERP / WMS / TMS / Slack."""

    clock: Callable[[], datetime] = lambda: datetime(2026, 10, 10, 8, 0, tzinfo=ICT)
    inventory: dict[str, _Product] = field(default_factory=_default_inventory)
    shipments: dict[str, _Shipment] = field(default_factory=_default_shipments)
    fail_plan: dict[str, int] = field(default_factory=dict)
    slack_outbox: list[dict[str, str]] = field(default_factory=list)
    _po_counter: int = 0

    def _maybe_fail(self, tool: str) -> None:
        remaining = self.fail_plan.get(tool, 0)
        if remaining > 0:
            self.fail_plan[tool] = remaining - 1
            raise TransientToolError(f"{tool}: upstream timeout (simulated)")

    # -- tools ---------------------------------------------------------------
    def check_inventory(self, sku: str) -> InventoryStatus:
        self._maybe_fail("check_inventory")
        product = self.inventory.get(sku)
        if product is None:
            raise ToolError(f"SKU {sku} không tồn tại trong hệ thống WMS")
        if product.on_hand == 0:
            status = "OUT_OF_STOCK"
        elif product.on_hand < product.reorder_point:
            status = "LOW_STOCK"
        else:
            status = "IN_STOCK"
        needs_reorder = product.on_hand < product.reorder_point
        return InventoryStatus(
            sku=sku,
            product_name=product.name,
            warehouse=product.warehouse,
            on_hand=product.on_hand,
            reorder_point=product.reorder_point,
            status=status,
            needs_reorder=needs_reorder,
            suggested_reorder_qty=max(0, product.target_stock - product.on_hand) if needs_reorder else 0,
            preferred_vendor_id=product.vendor_id,
        )

    def create_purchase_order(self, sku: str, quantity: int, vendor_id: str) -> OrderConfirmation:
        self._maybe_fail("create_purchase_order")
        product = self.inventory.get(sku)
        if product is None:
            raise ToolError(f"SKU {sku} không tồn tại")
        vendor = VENDORS.get(vendor_id)
        if vendor is None:
            raise ToolError(f"Nhà cung cấp {vendor_id} chưa được phê duyệt")
        now = self.clock()
        self._po_counter += 1
        return OrderConfirmation(
            po_number=f"PO-{now:%Y%m%d}-{self._po_counter:04d}",
            sku=sku,
            quantity=quantity,
            vendor_id=vendor_id,
            vendor_name=vendor[0],
            status="CREATED",
            total_cost_vnd=quantity * product.unit_cost_vnd,
            expected_delivery_date=(now + timedelta(days=vendor[1])).date(),
        )

    def send_slack_alert(self, channel: str, message: str, severity: str) -> bool:
        self._maybe_fail("send_slack_alert")
        self.slack_outbox.append({"channel": channel, "message": message, "severity": severity})
        return True

    def update_shipping_eta(self, tracking_id: str, added_minutes: int, reason: str) -> TrackingUpdate:
        self._maybe_fail("update_shipping_eta")
        shipment = self.shipments.get(tracking_id)
        if shipment is None:
            raise ToolError(f"Không tìm thấy vận đơn {tracking_id}")
        new_eta = shipment.eta + timedelta(minutes=added_minutes)
        self.shipments[tracking_id] = _Shipment(shipment.carrier, new_eta)
        return TrackingUpdate(
            tracking_id=tracking_id,
            carrier=shipment.carrier,
            previous_eta=shipment.eta,
            new_eta=new_eta,
            added_minutes=added_minutes,
            reason=reason,
            status="DELAYED",
        )


@dataclass(frozen=True)
class ToolSpec:
    name: str
    args_model: type[StrictArgs]
    return_type: Any
    side_effect: bool
    base_risk: float


TOOL_SPECS: dict[str, ToolSpec] = {
    "check_inventory": ToolSpec("check_inventory", TOOL_ARG_MODELS["check_inventory"], InventoryStatus, False, 0.0),
    "create_purchase_order": ToolSpec("create_purchase_order", TOOL_ARG_MODELS["create_purchase_order"], OrderConfirmation, True, 0.35),
    "send_slack_alert": ToolSpec("send_slack_alert", TOOL_ARG_MODELS["send_slack_alert"], bool, True, 0.15),
    "update_shipping_eta": ToolSpec("update_shipping_eta", TOOL_ARG_MODELS["update_shipping_eta"], TrackingUpdate, True, 0.2),
}


@dataclass
class InvocationOutcome:
    output: dict[str, Any]
    attempts: int
    latency_ms: float
    validated_args: dict[str, Any]


class ToolRegistry:
    """Allow-listed, schema-enforced, retrying tool invoker."""

    def __init__(self, backend: MockBackend, max_attempts: int = 3, backoff_base_s: float = 0.01) -> None:
        self._backend = backend
        self._max_attempts = max_attempts
        self._backoff_base_s = backoff_base_s

    @staticmethod
    def spec(tool: str) -> ToolSpec:
        try:
            return TOOL_SPECS[tool]
        except KeyError as exc:
            raise ToolError(f"tool '{tool}' is not in the allow-list") from exc

    def validate_args(self, tool: str, raw_args: dict[str, Any]) -> StrictArgs:
        spec = self.spec(tool)
        try:
            return spec.args_model.model_validate(raw_args, strict=True)
        except ValidationError as exc:
            details = "; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors())
            raise ToolArgumentError(f"{tool} argument validation failed: {details}") from exc

    def invoke(self, tool: str, raw_args: dict[str, Any]) -> InvocationOutcome:
        spec = self.spec(tool)
        args = self.validate_args(tool, raw_args)
        func: Callable[..., Any] = getattr(self._backend, spec.name)
        adapter: TypeAdapter[Any] = TypeAdapter(spec.return_type)
        start = time.perf_counter()
        attempt = 0
        while True:
            attempt += 1
            try:
                result = func(**args.model_dump())
                break
            except TransientToolError:
                if attempt >= self._max_attempts:
                    raise
                time.sleep(self._backoff_base_s * (2 ** (attempt - 1)))
        validated = adapter.validate_python(result)
        dumped = adapter.dump_python(validated, mode="json")
        output = dumped if isinstance(dumped, dict) else {"delivered": dumped}
        if isinstance(validated, BaseModel):
            output = validated.model_dump(mode="json")
        return InvocationOutcome(
            output=output,
            attempts=attempt,
            latency_ms=round((time.perf_counter() - start) * 1000, 3),
            validated_args=args.model_dump(mode="json"),
        )


__all__ = [
    "ICT",
    "MockBackend",
    "TOOL_SPECS",
    "ToolArgumentError",
    "ToolError",
    "ToolRegistry",
    "ToolSpec",
    "TransientToolError",
    "VENDORS",
    "date",
]
