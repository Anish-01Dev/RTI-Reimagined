import type { CaseEvent, CaseRecord } from "@/domain/types";

/**
 * Real SHA-256 hash chain over a case's event log, computed with the
 * browser's native Web Crypto (no library, no network call):
 *
 *   H1 = sha256(event1)
 *   H2 = sha256(event2 + H1)
 *   H3 = sha256(event3 + H2)
 *
 * This is what "tamper-evident" actually means here: change any event or
 * reorder the log and every hash after that point changes. It is NOT
 * blockchain and it is NOT a cryptographic guarantee against a party who
 * controls this browser's localStorage — it's an integrity check a
 * citizen can carry independently of the portal and compare against a
 * later copy. See EvidenceIntegrity for the honest framing shown in the UI.
 */

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalEvent(event: CaseEvent): string {
  // Deliberately excludes the `hash` field itself — each link commits to
  // the event's content and the previous link, not to its own hash.
  return JSON.stringify({
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    actor: event.actor,
    description: event.description,
    reference: event.reference ?? null,
    documentId: event.documentId ?? null,
  });
}

/** Recomputes the hash chain in place over `events`, mutating each
 * event's `.hash`. Returns the final (chain-head) hash, or null if there
 * are no events yet. */
export async function computeHashChain(
  events: CaseEvent[],
): Promise<string | null> {
  let previous = "";
  for (const event of events) {
    const linked = previous
      ? `${canonicalEvent(event)}|${previous}`
      : canonicalEvent(event);
    const hash = await sha256Hex(linked);
    event.hash = hash;
    previous = hash;
  }
  return previous || null;
}

export function trailHash(record: CaseRecord): string | null {
  const last = record.events[record.events.length - 1];
  return last?.hash ?? null;
}

/** The compact payload a QR/offline record encodes — just enough to
 * demonstrate continuity without depending on the portal being up. */
export interface TrailPayload {
  suchnaId: string;
  subject: string;
  authority: string;
  status: string;
  trailVersion: number;
  eventCount: number;
  hash: string | null;
  lastVerified: string;
}

export function buildTrailPayload(record: CaseRecord): TrailPayload {
  return {
    suchnaId: record.suchnaId,
    subject: record.subject,
    authority: record.authorityName,
    status: record.status,
    trailVersion: record.trailVersion,
    eventCount: record.events.length,
    hash: trailHash(record),
    lastVerified: new Date().toISOString(),
  };
}

/** Re-verification: recompute the chain fresh from the event log and
 * compare against the head hash stored on the record. A mismatch means
 * the local copy of the event log was edited after the fact. */
export async function verifyTrail(record: CaseRecord): Promise<boolean> {
  const claimed = trailHash(record);
  if (!claimed) return record.events.length === 0;
  const eventsCopy = record.events.map((e) => ({ ...e }));
  const recomputed = await computeHashChain(eventsCopy);
  return recomputed === claimed;
}
