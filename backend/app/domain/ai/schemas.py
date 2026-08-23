from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


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
