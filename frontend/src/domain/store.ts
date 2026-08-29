import { computeHashChain } from "@/domain/integrity";
import type {
  AuditEvent,
  AuthorityMetric,
  CaseEvent,
  CaseEventType,
  CaseRecord,
  CaseStatus,
  Evidence,
  GovStage,
  Notification,
  RequestVersion,
} from "@/domain/types";
import { GOV_STAGE_ORDER } from "@/domain/types";

const STORAGE_KEY = "suchna-rakshak:cases:v3";
const NOTIF_KEY = "suchna-rakshak:notifications:v3";
const DEMO_FLAG_KEY = "suchna-rakshak:demo-workspace:v3";

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

function readAll(): Record<string, CaseRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(cases: Record<string, CaseRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  notify();
}

/** True once a demo workspace has been loaded into this browser. A fresh
 * (non-demo) citizen never trips this — their store starts and stays empty
 * until they create a real request. */
export function hasDemoWorkspace(): boolean {
  return localStorage.getItem(DEMO_FLAG_KEY) === "true";
}

export function markDemoWorkspace() {
  localStorage.setItem(DEMO_FLAG_KEY, "true");
}

/** Wipes every case and notification and the demo flag — used by
 * "Exit demo workspace" and by a hard reset. */
export function clearWorkspace() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTIF_KEY);
  localStorage.removeItem(DEMO_FLAG_KEY);
  notify();
}

export function bulkInsert(records: CaseRecord[]) {
  const all = readAll();
  for (const record of records) all[record.suchnaId] = record;
  writeAll(all);
}

export function getAllCases(): CaseRecord[] {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getCase(suchnaId: string): CaseRecord | undefined {
  return readAll()[suchnaId];
}

export function getCaseByBackendId(backendId: string): CaseRecord | undefined {
  return Object.values(readAll()).find((c) => c.backendId === backendId);
}

function saveCase(record: CaseRecord) {
  const all = readAll();
  all[record.suchnaId] = record;
  writeAll(all);
}

export function generateSuchnaId(): string {
  const year = new Date().getFullYear();
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `SR-${year}-${hex}`;
}

async function appendEventInternal(
  record: CaseRecord,
  partial: Omit<CaseEvent, "id" | "hash">,
): Promise<CaseRecord> {
  const event: CaseEvent = { id: crypto.randomUUID(), ...partial };
  record.events = [...record.events, event];
  await computeHashChain(record.events);
  record.trailVersion += 1;
  record.updatedAt = new Date().toISOString();
  return record;
}

export interface CreateCaseInput {
  subject: string;
  authorityName: string;
  department: string;
  citizenName: string;
  originalRequest: string;
  category: string;
  backendId: string | null;
  responseDueAt: string | null;
  versions: RequestVersion[];
}

export async function createCase(input: CreateCaseInput): Promise<CaseRecord> {
  const now = new Date().toISOString();
  let record: CaseRecord = {
    suchnaId: generateSuchnaId(),
    backendId: input.backendId,
    subject: input.subject,
    authorityName: input.authorityName,
    department: input.department,
    citizenName: input.citizenName,
    originalRequest: input.originalRequest,
    status: "DRAFT",
    submittedAt: null,
    responseDueAt: input.responseDueAt,
    createdAt: now,
    updatedAt: now,
    trailVersion: 0,
    govStage: "RECEIVED",
    versions: input.versions,
    events: [],
    evidence: [],
    audit: [],
    reviewChecklist: {
      requestUnderstood: false,
      recordsIdentified: false,
      documentsLocated: false,
      exemptionReviewDone: false,
      responsePrepared: false,
      responseVerified: false,
      responseReleased: false,
    },
    appealReason: null,
    category: input.category,
  };
  record = await appendEventInternal(record, {
    type: "REQUEST_CREATED",
    timestamp: now,
    actor: "Citizen",
    description: `Request drafted: "${input.subject}"`,
  });
  saveCase(record);
  return record;
}

export async function submitCase(
  suchnaId: string,
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record) return undefined;
  const now = new Date().toISOString();
  record.status = "SUBMITTED";
  record.submittedAt = now;
  record = await appendEventInternal(record, {
    type: "REQUEST_SUBMITTED",
    timestamp: now,
    actor: "Citizen",
    description: `Application submitted to ${record.authorityName}`,
    reference: record.suchnaId,
  });
  saveCase(record);
  pushNotification(
    suchnaId,
    `${record.suchnaId} was submitted to ${record.authorityName}.`,
  );
  return record;
}

