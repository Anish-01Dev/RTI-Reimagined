"""Coverage plan for app.domain.deadline_engine.

- 30-day standard response period computed against a fixed reference timestamp.
- 48-hour life-and-liberty period computed correctly (hours, not days).
- 5-day transfer period computed correctly.
- Appeal eligibility triggers only after the relevant deadline has passed
  with no qualifying case event.
"""
