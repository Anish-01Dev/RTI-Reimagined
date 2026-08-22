# Project Scope

## Thesis

RTI Reimagined is not a tool that files RTI requests on a citizen's behalf. It is the case-management, rules, evidence, deadline, and accountability infrastructure that wraps around the RTI process.

India's Central RTI Online portal already supports online submission, first appeals, status tracking, payment, and integration with the second-appeal workflow. It is, however, **application-centric**: it tracks the existence of a filing, not the outcome the citizen is entitled to. It is scoped to Central public authorities only, misdirected State filings are returned without refund, and online first appeals are restricted to applications that were originally filed online.

RTI Reimagined is **outcome-centric**. It exists to close the gap between "an application was submitted" and "the citizen received what they were legally entitled to."

## Core Loop

**Ask → Track → Prove**

1. **Ask** — Understand the citizen's request in plain language, resolve the correct authority and jurisdiction, decompose it into precise, well-formed questions, and flag procedural or exemption risk before filing.
2. **Track** — Maintain the case as a single source of truth across acknowledgement, transfer, response, and appeal, with statutory deadlines calculated automatically.
3. **Prove** — Determine whether a government response actually answered each question asked, and preserve a tamper-evident record of the full case history.

## Guiding Principle

Every feature must do at least one of the following, or it is out of scope:

- Reduce citizen uncertainty about the RTI process.
- Reduce processing friction for the public authority handling the request.
- Increase the trustworthiness or verifiability of the record.

## In Scope — Initial Build

Five core subsystems, in priority order:

1. **Case Engine** — the state machine and system of record for every RTI case.
2. **Rights Clock** — deterministic deadline and appeal-eligibility calculation under the applicable statutory timelines.
3. **Application Doctor** — plain-language intake, jurisdiction detection, question decomposition, and pre-filing risk detection.
4. **Answer Integrity Engine** — question-by-question coverage analysis of government responses.
5. **Evidence Layer** — cryptographically signed case certificates and verification.

A minimal government-side structured-intake view is included to demonstrate the reduction in processing friction on the receiving side, but is intentionally kept small relative to the citizen-facing product.

## Explicitly Out of Scope (Current Phase)

- Direct integration with government RTI systems (a provider-adapter interface is built against a controlled substitute implementation first).
- Real identity verification (Aadhaar, PAN) or real payment processing.
- Automated legal determinations: the system does not reject an RTI application, declare a statutory exemption applicable, or impose a penalty. These remain functions of the public authority and the Information Commission.
- A full government administrative dashboard — only a narrow, illustrative intake view.
- Multi-device offline conflict resolution beyond a single-device operation queue.

## Non-Negotiable Architecture Principle

Automated language understanding may interpret, translate, and suggest. It does not decide. Case status, statutory deadlines, appeal eligibility, and exemption applicability are always determined by an explicit, deterministic rules engine and state machine, gated by human confirmation before any filing or appeal is submitted. See [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md).