export async function addEvent(
  suchnaId: string,
  type: CaseEventType,
  description: string,
  actor = "System",
  opts?: {
    documentId?: string;
    reference?: string;
    statusOverride?: CaseStatus;
  },
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record) return undefined;
  const now = new Date().toISOString();
  record = await appendEventInternal(record, {
    type,
    timestamp: now,
    actor,
    description,
    documentId: opts?.documentId,
    reference: opts?.reference,
  });
  if (opts?.statusOverride) record.status = opts.statusOverride;
  saveCase(record);
  return record;
}

export async function addEvidence(
  suchnaId: string,
  evidence: Omit<Evidence, "id">,
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record) return undefined;
  const full: Evidence = { id: crypto.randomUUID(), ...evidence };
  record.evidence = [...record.evidence, full];
  record = await appendEventInternal(record, {
    type: "DOCUMENT_ADDED",
    timestamp: new Date().toISOString(),
    actor: evidence.source,
    description: `${evidence.title} added to the trail`,
    documentId: full.id,
  });
  saveCase(record);
  return record;
}

export function addAudit(
  suchnaId: string,
  actor: string,
  action: string,
  metadata?: string,
) {
  const record = getCase(suchnaId);
  if (!record) return;
  const entry: AuditEvent = {
    id: crypto.randomUUID(),
    actor,
    action,
    timestamp: new Date().toISOString(),
    metadata,
  };
  record.audit = [...record.audit, entry];
  saveCase(record);
}

export async function transitionGovStage(
  suchnaId: string,
  stage: GovStage,
  officerName: string,
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record) return undefined;
  record.govStage = stage;
  addAudit(suchnaId, officerName, `Moved case to ${stage.replace(/_/g, " ")}`);
  record = await appendEventInternal(record, {
    type: "GOV_STAGE_CHANGED",
    timestamp: new Date().toISOString(),
    actor: officerName,
    description: `Case moved to ${stage.replace(/_/g, " ").toLowerCase()}`,
  });
  if (stage === "RESPONSE_RELEASED") {
    record.status = "RESPONSE_RELEASED";
    pushNotification(
      suchnaId,
      `A response to ${record.suchnaId} has been released.`,
    );
  }
  saveCase(record);
  return record;
}

export function updateChecklist(
  suchnaId: string,
  key: keyof CaseRecord["reviewChecklist"],
  value: boolean,
) {
  const record = getCase(suchnaId);
  if (!record) return;
  record.reviewChecklist = { ...record.reviewChecklist, [key]: value };
  record.updatedAt = new Date().toISOString();
  saveCase(record);
}

export async function markOverdue(
  suchnaId: string,
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record || record.status === "OVERDUE") return record;
  record.status = "OVERDUE";
  record = await appendEventInternal(record, {
    type: "DEADLINE_MISSED",
    timestamp: new Date().toISOString(),
    actor: "System",
    description:
      "Statutory 30-day response window lapsed with no response on record.",
  });
  saveCase(record);
  pushNotification(
    suchnaId,
    `Your response deadline for ${record.suchnaId} has passed.`,
  );
  return record;
}

