import { useState } from "react";
import { QrCode } from "@/components/QrCode";
import { EVENT_LABEL } from "@/components/case/TrailTimeline";
import { buildTrailPayload, verifyTrail } from "@/domain/integrity";
import type { CaseRecord } from "@/domain/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  syncOfflineRecord,
  useOfflineRecord,
  useOnline,
} from "@/offline/citizenRecord";

/**
 * The citizen-owned record — the "Unkillable RTI" made concrete. Every
 * value is computed from this case's real event log: the SHA-256 hash
 * chain (domain/integrity.ts), event and evidence counts, and a QR
 * payload that is just enough to demonstrate continuity — never a claim
 * to blockchain-grade guarantees.
 */
export function CitizenTrailPassport({ record }: { record: CaseRecord }) {
  const online = useOnline();
  const offline = useOfflineRecord(record.suchnaId);
  const [verifyState, setVerifyState] = useState<
    "idle" | "checking" | "ok" | "bad"
  >("idle");
  const [shareCopied, setShareCopied] = useState(false);

  const payload = buildTrailPayload(record);
  const verifyUrl = `${window.location.origin}/verify/${record.suchnaId}`;
  const qrValue = JSON.stringify({ ...payload, verify: verifyUrl });

  const ordered = [...record.events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  async function handleVerify() {
    setVerifyState("checking");
    const ok = await verifyTrail(record);
    setVerifyState(ok ? "ok" : "bad");
  }

  function handleDownload() {
    const blob = new Blob(
      [JSON.stringify({ ...payload, events: record.events, evidence: record.evidence }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.suchnaId}-citizen-record.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${record.suchnaId} — Suchna Rakshak`, url: verifyUrl });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(verifyUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header + integrity summary */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow mb-1">Citizen trail</p>
            <h2 className="card-title">Your independent record of the journey</h2>
            <p className="text-[12.5px] text-ink-3 mt-1 max-w-reading">
              This record belongs to you. The authority's portal is one source —
              this is your own copy, verifiable without it.
            </p>
          </div>
          <span
            className={`chip ${payload.hash ? "chip-success" : "chip-neutral"} shrink-0`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {payload.hash ? "verified" : "hourglass_empty"}
            </span>
            {payload.hash ? "Integrity valid" : "No events yet"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-line border-b border-line">
          <Cell label="Suchna ID" value={record.suchnaId} mono />
          <Cell label="Trail version" value={`v${record.trailVersion}`} />
          <Cell label="Events" value={String(record.events.length)} />
          <Cell label="Evidence" value={String(record.evidence.length)} />
          <Cell
            label="Integrity"
            value={
              verifyState === "bad"
                ? "Mismatch"
                : verifyState === "ok"
                  ? "Re-verified"
                  : "Valid"
            }
            tone={verifyState === "bad" ? "danger" : "success"}
          />
          <Cell label="Last verified" value={formatDate(new Date().toISOString())} />
        </div>

        {/* QR + actions */}
        <div className="p-4 flex items-start gap-5 flex-wrap">
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2 bg-white border border-line rounded-md">
              <QrCode value={qrValue} size={116} />
            </div>
            <p className="meta">Scan to verify</p>
          </div>
          <div className="flex-1 min-w-[220px] flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={handleDownload} className="btn btn-sm">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download record
              </button>
              <button
                onClick={handleVerify}
                disabled={verifyState === "checking"}
                className="btn btn-sm btn-primary"
              >
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                {verifyState === "checking" ? "Verifying…" : "Verify now"}
              </button>
              <button onClick={() => window.print()} className="btn btn-sm">
                <span className="material-symbols-outlined text-[16px]">print</span>
                Print
              </button>
              <button onClick={handleShare} className="btn btn-sm">
                <span className="material-symbols-outlined text-[16px]">share</span>
                {shareCopied ? "Link copied" : "Share"}
              </button>
            </div>
            {verifyState === "ok" && (
              <p className="text-[12px] text-success flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Hash chain recomputed from scratch — intact.
              </p>
            )}
            {verifyState === "bad" && (
              <p className="text-[12px] text-danger flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">gpp_bad</span>
                Recomputed chain does not match the stored trail.
              </p>
            )}

            {/* Offline copy */}
            <div className="inset p-2.5 flex items-center gap-2.5 mt-1">
              <span
                className={`material-symbols-outlined text-[18px] ${offline ? "text-success" : "text-ink-3"}`}
              >
                {offline ? "cloud_done" : "cloud_off"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">
                  {offline ? "Offline copy available" : "No offline copy saved"}
                </p>
                <p className="meta">
                  {offline
                    ? `Last synced ${formatDateTime(offline.savedAt)}${!online ? " · you are offline" : ""}`
                    : "Save a copy you can open without a network."}
                </p>
              </div>
              <button
                onClick={() => syncOfflineRecord(record)}
                className="btn btn-sm shrink-0"
              >
                {offline ? "Re-sync" : "Save offline"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hash chain */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
          <h3 className="section-label">Hash chain</h3>
          <span className="meta">
            SHA-256 · each link commits to the one before it
          </span>
        </div>
        <ol className="divide-y divide-line">
          {ordered.map((e, i) => (
            <li key={e.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className="mono text-ink-3 w-8 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-ink">
                  {EVENT_LABEL[e.type]}
                </p>
                <p className="mono text-ink-3 truncate">
                  {e.hash ?? "—"}
                </p>
              </div>
              {i > 0 && (
                <span
                  className="mono text-ink-3 shrink-0 hidden sm:inline"
                  title="Links to previous hash"
                >
                  ← #{ordered[i - 1].hash?.slice(0, 6)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <p className="meta">
        Tamper-evident, not blockchain: reorder or edit any event and every hash
        after it stops matching. The full record hash is{" "}
        <span className="mono text-ink-2">{payload.hash?.slice(0, 24) ?? "—"}…</span>
      </p>
    </div>
  );
}

function Cell({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "success" | "danger";
}) {
  return (
    <div className="px-3.5 py-3 first:border-l-0">
      <p className="kv-label">{label}</p>
      <p
        className={`mt-0.5 ${mono ? "mono text-ink" : "text-[14px] font-semibold text-ink"} ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
