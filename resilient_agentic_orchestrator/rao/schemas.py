"""Strict Pydantic v2 data contracts for the mock operational tools.

Every tool argument model uses ``extra="forbid"`` and ``strict=True`` so that
type coercion never silently "fixes" a malformed LLM/planner payload.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ToolName = Literal[
    "check_inventory",
    "create_purchase_order",
    "send_slack_alert",
    "update_shipping_eta",
]

Severity = Literal["INFO", "WARNING", "CRITICAL"]

SKU_PATTERN = r"^[A-Z]{2,5}-\d{3,6}$"
VENDOR_PATTERN = r"^NCC-\d{3}$"
CHANNEL_PATTERN = r"^#[a-z0-9][a-z0-9_-]{0,79}$"
TRACKING_PATTERN = r"^[A-Z]{2,4}\d{6,12}$"


class StrictArgs(BaseModel):
    """Base class for all tool-argument contracts."""

    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class StrictResult(BaseModel):
    """Base class for all tool-result contracts."""

    model_config = ConfigDict(extra="forbid", frozen=True)


# --------------------------------------------------------------------------- #
# check_inventory
# --------------------------------------------------------------------------- #
class CheckInventoryArgs(StrictArgs):
    sku: str = Field(pattern=SKU_PATTERN, description="Stock Keeping Unit (SKU), e.g. LAP-1001")


class InventoryStatus(StrictResult):
    sku: str = Field(pattern=SKU_PATTERN)
    product_name: str
    warehouse: str
    on_hand: int = Field(ge=0)
    reorder_point: int = Field(ge=0)
    status: Literal["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]
    needs_reorder: bool
    suggested_reorder_qty: int = Field(ge=0)
    preferred_vendor_id: str = Field(pattern=VENDOR_PATTERN)


# --------------------------------------------------------------------------- #
# create_purchase_order
# --------------------------------------------------------------------------- #
class CreatePurchaseOrderArgs(StrictArgs):
    sku: str = Field(pattern=SKU_PATTERN)
    quantity: int = Field(ge=1, le=100_000)
    vendor_id: str = Field(pattern=VENDOR_PATTERN, description="Vendor ID (NCC), e.g. NCC-017")


class OrderConfirmation(StrictResult):
    po_number: str = Field(pattern=r"^PO-\d{8}-\d{4}$")
    sku: str = Field(pattern=SKU_PATTERN)
    quantity: int = Field(ge=1)
    vendor_id: str = Field(pattern=VENDOR_PATTERN)
    vendor_name: str
    status: Literal["CREATED"]
    total_cost_vnd: int = Field(ge=0)
    expected_delivery_date: date


# --------------------------------------------------------------------------- #
# send_slack_alert
# --------------------------------------------------------------------------- #
class SendSlackAlertArgs(StrictArgs):
    channel: str = Field(pattern=CHANNEL_PATTERN)
    message: str = Field(min_length=1, max_length=2000)
    severity: Severity

    @field_validator("message")
    @classmethod
    def _no_raw_control_chars(cls, value: str) -> str:
        if any(ord(ch) < 32 and ch not in "\n\t" for ch in value):
            raise ValueError("message contains control characters")
        return value


# --------------------------------------------------------------------------- #
# update_shipping_eta
# --------------------------------------------------------------------------- #
class UpdateShippingEtaArgs(StrictArgs):
    tracking_id: str = Field(pattern=TRACKING_PATTERN)
    added_minutes: int = Field(ge=1, le=10_080, description="Added minutes to ETA (maximum 7 days)")
    reason: str = Field(min_length=3, max_length=500)


class TrackingUpdate(StrictResult):
    tracking_id: str = Field(pattern=TRACKING_PATTERN)
    carrier: str
    previous_eta: datetime
    new_eta: datetime
    added_minutes: int = Field(ge=1)
    reason: str
    status: Literal["DELAYED"]


TOOL_ARG_MODELS: dict[str, type[StrictArgs]] = {
    "check_inventory": CheckInventoryArgs,
    "create_purchase_order": CreatePurchaseOrderArgs,
    "send_slack_alert": SendSlackAlertArgs,
    "update_shipping_eta": UpdateShippingEtaArgs,
}
