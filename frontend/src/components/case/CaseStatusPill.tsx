import type { CaseStatus } from "@/domain/types";

const LABEL: Record<CaseStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  FORWARDED: "Forwarded",
  UNDER_REVIEW: "Under review",
  RESPONSE_DRAFTED: "Response drafted",
  RESPONSE_RELEASED: "Response received",
  OVERDUE: "Overdue",
  FIRST_APPEAL: "First appeal",
  SECOND_APPEAL: "Second appeal",
  CLOSED: "Closed",
};

const TONE: Record<CaseStatus, string> = {
  DRAFT: "chip-neutral",
  SUBMITTED: "chip-info",
  ACKNOWLEDGED: "chip-info",
  FORWARDED: "chip-info",
  UNDER_REVIEW: "chip-info",
  RESPONSE_DRAFTED: "chip-warn",
  RESPONSE_RELEASED: "chip-success",
  OVERDUE: "chip-danger",
  FIRST_APPEAL: "chip-warn",
  SECOND_APPEAL: "chip-warn",
  CLOSED: "chip-neutral",
};

const DOT: Record<CaseStatus, string> = {
  DRAFT: "bg-ink-3",
  SUBMITTED: "bg-primary",
  ACKNOWLEDGED: "bg-primary",
  FORWARDED: "bg-primary",
  UNDER_REVIEW: "bg-primary",
  RESPONSE_DRAFTED: "bg-warn",
  RESPONSE_RELEASED: "bg-success",
  OVERDUE: "bg-danger",
  FIRST_APPEAL: "bg-warn",
  SECOND_APPEAL: "bg-warn",
  CLOSED: "bg-ink-3",
};

export function CaseStatusPill({ status }: { status: CaseStatus }) {
  return (
    <span className={`chip ${TONE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {LABEL[status]}
    </span>
  );
}
