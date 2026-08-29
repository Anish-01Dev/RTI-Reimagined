import { Link } from "react-router-dom";
import { GovCard, GovMetrics, GovPage, GovSection } from "@/components/gov/GovUI";
import { getAllCases } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { daysRemainingFor } from "@/domain/actionEngine";
import { relativeTime } from "@/lib/format";

const PIPELINE: { stage: string; label: string }[] = [
  { stage: "RECEIVED", label: "Received" },
  { stage: "UNDER_REVIEW", label: "Under review" },
  { stage: "INFO_LOCATED", label: "Information located" },
  { stage: "RESPONSE_DRAFTED", label: "Response drafted" },
  { stage: "COMPLIANCE_REVIEW", label: "Compliance review" },
  { stage: "READY_TO_RELEASE", label: "Ready to release" },
  { stage: "RESPONSE_RELEASED", label: "Released" },
];

export function ResponseReviewPage() {
  const cases = useStore(getAllCases);
  const active = cases.filter((c) => c.status !== "CLOSED");

  const drafting = cases.filter((c) =>
    ["RESPONSE_DRAFTED", "COMPLIANCE_REVIEW", "READY_TO_RELEASE"].includes(
      c.govStage,
    ),
  );

  return (
    <GovPage
      title="Response Review"
      eyebrow="Operations"
      subtitle="Where every open request sits in the drafting-to-release pipeline."
    >
      <GovMetrics
        items={[
          {
            label: "In review",
            value: cases.filter((c) => c.govStage === "UNDER_REVIEW").length,
          },
          {
            label: "Draft / compliance",
            value: drafting.length,
            tone: drafting.length ? "warn" : undefined,
          },
          {
            label: "Ready to release",
            value: cases.filter((c) => c.govStage === "READY_TO_RELEASE").length,
          },
          {
            label: "Released this workspace",
            value: cases.filter((c) => c.govStage === "RESPONSE_RELEASED").length,
            tone: "success",
          },
        ]}
      />

      <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${PIPELINE.length}, minmax(0,1fr))` }}>
        {PIPELINE.map(({ stage, label }) => {
          const inStage = active.filter((c) => c.govStage === stage);
          return (
            <GovCard key={stage} className="p-2.5 min-h-[180px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] uppercase tracking-wide font-semibold text-gov-ink-3">
                  {label}
                </span>
                <span className="text-[11px] font-semibold text-gov-ink tnum">
                  {inStage.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {inStage.map((c) => {
                  const rem = daysRemainingFor(c);
                  return (
                    <Link
                      key={c.suchnaId}
                      to={`/gov/cases/${c.suchnaId}/response`}
                      className="block rounded border border-gov-line bg-gov-panel-2 p-2 hover:border-blue-500/50"
                    >
                      <p className="text-[11.5px] font-medium text-gov-ink leading-snug line-clamp-2">
                        {c.subject}
                      </p>
                      <p className="text-[10px] text-gov-ink-3 mt-1 flex items-center justify-between">
                        <span className="font-mono">{c.suchnaId.slice(-6)}</span>
                        <span
                          className={
                            rem !== null && rem < 0
                              ? "text-red-400"
                              : rem !== null && rem <= 5
                                ? "text-amber-400"
                                : ""
                          }
                        >
                          {rem === null ? "" : rem < 0 ? `${Math.abs(rem)}d over` : `${rem}d`}
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </div>
            </GovCard>
          );
        })}
      </div>

      <div className="mt-6" />
      <GovSection title="Recently released">
        <GovCard className="divide-y divide-gov-line">
          {cases
            .filter((c) => c.status === "RESPONSE_RELEASED")
            .slice(0, 6)
            .map((c) => (
              <Link
                key={c.suchnaId}
                to={`/gov/cases/${c.suchnaId}/audit`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gov-panel-2"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-gov-ink font-medium truncate">
                    {c.subject}
                  </p>
                  <p className="text-[11px] text-gov-ink-3 font-mono">
                    {c.suchnaId} · {c.authorityName}
                  </p>
                </div>
                <span className="text-[11px] text-gov-ink-3 shrink-0">
                  {relativeTime(c.updatedAt)}
                </span>
              </Link>
            ))}
        </GovCard>
      </GovSection>
    </GovPage>
  );
}