export async function fileFirstAppeal(
  suchnaId: string,
  reason: string,
): Promise<CaseRecord | undefined> {
  let record = getCase(suchnaId);
  if (!record) return undefined;
  record.status = "FIRST_APPEAL";
  record.appealReason = reason;
  record = await appendEventInternal(record, {
    type: "APPEAL_PREPARED",
    timestamp: new Date().toISOString(),
    actor: "Citizen",
    description: "First Appeal prepared and saved to the trail.",
  });
  saveCase(record);
  pushNotification(
    suchnaId,
    `Your First Appeal draft for ${record.suchnaId} is ready.`,
  );
  return record;
}

export async function addVersion(
  suchnaId: string,
  version: Omit<RequestVersion, "version">,
): Promise<CaseRecord | undefined> {
  const record = getCase(suchnaId);
  if (!record) return undefined;
  const nextVersion = (record.versions.at(-1)?.version ?? 0) + 1;
  record.versions = [...record.versions, { ...version, version: nextVersion }];
  if (version.source === "doctor" || version.source === "system") {
    record.originalRequest = version.text;
  }
  record.updatedAt = new Date().toISOString();
  saveCase(record);
  return record;
}

// ---- Notifications ----

function readNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeNotifications(list: Notification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  notify();
}

export function pushNotification(caseId: string, message: string) {
  const list = readNotifications();
  list.unshift({
    id: crypto.randomUUID(),
    caseId,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  });
  writeNotifications(list.slice(0, 50));
}

export function listNotifications(): Notification[] {
  return readNotifications();
}

export function markNotificationRead(id: string) {
  const list = readNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  writeNotifications(list);
}

export function markAllNotificationsRead() {
  writeNotifications(readNotifications().map((n) => ({ ...n, read: true })));
}

export function unreadCount(): number {
  return readNotifications().filter((n) => !n.read).length;
}

// ---- Search & analytics ----

export function searchCases(query: string): CaseRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllCases().filter(
    (c) =>
      c.suchnaId.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.authorityName.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.citizenName.toLowerCase().includes(q),
  );
}

export function computeAuthorityMetrics(): AuthorityMetric[] {
  const cases = getAllCases();
  const byAuthority = new Map<string, CaseRecord[]>();
  for (const c of cases) {
    const list = byAuthority.get(c.authorityName) ?? [];
    list.push(c);
    byAuthority.set(c.authorityName, list);
  }
  return Array.from(byAuthority.entries()).map(([name, group]) => {
    const open = group.filter(
      (c) => !["RESPONSE_RELEASED", "CLOSED"].includes(c.status),
    );
    const overdue = group.filter(
      (c) => c.status === "OVERDUE" || c.status === "FIRST_APPEAL",
    );
    const dueSoon = group.filter((c) => {
      if (!c.responseDueAt) return false;
      const days = Math.round(
        (new Date(c.responseDueAt).getTime() - Date.now()) / 86_400_000,
      );
      return days >= 0 && days <= 5;
    });
    const resolved = group.filter(
      (c) => c.status === "RESPONSE_RELEASED" || c.status === "CLOSED",
    );
    const responseRate = group.length > 0 ? resolved.length / group.length : 0;
    const avgResponseDays =
      resolved.length > 0
        ? Math.round(
            resolved.reduce((sum, c) => {
              const submitted = c.submittedAt
                ? new Date(c.submittedAt).getTime()
                : Date.now();
              const released =
                c.events.find((e) => e.type === "RESPONSE_RECEIVED")
                  ?.timestamp ?? c.updatedAt;
              return (
                sum + (new Date(released).getTime() - submitted) / 86_400_000
              );
            }, 0) / resolved.length,
          )
        : 0;
    return {
      name,
      department: group[0]?.department ?? "",
      openCases: open.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
      responseRate,
      avgResponseDays,
    };
  });
}

export function nextGovStage(current: GovStage): GovStage | null {
  const index = GOV_STAGE_ORDER.indexOf(current);
  return index >= 0 && index < GOV_STAGE_ORDER.length - 1
    ? GOV_STAGE_ORDER[index + 1]
    : null;
}
