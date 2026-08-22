# Compliance Notes

These boundaries are binding on product and engineering decisions in this repository.

## What the system does not do

- **It does not reject an RTI application.** Deterministic checks may block submission for a genuinely missing required field or an unsupported file format; they never block submission because the system judges the request's substance to be invalid.
- **It does not declare a Section 8 exemption legally applicable.** The system may flag that a request appears to concern identifiable personal information and surface the relevant statutory context, but the determination of whether an exemption applies rests with the public authority and, on appeal, the Information Commission.
- **It does not impose or calculate a binding penalty.** Section 20 penalties are part of the Information Commission's own statutory process. The system may surface that a delay has occurred; it does not adjudicate consequences.
- **It does not claim the existing Central RTI portal lacks digital infrastructure.** The portal already supports online submission, first appeals, status tracking, payment, and second-appeal integration. This system addresses a different layer — outcome tracking and verification — not a missing digital front end.

## What the system does do

- Flags procedural and exemption risk before filing, so the citizen can revise a request rather than have it rejected after submission.
- Calculates statutory deadlines and appeal eligibility deterministically, stating any assumption (such as calendar days versus working days where the governing text does not specify) explicitly rather than presenting an assumption as settled fact.
- Drafts appeal content for citizen review; filing always requires explicit citizen action.
- Preserves a verifiable record of what was requested, what was received, and whether the response addressed each question — independent of how the public authority itself labels the request's disposal status.
