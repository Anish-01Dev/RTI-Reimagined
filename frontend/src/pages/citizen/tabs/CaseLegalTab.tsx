import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { daysRemainingFor } from "@/domain/actionEngine";
import { APPEAL_CITATION, buildAppealNarrative } from "@/domain/appealDraft";
import { legalRuleForStage, type CaseStage } from "@/domain/legalRules";
import { addEvent, fileFirstAppeal } from "@/domain/store";
import type { CaseRecord } from "@/domain/types";
import { formatDate } from "@/lib/format";

function stageFor(record: CaseRecord): CaseStage {
  if (record.status === "OVERDUE") return "OVERDUE";
  if (record.status === "FIRST_APPEAL") return "FIRST_APPEAL";
  if (record.status === "SECOND_APPEAL") return "SECOND_APPEAL";
  if (record.status === "RESPONSE_RELEASED") return "RESPONSE_RECEIVED";
  const rem = daysRemainingFor(record);
  if (rem !== null && rem <= 5) return "RESPONSE_DUE_SOON";
  return "SUBMITTED";
}

const SOURCE_LABEL: Record<string, string> = {
  citizen: "Citizen draft",
  doctor: "Application Doctor revision",
  system: "Submitted request",
};

export function CaseLegalTab() {
  const record = useOutletContext<CaseRecord>();
  const rem = daysRemainingFor(record);
  const rule = legalRuleForStage(stageFor(record));
  const [narrative, setNarrative] = useState(() => buildAppealNarrative(record));
  const [filed, setFiled] = useState(
    record.status === "FIRST_APPEAL" || record.status === "SECOND_APPEAL",
  );
  const [copied, setCopied] = useState(false);
  const canAppeal = record.status === "OVERDUE";

  async function handleFile() {
    await fileFirstAppeal(record.suchnaId, narrative);
    await addEvent(
      record.suchnaId,
      "APPEAL_SUBMITTED",
      "First Appeal filed with the Appellate Authority",
      "Citizen",
    );
    setFiled(true);
  }

  function copyNarrative() {
    navigator.clipboard.writeText(narrative).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadNarrative() {
    const blob = new Blob([narrative], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.suchnaId}-first-appeal.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="min-w-0 flex flex-col gap-5">
        {/* Deadline / status */}
        <div
          className={`card p-4 ${record.status === "OVERDUE" ? "border-l-2 border-l-danger" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">
                {record.status === "OVERDUE"
                  ? "Response deadline"
                  : record.status === "RESPONSE_RELEASED"
                    ? "Response received"
                    : "Statutory response window"}
              </p>
              <p
                className={`text-[26px] font-semibold tnum ${
                  rem !== null && rem < 0
                    ? "text-danger"
                    : rem !== null && rem <= 5
                      ? "text-warn"
                      : "text-ink"
                }`}
              >
                {rem === null
                  ? record.status === "RESPONSE_RELEASED"
                    ? "On record"
                    : "—"
                  : rem < 0
                    ? `${Math.abs(rem)} days overdue`
                    : `${rem} days remaining`}
              </p>
              {record.responseDueAt && (
                <p className="meta mt-0.5">
                  Deadline {formatDate(record.responseDueAt)}
                </p>
              )}
            </div>
            {rule?.recommendedAction && (
              <div className="text-right">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-3 font-semibold">
                  Next step
                </p>
                <p className="text-[13px] font-medium text-ink mt-0.5 max-w-[16ch]">
                  {rule.recommendedAction}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Appeal builder */}
        {(canAppeal || filed) && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="section-label">First appeal</h2>
              <span className="chip chip-neutral">{APPEAL_CITATION}</span>
            </div>
            {filed ? (
              <div className="inset p-3">
                <p className="text-[12.5px] font-semibold text-success flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Appeal filed and recorded on the trail
                </p>
                <p className="meta mt-1">
                  {record.appealReason ?? narrative.split("\n")[0]}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[12.5px] text-ink-3 mb-2">
                  Drafted from this case's own facts — Suchna ID, verbatim
                  request, authority and dates. Edit before filing.
                </p>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  rows={9}
                  className="field font-serif text-[13.5px] leading-relaxed"
                />
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <button onClick={handleFile} className="btn btn-sm btn-primary">
                    File first appeal
                  </button>
                  <button onClick={copyNarrative} className="btn btn-sm">
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button onClick={downloadNarrative} className="btn btn-sm">
                    Download .txt
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Version history */}
        <div className="card p-4">
          <h2 className="section-label mb-3">Request version history</h2>
          <ol className="flex flex-col gap-2">
            {record.versions.map((v) => (
              <li key={v.version} className="inset p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-ink">
                    v{v.version} · {SOURCE_LABEL[v.source] ?? v.label}
                  </span>
                  <time className="meta">{formatDate(v.createdAt)}</time>
                </div>
                <p className="font-serif text-[13px] text-ink-2 leading-snug">
                  {v.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        {rule && (
          <div className="card p-4">
            <p className="eyebrow mb-1.5">Process guidance — not legal advice</p>
            <p className="text-[13.5px] font-semibold text-ink">{rule.title}</p>
            <p className="text-[12.5px] text-ink-2 mt-1 leading-snug">
              {rule.guidance}
            </p>
            <p className="meta mt-2">
              {rule.provision} · {rule.source}
            </p>
          </div>
        )}
        {record.status === "FIRST_APPEAL" && (
          <div className="card p-4">
            <p className="eyebrow mb-1.5">Second appeal window</p>
            <p className="text-[12.5px] text-ink-2 leading-snug">
              If the First Appeal is not decided within 45 days, or is decided
              unfavourably, a Second Appeal may be filed with the Information
              Commission within 90 days under Section 19(3).
            </p>
          </div>
        )}
        <div className="card p-4">
          <p className="eyebrow mb-2">On this case</p>
          <dl className="flex flex-col gap-1.5 text-[12.5px]">
            <Row label="Filed" value={record.submittedAt ? formatDate(record.submittedAt) : "—"} />
            <Row label="Status" value={record.status.replace(/_/g, " ").toLowerCase()} />
            <Row
              label="Appeal ready"
              value={canAppeal || filed ? "Yes" : "Not yet"}
            />
          </dl>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-ink text-right capitalize">{value}</dd>
    </div>
  );
}
