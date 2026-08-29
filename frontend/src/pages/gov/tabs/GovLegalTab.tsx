import { useOutletContext } from "react-router-dom";
import { daysRemainingFor } from "@/domain/actionEngine";
import { legalRuleForStage, type CaseStage } from "@/domain/legalRules";
import type { CaseRecord } from "@/domain/types";

function stageFor(record: CaseRecord): CaseStage {
  if (record.status === "OVERDUE") return "OVERDUE";
  if (record.status === "FIRST_APPEAL") return "FIRST_APPEAL";
  if (record.status === "RESPONSE_RELEASED") return "RESPONSE_RECEIVED";
  const remaining = daysRemainingFor(record);
  if (remaining !== null && remaining <= 5) return "RESPONSE_DUE_SOON";
  return "SUBMITTED";
}

export function GovLegalTab() {
  const record = useOutletContext<CaseRecord>();
  const remaining = daysRemainingFor(record);
  const rule = legalRuleForStage(stageFor(record));

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <Stat label="Status" value={record.status.replace(/_/g, " ")} />
        <Stat
          label={
            remaining !== null && remaining < 0
              ? "Days overdue"
              : "Days remaining"
          }
          value={remaining !== null ? String(Math.abs(remaining)) : "—"}
        />
        <Stat label="Process step" value={rule?.provision ?? "—"} />
        <Stat
          label="Required action"
          value={rule?.recommendedAction ?? "None"}
        />
      </div>

      {rule && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
          <p className="text-label-caps text-label-caps text-primary uppercase tracking-widest mb-sm">
            Process guidance — not legal advice
          </p>
          <h3 className="font-headline-md text-headline-md !text-lg text-on-surface mb-1">
            {rule.title}
          </h3>
          <p className="text-on-surface-variant mb-sm">{rule.guidance}</p>
          <p className="text-label-caps text-label-caps text-on-surface-variant">
            {rule.provision} · {rule.source}
          </p>
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-sm">
          Potential review items
        </p>
        <ul className="list-disc list-inside text-on-surface-variant space-y-1">
          <li>
            Confirm no Section 8/9 exemption applies to the records requested.
          </li>
          <li>
            Confirm the responding department holds the requested records
            directly.
          </li>
          <li>
            Confirm the response addresses every item in the original request.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
      <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-on-surface font-medium">{value}</p>
    </div>
  );
}
