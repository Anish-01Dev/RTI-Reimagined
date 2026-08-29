import { legalRuleForStage, type CaseStage } from "@/domain/legalRules";
import type { CaseRecord } from "@/domain/types";

export interface NextAction {
  label: string;
  reason: string;
  stage: CaseStage;
  urgent: boolean;
  route: (suchnaId: string) => string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function daysRemainingFor(record: CaseRecord): number | null {
  if (!record.responseDueAt) return null;
  return daysBetween(new Date(record.responseDueAt), new Date());
}

/** Maps a case's product status onto the legal-rules stage vocabulary,
 * then reads off the recommended action — this is the single function
 * every "what should I do next?" surface in the app calls, so the
 * citizen dashboard, the case workspace, and the government queue can
 * never disagree with each other. */
export function computeNextAction(record: CaseRecord): NextAction {
  const remaining = daysRemainingFor(record);

  if (record.status === "FIRST_APPEAL") {
    return {
      label: "Review First Appeal",
      reason: legalRuleForStage("FIRST_APPEAL")?.guidance ?? "",
      stage: "FIRST_APPEAL",
      urgent: false,
      route: (id) => `/app/cases/${id}/legal`,
    };
  }
  if (record.status === "SECOND_APPEAL") {
    return {
      label: "Track Second Appeal",
      reason: legalRuleForStage("SECOND_APPEAL")?.guidance ?? "",
      stage: "SECOND_APPEAL",
      urgent: false,
      route: (id) => `/app/cases/${id}/legal`,
    };
  }
  if (record.status === "OVERDUE") {
    return {
      label: "File First Appeal",
      reason: "Response deadline has passed with no reply on record.",
      stage: "OVERDUE",
      urgent: true,
      route: (id) => `/app/cases/${id}/legal`,
    };
  }
  if (record.status === "RESPONSE_RELEASED") {
    return {
      label: "Review response",
      reason:
        "A response has been added to your trail — check it against what you asked.",
      stage: "RESPONSE_RECEIVED",
      urgent: false,
      route: (id) => `/app/cases/${id}/evidence`,
    };
  }
  if (record.status === "CLOSED") {
    return {
      label: "View closed case",
      reason: "This request has been resolved and closed.",
      stage: "RESPONSE_RECEIVED",
      urgent: false,
      route: (id) => `/app/cases/${id}`,
    };
  }
  if (remaining !== null && remaining <= 5) {
    return {
      label: "Monitor deadline",
      reason: `${remaining} day${remaining === 1 ? "" : "s"} remaining on the statutory response window.`,
      stage: "RESPONSE_DUE_SOON",
      urgent: remaining <= 2,
      route: (id) => `/app/cases/${id}/timeline`,
    };
  }
  return {
    label: "No action required",
    reason: "This request is progressing within its statutory window.",
    stage: "SUBMITTED",
    urgent: false,
    route: (id) => `/app/cases/${id}`,
  };
}
