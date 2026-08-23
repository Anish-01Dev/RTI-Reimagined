"""Appeal Compiler.

Drafts First and Second Appeal content from case eligibility state and
Answer Integrity coverage gaps. Filing is always a separate, explicit
citizen-approved action — this module only produces a draft.
"""

from app.domain.appeal_engine.compiler import (
    APPEAL_WINDOW_CITATION,
    GROUNDS_CITATION,
    AppealDraft,
    PrecedentMatch,
    compile_first_appeal_draft,
)

__all__ = [
    "APPEAL_WINDOW_CITATION",
    "GROUNDS_CITATION",
    "AppealDraft",
    "PrecedentMatch",
    "compile_first_appeal_draft",
]
