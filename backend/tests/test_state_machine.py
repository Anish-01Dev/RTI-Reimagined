"""Coverage plan for app.domain.case_engine.state_machine.

- Every legal transition in the STATE_MACHINE.md table succeeds.
- Every transition not listed for a given state is rejected.
- Guard conditions (e.g. FIRST_APPEAL_FILED requires prior eligibility and
  an approved appeal) are enforced independent of client-supplied state.
"""
