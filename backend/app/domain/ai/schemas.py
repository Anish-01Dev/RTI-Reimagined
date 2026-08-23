from __future__ import annotations

import uuid

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import InformationItemStatus


class DecomposedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question_text: str = Field(min_length=1, max_length=500)
    category: str | None = None


class ApplicationDoctorOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str
    suggested_authority_query: str
    items: list[DecomposedItem] = Field(min_length=1, max_length=8)
    life_or_liberty_flag: bool = False
    exemption_risk_notes: list[str] = Field(default_factory=list)


class AppealDraftOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    narrative: str = Field(min_length=1)
    open_items_summary: list[str] = Field(default_factory=list)


class ItemClassification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: uuid.UUID
    status: InformationItemStatus
    evidence_excerpt: str | None = None
    confidence: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def _validate_status(self) -> ItemClassification:
        if self.status == InformationItemStatus.PENDING:
            raise ValueError("PENDING is not a valid classification output")
        if self.status == InformationItemStatus.NOT_ANSWERED and self.evidence_excerpt is not None:
            raise ValueError("evidence_excerpt must be omitted when status is NOT_ANSWERED")
        return self


class AnswerIntegrityOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classifications: list[ItemClassification] = Field(default_factory=list)
