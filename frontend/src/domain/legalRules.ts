/**
 * Structured RTI Act, 2005 process rules — data, not prose scattered
 * across components. Every rule cites a real section of the Act (the
 * same citations already used by the real backend's deadline/appeal
 * engines — see backend/app/domain/deadline_engine/rules.py and
 * appeal_engine/compiler.py). This is process guidance, explicitly
 * labeled as such everywhere it's shown — never presented as legal
 * advice, and nothing here is invented.
 */

export type CaseStage =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RESPONSE_DUE_SOON"
  | "OVERDUE"
  | "RESPONSE_RECEIVED"
  | "FIRST_APPEAL"
  | "SECOND_APPEAL";

export interface LegalRule {
  id: string;
  stage: CaseStage;
  title: string;
  guidance: string;
  provision: string;
  source: string;
  deadlineDays: number | null;
  recommendedAction: string | null;
}

export const LEGAL_RULES: LegalRule[] = [
  {
    id: "response-window",
    stage: "SUBMITTED",
    title: "Standard response window",
    guidance:
      "A public authority must furnish the information requested, or a valid reason for denial, within 30 days of receiving the request.",
    provision: "Section 7(1)",
    source: "Right to Information Act, 2005",
    deadlineDays: 30,
    recommendedAction: "Monitor — no action needed yet.",
  },
  {
    id: "transfer-window",
    stage: "UNDER_REVIEW",
    title: "Transfer to the correct authority",
    guidance:
      "If the authority that received the request does not hold the information, it must transfer the request to the authority that does, within 5 days.",
    provision: "Section 6(3)",
    source: "Right to Information Act, 2005",
    deadlineDays: 5,
    recommendedAction:
      "Monitor — transfers reset visibility, not necessarily the clock.",
  },
  {
    id: "approaching",
    stage: "RESPONSE_DUE_SOON",
    title: "Deadline approaching",
    guidance:
      "The 30-day response window is close to expiring with no response on record.",
    provision: "Section 7(1)",
    source: "Right to Information Act, 2005",
    deadlineDays: null,
    recommendedAction:
      "No action required yet — you'll be notified if the deadline lapses.",
  },
  {
    id: "overdue",
    stage: "OVERDUE",
    title: "Response deadline has passed",
    guidance:
      "Once the 30-day window lapses without a response, the citizen becomes eligible to file a First Appeal without waiting further.",
    provision: "Section 19(1)",
    source: "Right to Information Act, 2005",
    deadlineDays: 30,
    recommendedAction: "File First Appeal.",
  },
  {
    id: "response-review",
    stage: "RESPONSE_RECEIVED",
    title: "Reviewing a response",
    guidance:
      "A response should address every item requested. Partial, evasive, or unsupported answers can themselves be grounds for appeal.",
    provision: "Section 7(1)",
    source: "Right to Information Act, 2005",
    deadlineDays: null,
    recommendedAction:
      "Review the response against your original items before closing the case.",
  },
  {
    id: "first-appeal",
    stage: "FIRST_APPEAL",
    title: "First Appeal window",
    guidance:
      "A First Appeal to the authority's designated Appellate Authority must ordinarily be filed within 30 days of the deadline lapsing or the response being received.",
    provision: "Section 19(1)",
    source: "Right to Information Act, 2005",
    deadlineDays: 30,
    recommendedAction: "Prepare and review the First Appeal draft.",
  },
  {
    id: "second-appeal",
    stage: "SECOND_APPEAL",
    title: "Second Appeal window",
    guidance:
      "If the First Appeal is not decided, or is decided unfavourably, a Second Appeal may be filed with the Information Commission within 90 days.",
    provision: "Section 19(3)",
    source: "Right to Information Act, 2005",
    deadlineDays: 90,
    recommendedAction: "Consider escalating to the Information Commission.",
  },
];

export function legalRuleForStage(stage: CaseStage): LegalRule | undefined {
  return LEGAL_RULES.find((r) => r.stage === stage);
}
