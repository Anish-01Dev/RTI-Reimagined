"""Language understanding integration.

Produces structured, schema-validated suggestions only: intent extraction,
translation, plain-language explanation, and response-coverage
classification. Output from this module is never treated as authoritative
by itself — it is always passed through the rules engine and, where it
affects case state, requires citizen confirmation. Text sourced from
uploaded documents is treated as untrusted data, never as instruction.
"""
