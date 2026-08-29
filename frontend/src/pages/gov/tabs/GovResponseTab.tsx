import { useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import {
  GOV_STAGE_ORDER,
  type CaseRecord,
  type GovStage,
} from "@/domain/types";
import {
  addAudit,
  addEvent,
  nextGovStage,
  transitionGovStage,
  updateChecklist,
} from "@/domain/store";
import { getSession } from "@/lib/demoIdentity";

const CHECKLIST: { key: keyof CaseRecord["reviewChecklist"]; label: string }[] = [
  { key: "requestUnderstood", label: "Request understood" },
  { key: "recordsIdentified", label: "Records identified" },
  { key: "documentsLocated", label: "Relevant documents located" },
  { key: "exemptionReviewDone", label: "Section 8/9 exemption review completed" },
  { key: "responsePrepared", label: "Response prepared" },
  { key: "responseVerified", label: "Response verified against every item" },
  { key: "responseReleased", label: "Response released" },
];

const STAGE_LABEL: Record<GovStage, string> = {
  RECEIVED: "Received",
  UNDER_REVIEW: "Under review",
  INFO_LOCATED: "Information located",
  RESPONSE_DRAFTED: "Response drafted",
  COMPLIANCE_REVIEW: "Compliance review",
  READY_TO_RELEASE: "Ready to release",
  RESPONSE_RELEASED: "Response released",
};

export function GovResponseTab() {
  const record = useOutletContext<CaseRecord>();
  const session = getSession();
  const next = nextGovStage(record.govStage);
  const currentIndex = GOV_STAGE_ORDER.indexOf(record.govStage);

  async function advance() {
    if (!next || !session) return;
    await transitionGovStage(record.suchnaId, next, session.name);
    if (next === "RESPONSE_RELEASED") {
      await addEvent(
        record.suchnaId,
        "RESPONSE_RECEIVED",
        "Response released to the citizen's trail",
        session.name,
        { statusOverride: "RESPONSE_RELEASED" },
      );
    }
  }

  function toggle(key: keyof CaseRecord["reviewChecklist"]) {
    updateChecklist(record.suchnaId, key, !record.reviewChecklist[key]);
    if (session)
      addAudit(
        record.suchnaId,
        session.name,
        `Checklist ${record.reviewChecklist[key] ? "cleared" : "marked"}: ${key}`,
      );
  }

  return (
    <div className="flex flex-col gap-5">
      <GovCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3">
            Workflow stage
          </h2>
          {next && (
            <button
              onClick={advance}
              className="h-8 px-3 rounded-md bg-blue-600 text-white text-[12.5px] font-semibold hover:bg-blue-700"
            >
              Move to {STAGE_LABEL[next]}
            </button>
          )}
        </div>
        <ol className="flex items-center gap-1.5 flex-wrap">
          {GOV_STAGE_ORDER.map((stage, i) => (
            <li key={stage} className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold rounded px-2 py-1 border ${
                  i === currentIndex
                    ? "bg-blue-600 border-blue-600 text-white"
                    : i < currentIndex
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-gov-line text-gov-ink-3"
                }`}
              >
                {STAGE_LABEL[stage]}
              </span>
              {i < GOV_STAGE_ORDER.length - 1 && (
                <span className="text-gov-ink-3">›</span>
              )}
            </li>
          ))}
        </ol>
        <p className="text-[11.5px] text-gov-ink-3 mt-3">
          Every stage change writes a timestamped event to the shared trail and
          an entry to this case's audit log.
        </p>
      </GovCard>

      <GovCard className="p-4">
        <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
          Review checklist
        </h2>
        <div className="flex flex-col gap-1.5">
          {CHECKLIST.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 rounded-md border border-gov-line bg-gov-panel-2 px-3 py-2 cursor-pointer hover:border-gov-line"
            >
              <input
                type="checkbox"
                checked={record.reviewChecklist[item.key]}
                onChange={() => toggle(item.key)}
                className="h-4 w-4 accent-blue-500"
              />
              <span
                className={`text-[12.5px] ${record.reviewChecklist[item.key] ? "text-gov-ink-3 line-through" : "text-gov-ink"}`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </GovCard>
    </div>
  );
}
