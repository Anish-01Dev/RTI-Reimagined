import type { ApplicationStatus } from "@/types";

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 31) return `${Math.round(days / 7)}w ago`;
  return formatDate(iso);
}

export function daysRemaining(dueIso: string | null): number | null {
  if (!dueIso) return null;
  const diffMs = new Date(dueIso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Short, stable case reference from the application's own UUID.
 * There is no government-issued registration_number yet — no adapter
 * populates it (see backend/app/adapters/government, an unwired
 * interface) — so this is honestly "our case id", not a claim of an
 * official registration number. */
export function caseReference(
  applicationId: string,
  registrationNumber: string | null,
): string {
  if (registrationNumber) return registrationNumber;
  return `RTI-${applicationId.slice(0, 8).toUpperCase()}`;
}

const STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "info" | "warning" | "success" | "danger"
> = {
  DRAFT: "neutral",
  VALIDATED: "info",
  READY_TO_FILE: "info",
  SUBMITTED: "info",
  ACKNOWLEDGED: "info",
  TRANSFERRED: "info",
  UNDER_PROCESSING: "info",
  RESPONSE_RECEIVED: "info",
  RESPONSE_ANALYSIS: "warning",
  COMPLETED: "success",
  NO_RESPONSE: "danger",
  INCOMPLETE_RESPONSE: "warning",
  FIRST_APPEAL_ELIGIBLE: "warning",
  FIRST_APPEAL_FILED: "info",
  SECOND_APPEAL_ELIGIBLE: "warning",
};

const TONE_CLASSES: Record<string, string> = {
  neutral:
    "bg-surface-container text-on-surface-variant border-outline-variant",
  info: "bg-primary-container/10 text-primary border-primary/20",
  warning: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  success:
    "bg-tertiary-container/10 text-tertiary border-tertiary-container/20",
  danger: "bg-error-container text-on-error-container border-error/20",
};

export function statusToneClasses(status: ApplicationStatus): string {
  return TONE_CLASSES[STATUS_TONE[status]];
}
