import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { buildTrailPayload, verifyTrail } from "@/domain/integrity";
import { getCase } from "@/domain/store";
import type { CaseRecord } from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { getOfflineRecord } from "@/offline/citizenRecord";

type State = { phase: "loading" } | { phase: "done"; record: CaseRecord; valid: boolean };

/** Public, unauthenticated verification — anyone with a Suchna ID or the
 * QR from a case's Unkillable RTI tab can confirm the trail's hash chain
 * is intact, without logging in and without depending on the citizen's
 * or the authority's own view of the case. */
export function EvidenceVerifyPage() {
  const { id } = useParams<{ id: string }>();
  // Prefer the citizen-held copy created from the QR/offline record. If the
  // presenter has not saved one yet, fall back to the active demo case store.
  const offline = id ? getOfflineRecord(id) : undefined;
  const storeRecord = id ? getCase(id) : undefined;
  const record =
    offline && id
      ? ({
          suchnaId: id,
          backendId: null,
          subject: offline.subject,
          authorityName: offline.authorityName,
          department: "",
          citizenName: "",
          originalRequest: "",
          status: offline.payload.status as CaseRecord["status"],
          submittedAt: null,
          responseDueAt: null,
          createdAt: offline.savedAt,
          updatedAt: offline.savedAt,
          trailVersion: offline.payload.trailVersion,
          govStage: "RECEIVED",
          versions: [],
          events: offline.events,
          evidence: offline.evidence,
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
          category: "",
        } satisfies CaseRecord)
      : storeRecord;
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    if (!record) return;
    verifyTrail(record).then((valid) => setState({ phase: "done", record, valid }));
  }, [record]);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
      <TopNav minimal />
      <main className="flex-grow flex flex-col items-center justify-center p-md md:p-3xl max-w-container-max mx-auto w-full">
        <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          {!record && (
            <div className="p-xl text-center">
              <span className="material-symbols-outlined text-4xl text-error mb-md block">error</span>
              <p className="text-on-surface-variant">No trail found for this Suchna ID.</p>
            </div>
          )}

          {record && state.phase === "loading" && (
            <div className="p-3xl text-center text-on-surface-variant">Verifying…</div>
          )}

          {record && state.phase === "done" && (
            <>
              <div
                className={`p-xl flex flex-col items-center justify-center text-center border-b border-outline-variant ${
                  state.valid
                    ? "bg-tertiary-container/10"
                    : "bg-error-container/40"
                }`}
              >
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center mb-md shadow-sm ${
                    state.valid
                      ? "bg-tertiary-container text-on-tertiary"
                      : "bg-error text-on-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px] filled-icon">
                    {state.valid ? "check_circle" : "gpp_bad"}
                  </span>
                </div>
                <h1 className="font-headline-md text-headline-md text-tertiary-fixed-variant mb-xs">
                  {state.valid
                    ? "Suchna Trail Verified"
                    : "Verification Failed"}
                </h1>
                <p className="text-on-surface-variant max-w-md">
                  {state.valid
                    ? "This trail's hash chain is intact — nothing in its recorded event history has been altered."
                    : "The recomputed hash chain does not match the stored trail. Its event history may have been edited."}
                </p>
              </div>

              <div className="p-xl space-y-lg">
                {(() => {
                  const payload = buildTrailPayload(state.record);
                  return (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md pb-lg border-b border-surface-variant">
                        <div>
                          <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">
                            Suchna ID
                          </p>
                          <p className="text-headline-md font-headline-md text-on-surface">
                            {payload.suchnaId}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-xs px-sm py-1 bg-tertiary-container/10 text-tertiary-fixed-variant rounded-full border border-tertiary-container/20">
                          <span className="material-symbols-outlined text-[16px] filled-icon">
                            verified
                          </span>
                          <span className="text-status-label font-status-label">
                            Trail v{payload.trailVersion}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-md pb-lg border-b border-surface-variant text-sm">
                        <Stat
                          label="Events"
                          value={String(payload.eventCount)}
                        />
                        <Stat
                          label="Status"
                          value={payload.status.replace(/_/g, " ")}
                        />
                        <Stat label="Authority" value={payload.authority} />
                        <Stat
                          label="Verified against"
                          value="Citizen-held trail"
                        />
                      </div>

                      <div>
                        <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">
                          Record hash
                        </p>
                        <p className="font-mono text-body-sm text-on-surface break-all">
                          {payload.hash ?? "—"}
                        </p>
                      </div>

                      <p className="text-label-caps text-label-caps text-on-surface-variant">
                        Checked {formatDateTime(payload.lastVerified)}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="p-lg bg-surface-bright border-t border-outline-variant flex justify-center">
                <button
                  className="bg-primary text-on-primary font-status-label text-status-label px-lg py-sm rounded-lg hover:bg-primary-fixed-variant transition-colors flex items-center gap-xs shadow-sm"
                  onClick={() => window.print()}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    print
                  </span>
                  Print Verification
                </button>
              </div>
            </>
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
      <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-on-surface">{value}</p>
    </div>
  );
}
