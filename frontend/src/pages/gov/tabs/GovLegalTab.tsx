import { useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import { daysRemainingFor } from "@/domain/actionEngine";
import { legalRuleForStage, type CaseStage } from "@/domain/legalRules";
import type { CaseRecord } from "@/domain/types";

function stageFor(record: CaseRecord): CaseStage {
  if (record.status === "OVERDUE") return "OVERDUE";
  if (record.status === "FIRST_APPEAL") return "FIRST_APPEAL";
  if (record.status === "RESPONSE_RELEASED") return "RESPONSE_RECEIVED";
  const r = daysRemainingFor(record);
  if (r !== null && r <= 5) return "RESPONSE_DUE_SOON";
  return "SUBMITTED";
}

const REVIEW = [
  "No Section 8/9 exemption applies to the records requested",
  "The responding department holds the requested records directly",
  "The response addresses every item in the original request",
  "Third-party information, if any, has been handled under Section 11",
];

export function GovLegalTab() {
  const record = useOutletContext<CaseRecord>();
  const rem = daysRemainingFor(record);
  const rule = legalRuleForStage(stageFor(record));

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid gap-px bg-gov-line border border-gov-line rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}
      >
        <Cell label="Status" value={record.status.replace(/_/g, " ").toLowerCase()} />
        <Cell
          label={rem !== null && rem < 0 ? "Days overdue" : "Days remaining"}
          value={rem !== null ? String(Math.abs(rem)) : "—"}
          tone={rem !== null && rem < 0 ? "danger" : undefined}
        />
        <Cell label="Provision" value={rule?.provision ?? "—"} />
        <Cell label="Required action" value={rule?.recommendedAction ?? "None"} />
      </div>

      {rule && (
        <GovCard className="p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-blue-300 mb-1.5">
            Process guidance — not legal advice
          </p>
          <p className="text-[14px] font-semibold text-gov-ink">{rule.title}</p>
          <p className="text-[12.5px] text-gov-ink-2 mt-1 leading-relaxed">
            {rule.guidance}
          </p>
          <p className="text-[11px] font-mono text-gov-ink-3 mt-2">
            {rule.provision} · {rule.source}
          </p>
        </GovCard>
      )}

      <GovCard className="p-4">
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-2.5">
          Compliance review items
        </p>
        <ul className="flex flex-col gap-1.5">
          {REVIEW.map((r) => (
            <li key={r} className="flex gap-2 text-[12.5px] text-gov-ink-2">
              <span className="material-symbols-outlined text-[15px] text-gov-ink-3 mt-0.5">
                check_box_outline_blank
              </span>
              {r}
            </li>
          ))}
        </ul>
      </GovCard>
    </div>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="bg-gov-panel px-3.5 py-3">
      <p className="text-[10.5px] uppercase tracking-wide text-gov-ink-3 font-semibold">
        {label}
      </p>
      <p
        className={`text-[13px] font-semibold mt-0.5 capitalize ${tone === "danger" ? "text-red-400" : "text-gov-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}
