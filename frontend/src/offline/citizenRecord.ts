import { useEffect, useState } from "react";
import { buildTrailPayload, type TrailPayload } from "@/domain/integrity";
import type { CaseEvent, CaseRecord, Evidence } from "@/domain/types";

/**
 * Offline persistence for the citizen-held record ONLY.
 *
 * We do not claim the whole platform works offline. What survives a
 * network outage is the thing that matters legally: the citizen's own
 * copy of one case's trail — its events, hash chain, evidence metadata
 * and integrity payload — kept in localStorage under its own namespace
 * so it outlives a store reset, and readable by the passport and the
 * public /verify page with no server.
 */

const KEY = "suchna-rakshak:offline-records:v1";

export interface OfflineRecord {
  payload: TrailPayload;
  events: CaseEvent[];
  evidence: Evidence[];
  subject: string;
  authorityName: string;
  savedAt: string;
}

function readAll(): Record<string, OfflineRecord> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function syncOfflineRecord(record: CaseRecord): OfflineRecord {
  const all = readAll();
  const entry: OfflineRecord = {
    payload: buildTrailPayload(record),
    events: record.events,
    evidence: record.evidence,
    subject: record.subject,
    authorityName: record.authorityName,
    savedAt: new Date().toISOString(),
  };
  all[record.suchnaId] = entry;
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("offline-records-changed"));
  return entry;
}

export function getOfflineRecord(suchnaId: string): OfflineRecord | undefined {
  return readAll()[suchnaId];
}

export function listOfflineRecords(): OfflineRecord[] {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function useOfflineRecord(suchnaId: string | undefined) {
  const [rec, setRec] = useState<OfflineRecord | undefined>(() =>
    suchnaId ? getOfflineRecord(suchnaId) : undefined,
  );
  useEffect(() => {
    const load = () =>
      setRec(suchnaId ? getOfflineRecord(suchnaId) : undefined);
    load();
    window.addEventListener("offline-records-changed", load);
    return () => window.removeEventListener("offline-records-changed", load);
  }, [suchnaId]);
  return rec;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
