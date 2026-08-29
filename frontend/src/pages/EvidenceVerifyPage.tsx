import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { buildTrailPayload, verifyTrail } from "@/domain/integrity";
import { getCase } from "@/domain/store";
import type { CaseRecord } from "@/domain/types";
import { getOfflineRecord } from "@/offline/citizenRecord";
import { formatDateTime } from "@/lib/format";

type State =
  | { phase: "loading" }
  | { phase: "done"; record: CaseRecord; valid: boolean; source: string };

/**
 * Public, unauthenticated verification. Anyone with a Suchna ID or the QR
 * from a case's Citizen Trail tab can confirm the hash chain is intact —
 * without logging in, and (via the offline copy) without this app's
 * server being reachable.
 */
export function EvidenceVerifyPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    if (!id) return;
    const live = getCase(id);
    if (live) {
      verifyTrail(live).then((valid) =>
        setState({ phase: "done", record: live, valid, source: "live workspace" }),
      );
      return;
    }
    const offline = getOfflineRecord(id);
    if (offline) {
      const asRecord = {
        suchnaId: offline.payload.suchnaId,
        subject: offline.subject,
        authorityName: offline.authorityName,
        status: offline.payload.status,
        trailVersion: offline.payload.trailVersion,
        events: offline.events,
        evidence: offline.evidence,
      } as unknown as CaseRecord;
      verifyTrail(asRecord).then((valid) =>
        setState({ phase: "done", record: asRecord, valid, source: "offline copy" }),
      );
      return;
    }
    setState({ phase: "loading" });
  }, [id]);

  const notFound =
    id && !getCase(id) && !getOfflineRecord(id);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav minimal />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {notFound ? (
            <div className="card p-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-ink-3">
                help
              </span>
              <p className="card-title mt-2">No trail found</p>
              <p className="text-[13px] text-ink-3 mt-1">
                There's no record for <span className="mono">{id}</span> in this
                browser. Open it on the device that holds the citizen copy.
              </p>
              <Link to="/" className="btn mt-4">
                Back to home
              </Link>
            </div>
          ) : state.phase === "loading" ? (
            <div className="card p-10 text-center text-[13px] text-ink-3">
              Verifying…
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div
                className={`p-6 text-center border-b border-line ${
                  state.valid ? "bg-success-wash" : "bg-danger-wash"
                }`}
              >
                <span
                  className={`grid place-items-center h-14 w-14 rounded-full mx-auto mb-3 ${
                    state.valid ? "bg-success text-white" : "bg-danger text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[28px] filled-icon">
                    {state.valid ? "verified" : "gpp_bad"}
                  </span>
                </span>
                <h1 className="text-title">
                  {state.valid ? "Citizen trail verified" : "Verification failed"}
                </h1>
                <p className="text-[12.5px] text-ink-2 mt-1 max-w-sm mx-auto">
                  {state.valid
                    ? "The hash chain recomputed from this record's event history is intact — nothing has been altered."
                    : "The recomputed hash chain does not match the stored trail. Its event history may have been edited."}
                </p>
              </div>

              {(() => {
                const p = buildTrailPayload(state.record);
                return (
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="kv-label">Suchna ID</p>
                        <p className="text-title mono">{p.suchnaId}</p>
                      </div>
                      <span className="chip chip-success">Trail v{p.trailVersion}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Stat label="Events" value={String(p.eventCount)} />
                      <Stat label="Status" value={p.status.replace(/_/g, " ")} />
                      <Stat label="Verified via" value={state.source} />
                      <Stat label="Checked" value={formatDateTime(p.lastVerified)} />
                    </div>
                    <div>
                      <p className="kv-label">Record hash</p>
                      <p className="mono text-ink break-all">{p.hash ?? "—"}</p>
                    </div>
                    <p className="meta">
                      This record matches the integrity information stored in the
                      citizen-held trail. It is a tamper-evidence check, not a
                      statement about the accuracy of the government's response.
                    </p>
                    <button onClick={() => window.print()} className="btn btn-sm self-start">
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      Print verification
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="kv-label">{label}</p>
      <p className="text-[13px] text-ink capitalize">{value}</p>
    </div>
  );
}
