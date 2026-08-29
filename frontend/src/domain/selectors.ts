/**
 * Cross-case derived views. Every dashboard, nav badge, deadline list and
 * document library reads from here so the whole product agrees on what
 * "overdue", "due soon" and "active" mean.
 */
import { daysRemainingFor } from "@/domain/actionEngine";
import { getAllCases } from "@/domain/store";
import { DEMO_CITIZEN } from "@/lib/demoIdentity";
import type { CaseEvent, CaseRecord, Evidence } from "@/domain/types";

export const RESOLVED_STATUSES: CaseRecord["status"][] = [
  "RESPONSE_RELEASED",
  "CLOSED",
];

export function citizenCases(): CaseRecord[] {
  return getAllCases().filter((c) => c.citizenName === DEMO_CITIZEN.name);
}

export function isOverdue(c: CaseRecord): boolean {
  return c.status === "OVERDUE";
}

export function isAppeal(c: CaseRecord): boolean {
  return c.status === "FIRST_APPEAL" || c.status === "SECOND_APPEAL";
}

export function isResolved(c: CaseRecord): boolean {
  return RESOLVED_STATUSES.includes(c.status);
}

export function isActive(c: CaseRecord): boolean {
  return !isResolved(c) && !isAppeal(c) && c.status !== "DRAFT";
}

/** A case is "due soon" when it has a live deadline inside 5 days and no
 * response yet. Overdue cases are counted separately, not here. */
export function isDueSoon(c: CaseRecord): boolean {
  if (isOverdue(c) || isResolved(c) || isAppeal(c)) return false;
  const r = daysRemainingFor(c);
  return r !== null && r >= 0 && r <= 5;
}

export interface CaseBuckets {
  active: CaseRecord[];
  dueSoon: CaseRecord[];
  overdue: CaseRecord[];
  appeals: CaseRecord[];
  responded: CaseRecord[];
  needsAttention: CaseRecord[];
}

export function bucket(cases: CaseRecord[]): CaseBuckets {
  const overdue = cases.filter(isOverdue);
  const appeals = cases.filter(isAppeal);
  const dueSoon = cases.filter(isDueSoon);
  const responded = cases.filter((c) => c.status === "RESPONSE_RELEASED");
  const active = cases.filter(isActive);
  return {
    active,
    dueSoon,
    overdue,
    appeals,
    responded,
    needsAttention: [...overdue, ...appeals, ...dueSoon].filter(
      (c, i, a) => a.findIndex((x) => x.suchnaId === c.suchnaId) === i,
    ),
  };
}

export interface ActivityEntry extends CaseEvent {
  suchnaId: string;
  subject: string;
}

export function recentActivity(
  cases: CaseRecord[],
  limit = 12,
): ActivityEntry[] {
  return cases
    .flatMap((c) =>
      c.events.map((e) => ({
        ...e,
        suchnaId: c.suchnaId,
        subject: c.subject,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

export interface DocumentEntry extends Evidence {
  suchnaId: string;
  subject: string;
  authorityName: string;
}

export function allDocuments(cases: CaseRecord[]): DocumentEntry[] {
  return cases
    .flatMap((c) =>
      c.evidence.map((d) => ({
        ...d,
        suchnaId: c.suchnaId,
        subject: c.subject,
        authorityName: c.authorityName,
      })),
    )
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
}
