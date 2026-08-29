// Mirrors backend/app/schemas/*.py and backend/app/models/enums.py field
// for field. Keep in sync by hand — there is no shared schema generation
// yet (see docs/architecture/API_CONTRACT.md).

export type ApplicationStatus =
  | "DRAFT"
  | "VALIDATED"
  | "READY_TO_FILE"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "TRANSFERRED"
  | "UNDER_PROCESSING"
  | "RESPONSE_RECEIVED"
  | "RESPONSE_ANALYSIS"
  | "COMPLETED"
  | "NO_RESPONSE"
  | "INCOMPLETE_RESPONSE"
  | "FIRST_APPEAL_ELIGIBLE"
  | "FIRST_APPEAL_FILED"
  | "SECOND_APPEAL_ELIGIBLE";

export type InformationItemStatus =
  | "PENDING"
  | "ANSWERED"
  | "PARTIALLY_ANSWERED"
  | "NOT_ANSWERED"
  | "POTENTIALLY_DEFICIENT";

export type DeadlineType =
  | "RESPONSE"
  | "TRANSFER"
  | "LIFE_AND_LIBERTY"
  | "FIRST_APPEAL"
  | "SECOND_APPEAL";

export type DeadlineStatus = "ACTIVE" | "MET" | "MISSED" | "CANCELLED";

export type AppealType = "FIRST" | "SECOND";
export type AppealStatus = "DRAFT" | "FILED" | "WITHDRAWN";

export interface Application {
  id: string;
  registration_number: string | null;
  user_id: string;
  authority_id: string;
  subject: string;
  original_request: string;
  refined_request: string | null;
  status: ApplicationStatus;
  submitted_at: string | null;
  received_at: string | null;
  response_due_at: string | null;
  response_received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InformationItem {
  id: string;
  application_id: string;
  sequence: number;
  question_text: string;
  category: string | null;
  status: InformationItemStatus;
  evidence_excerpt: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deadline {
  id: string;
  application_id: string;
  deadline_type: DeadlineType;
  starts_at: string;
  due_at: string;
  status: DeadlineStatus;
  completed_at: string | null;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: string;
  actor_id: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface Appeal {
  id: string;
  application_id: string;
  appeal_type: AppealType;
  reason: string;
  status: AppealStatus;
  created_at: string;
  submitted_at: string | null;
}

export interface PrecedentMatch {
  item_id: string;
  question_text: string;
  section: string;
  principle: string;
  citation: string;
}

export interface AppealDraft {
  application_id: string;
  registration_number: string | null;
  subject: string;
  original_request: string;
  filed_at: string | null;
  response_due_at: string | null;
  grounds_citation: string;
  appeal_window_citation: string;
  open_items: InformationItem[];
  narrative: string;
  open_items_summary: string[];
  precedent_matches: PrecedentMatch[];
}

export interface Certificate {
  application_id: string;
  registration_number: string | null;
  authority_id: string;
  original_request_hash: string;
  issued_at: string;
  key_id: string;
  signature: string;
}

export interface DecomposedItem {
  question_text: string;
  category: string | null;
}

export interface ApplicationDoctorOutput {
  subject: string;
  suggested_authority_query: string;
  items: DecomposedItem[];
  life_or_liberty_flag: boolean;
  exemption_risk_notes: string[];
}

// Not backed by a backend endpoint (authority onboarding is a future
// phase — see backend/app/repositories/authorities.py) — this is the
// fixed demo directory in src/lib/demoIdentity.ts, typed the same shape
// the ORM's Authority row has so it drops in once a real endpoint exists.
export interface Authority {
  id: string;
  name: string;
  type: "CENTRAL" | "STATE";
  jurisdiction: string;
  state: string | null;
  district: string | null;
  department: string | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
  request_id: string | null;
}
