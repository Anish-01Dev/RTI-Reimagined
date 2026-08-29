/**
 * The local domain model — extends the real backend's RTIApplication
 * (backend/app/models/orm.py: applications, information_items, deadlines,
 * events, appeals — real Postgres rows behind api.applications.*) with
 * the richer product surface the backend doesn't cover yet: request
 * versions, evidence, government workflow, audit, notifications.
 *
 * Cases fall into two kinds, both stored here under the same shape:
 *  - "live" cases are backed by a real backend application (its UUID is
 *    `backendId`) — the citizen composer, deadlines, certificate, and
 *    appeal filing for these are the real thing.
 *  - "seeded" cases (backendId: null) exist only in this local store, so
 *    the government queue, analytics, and search have a coherent,
 *    offline-safe population to work with without depending on live
 *    backend state. Both kinds share one CaseRecord shape so every screen
 *    reads them identically.
 */

export type CaseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "FORWARDED"
  | "UNDER_REVIEW"
  | "RESPONSE_DRAFTED"
  | "RESPONSE_RELEASED"
  | "OVERDUE"
  | "FIRST_APPEAL"
  | "SECOND_APPEAL"
  | "CLOSED";

export type GovStage =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "INFO_LOCATED"
  | "RESPONSE_DRAFTED"
  | "COMPLIANCE_REVIEW"
  | "READY_TO_RELEASE"
  | "RESPONSE_RELEASED";

export const GOV_STAGE_ORDER: GovStage[] = [
  "RECEIVED",
  "UNDER_REVIEW",
  "INFO_LOCATED",
  "RESPONSE_DRAFTED",
  "COMPLIANCE_REVIEW",
  "READY_TO_RELEASE",
  "RESPONSE_RELEASED",
];

export type CaseEventType =
  | "REQUEST_CREATED"
  | "REQUEST_REVISED"
  | "REQUEST_SUBMITTED"
  | "REQUEST_ACKNOWLEDGED"
  | "REQUEST_FORWARDED"
  | "DOCUMENT_ADDED"
  | "RESPONSE_RECEIVED"
  | "RESPONSE_VERIFIED"
  | "DEADLINE_APPROACHING"
  | "DEADLINE_MISSED"
  | "APPEAL_PREPARED"
  | "APPEAL_SUBMITTED"
  | "GOV_STAGE_CHANGED"
  | "CASE_CLOSED";

export interface CaseEvent {
  id: string;
  type: CaseEventType;
  timestamp: string; // ISO
  actor: string; // "Citizen" | "System" | an authority/officer name
  description: string;
  reference?: string;
  documentId?: string;
  /** hash(this event's canonical JSON + previous event's hash) — see
   * domain/integrity.ts. Filled in as events are appended. */
  hash?: string;
}

export type EvidenceKind =
  | "ACKNOWLEDGEMENT"
  | "RECEIPT"
  | "FORWARDING_NOTICE"
  | "RESPONSE_DOCUMENT"
  | "CORRESPONDENCE"
  | "APPEAL_DOCUMENT"
  | "DELIVERY_RECORD";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  source: string; // "Public Authority" | "Citizen" | "System"
  dateIso: string;
  preview: string; // short body text — this is a demo-safe stand-in for a real file
  integrity: "VERIFIED" | "UNVERIFIED";
}

export interface RequestVersion {
  version: number;
  label: string; // "Citizen draft" | "Application Doctor revision" | "Submitted"
  text: string;
  createdAt: string;
  source: "citizen" | "doctor" | "system";
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  metadata?: string;
}

export interface Notification {
  id: string;
  caseId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ReviewChecklistState {
  requestUnderstood: boolean;
  recordsIdentified: boolean;
  documentsLocated: boolean;
  exemptionReviewDone: boolean;
  responsePrepared: boolean;
  responseVerified: boolean;
  responseReleased: boolean;
}

export interface CaseRecord {
  suchnaId: string; // "SR-2026-A7F29C" — the durable, human-facing identity
  backendId: string | null; // real applications.id when this case is backend-backed
  subject: string;
  authorityName: string;
  department: string;
  citizenName: string;
  originalRequest: string;
  status: CaseStatus;
  submittedAt: string | null;
  responseDueAt: string | null;
  createdAt: string;
  updatedAt: string;
  trailVersion: number;
  govStage: GovStage;
  versions: RequestVersion[];
  events: CaseEvent[];
  evidence: Evidence[];
  audit: AuditEvent[];
  reviewChecklist: ReviewChecklistState;
  appealReason: string | null;
  category: string; // for analytics grouping
}

export interface AuthorityMetric {
  name: string;
  department: string;
  openCases: number;
  dueSoon: number;
  overdue: number;
  responseRate: number; // 0-1
  avgResponseDays: number;
}
