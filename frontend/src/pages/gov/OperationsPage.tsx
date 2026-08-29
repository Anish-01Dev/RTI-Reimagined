import { Link } from "react-router-dom";
import {
  GovCaseTable,
  GovCard,
  GovMetrics,
  GovPage,
  GovSection,
} from "@/components/gov/GovUI";
import { EVENT_LABEL } from "@/components/case/TrailTimeline";
import { getAllCases } from "@/domain/store";
import { bucket, recentActivity } from "@/domain/selectors";
import { daysRemainingFor } from "@/domain/actionEngine";
import { GOV_STAGE_ORDER } from "@/domain/types";
import { useStore } from "@/hooks/useStore";
import { getSession } from "@/lib/demoIdentity";
import { relativeTime } from "@/lib/format";

const STAGE_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  UNDER_REVIEW: "Under review",
  INFO_LOCATED: "Info located",
  RESPONSE_DRAFTED: "Drafted",
  COMPLIANCE_REVIEW: "Compliance",
  READY_TO_RELEASE: "Ready",
  RESPONSE_RELEASED: "Released",
};

export function GovOperationsPage() {
  const session = getSession();
  const cases = useStore(getAllCases);
  const b = bucket(cases);
  const activity = recentActivity(cases, 7);

  const awaitingReview = cases.filter(
    (c) => c.govStage === "UNDER_REVIEW" || c.govStage === "INFO_LOCATED",
  );
  const queue = b.needsAttention
    .slice()
    .sort((a, c) => (daysRemainingFor(a) ?? 0) - (daysRemainingFor(c) ?? 0));

  const resolved = cases.filter((c) => c.status === "RESPONSE_RELEASED");
  const responseRate = cases.length
    ? Math.round((resolved.length / cases.length) * 100)
    : 0;

  return (
    <GovPage
      title="Government Operations"
      eyebrow="Public Information Office"
      subtitle={`Requests requiring attention · ${session?.authority ?? "your authority"}`}
    >
      <GovMetrics
        items={[
          { label: "Open requests", value: b.active.length + b.appeals.length },
          { label: "Due today / soon", value: b.dueSoon.length, tone: b.dueSoon.length ? "warn" : undefined },
          { label: "Overdue", value: b.overdue.length, tone: b.overdue.length ? "danger" : undefined },
          { label: "Awaiting review", value: awaitingReview.length },
          { label: "Response rate", value: `${responseRate}%`, tone: "success" },
        ]}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <div className="flex flex-col gap-6 min-w-0">
          <GovSection
            title="Today's queue"
            right={
              <Link to="/gov/cases" className="text-[12px] text-blue-400 hover:underline">
                Full queue
              </Link>
            }
          >
            <GovCaseTable
              cases={queue}
              columns={["priority", "id", "subject", "department", "stage", "deadline"]}
              empty="Nothing urgent right now."
            />
          </GovSection>

          <GovSection title="Response pipeline">
            <GovCard className="p-4">
              <div className="flex items-end gap-1.5">
                {GOV_STAGE_ORDER.map((stage) => {
                  const n = cases.filter((c) => c.govStage === stage).length;
                  const max = Math.max(
                    ...GOV_STAGE_ORDER.map(
                      (s) => cases.filter((c) => c.govStage === s).length,
                    ),
                    1,
                  );
                  return (
                    <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-gov-ink tnum">
                        {n}
                      </span>
                      <div className="w-full h-24 bg-gov-panel-2 rounded flex items-end overflow-hidden">
                        <div
                          className="w-full bg-blue-500/70"
                          style={{ height: `${(n / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9.5px] text-gov-ink-3 text-center leading-tight">
                        {STAGE_LABEL[stage]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GovCard>
          </GovSection>
        </div>

        <div className="flex flex-col gap-6">
          <GovSection title="Recent activity">
            <GovCard className="p-3 flex flex-col gap-2.5">
              {activity.map((e) => (
                <div key={e.id} className="flex gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-gov-ink leading-snug">
                      {EVENT_LABEL[e.type]}
                    </p>
                    <p className="text-[11px] text-gov-ink-3">
                      <Link
                        to={`/gov/cases/${e.suchnaId}`}
                        className="hover:text-gov-ink font-mono"
                      >
                        {e.suchnaId}
                      </Link>{" "}
                      · {relativeTime(e.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </GovCard>
          </GovSection>

          <GovSection title="Compliance">
            <GovCard className="p-4 flex flex-col gap-2.5 text-[12.5px]">
              <Row label="Response rate" value={`${responseRate}%`} />
              <Row
                label="Overdue rate"
                value={`${cases.length ? Math.round((b.overdue.length / cases.length) * 100) : 0}%`}
                tone="danger"
              />
              <Row
                label="Appeals open"
                value={String(b.appeals.length)}
                tone={b.appeals.length ? "warn" : undefined}
              />
              <Link
                to="/gov/analytics"
                className="text-[12px] text-blue-400 hover:underline mt-1"
              >
                Open analytics →
              </Link>
            </GovCard>
          </GovSection>
        </div>
      </div>
    </GovPage>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "warn";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gov-ink-3">{label}</span>
      <span
        className={`font-semibold tnum ${
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
