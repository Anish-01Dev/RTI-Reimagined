import { Link, useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import { analyzeRequest } from "@/lib/applicationDoctor";
import { daysRemainingFor } from "@/domain/actionEngine";
import { legalRuleForStage } from "@/domain/legalRules";
import type { CaseRecord } from "@/domain/types";
import { formatDate } from "@/lib/format";

export function GovOverviewTab() {
  const record = useOutletContext<CaseRecord>();
  const analysis = analyzeRequest(record.originalRequest);
  const rem = daysRemainingFor(record);
  const rule = legalRuleForStage(
    record.status === "OVERDUE" ? "OVERDUE" : "SUBMITTED",
  );

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="min-w-0 flex flex-col gap-4">
        <GovCard className="p-4">
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-2">
            Citizen request
          </h2>
          <p className="font-serif text-[14px] text-gov-ink leading-relaxed">
            {record.originalRequest}
          </p>
        </GovCard>

        <GovCard className="p-4">
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
            Request assessment
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Fact label="Quality" value={`${analysis.clarity}/100`} />
            <Fact label="Specificity" value={`${analysis.specificity}/100`} />
            <Fact
              label="Time period"
              value={analysis.timePeriodPresent ? "Stated" : "Not stated"}
            />
            <Fact
              label="Held here"
              value={analysis.authorityConfidence === "Likely correct" ? "Likely" : "Verify"}
            />
          </div>
          {analysis.issue && (
            <p className="text-[12px] text-amber-400 mt-3 leading-snug">
              {analysis.issue}
            </p>
          )}
        </GovCard>

        <GovCard className="p-4">
          <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
            Key dates
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Fact
              label="Received"
              value={record.submittedAt ? formatDate(record.submittedAt) : "—"}
            />
            <Fact
              label="Response due"
              value={record.responseDueAt ? formatDate(record.responseDueAt) : "—"}
            />
            <Fact
              label="Remaining"
              value={
                rem === null
                  ? "—"
                  : rem < 0
                    ? `${Math.abs(rem)}d overdue`
                    : `${rem} days`
              }
              tone={rem !== null && rem < 0 ? "danger" : rem !== null && rem <= 5 ? "warn" : undefined}
            />
          </div>
        </GovCard>
      </div>

      <aside className="flex flex-col gap-3">
        <GovCard className="p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-1.5">
            Next step
          </p>
          <p className="text-[13.5px] font-medium text-gov-ink">
            {rule?.recommendedAction ?? "Progress the response."}
          </p>
          <Link
            to="response"
            className="mt-3 inline-flex items-center justify-center w-full h-8 rounded-md bg-blue-600 text-white text-[12.5px] font-semibold hover:bg-blue-700"
          >
            Open workflow
          </Link>
        </GovCard>
        <GovCard className="p-4">
          <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-2">
            Process basis
          </p>
          {rule && (
            <>
              <p className="text-[12.5px] text-gov-ink-2 leading-snug">
                {rule.guidance}
              </p>
              <p className="text-[11px] font-mono text-gov-ink-3 mt-2">
                {rule.provision} · {rule.source}
              </p>
            </>
          )}
        </GovCard>
      </aside>
    </div>
  );
}

function Fact({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warn";
}) {
  return (
    <div className="rounded-md border border-gov-line bg-gov-panel-2 p-2.5">
      <span className="text-[10.5px] uppercase tracking-wide text-gov-ink-3 block">
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold mt-0.5 block tnum ${
          tone === "danger"
            ? "text-red-400"
            : tone === "warn"
              ? "text-amber-400"
              : "text-gov-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
