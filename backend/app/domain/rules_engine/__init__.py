"""Deterministic rules engine.

Validates jurisdiction and authority selection, question scope and
formulation, and Section 8 exemption-risk flags against structured intent
produced by the language understanding layer. Nothing produced by that
layer is treated as authoritative until it has passed through here.
"""
