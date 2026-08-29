import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { EmptyState, MetricStrip, PageHeader } from "@/components/ui/Primitives";
import { computeNextAction, daysRemainingFor } from "@/domain/actionEngine";
import { bucket, citizenCases } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import { formatDate } from "@/lib/format";

export function DeadlinesPage() {
  const cases = useStore(citizenCases);
  const b = bucket(cases);

  const withClock = cases
    .filter((c) => c.responseDueAt && c.status !== "CLOSED")
    .sort(
      (a, b2) =>
        (daysRemainingFor(a) ?? 9999) - (daysRemainingFor(b2) ?? 9999),
    );

  const onTrack = withClock.filter((c) => {
    const r = daysRemainingFor(c);
    return c.status !== "OVERDUE" && r !== null && r > 5;
  });

  if (withClock.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Deadlines" eyebrow="The Rights Clock" />
        <EmptyState icon="schedule" title="No live deadlines">
          Every RTI you file starts a 30-day statutory clock under Section 7(1).
          Deadlines and appeal eligibility will show here.
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Deadlines"
        eyebrow="The Rights Clock"
        subtitle="The statutory response window on every open request, counted from the day it was filed."
      />
      <MetricStrip
        items={[
          { label: "Overdue", value: b.overdue.length, tone: b.overdue.length ? "danger" : undefined },
          { label: "Due within 5 days", value: b.dueSoon.length, tone: b.dueSoon.length ? "warn" : undefined },
          { label: "On track", value: onTrack.length },
          { label: "Responded", value: b.responded.length, tone: "success" },
        ]}
      />

      <div className="card overflow-x-auto mt-5">
        <table className="data-table rows-link">
          <thead>
            <tr>
              <th>Request</th>
              <th>Status</th>
              <th>Deadline</th>
              <th className="text-right">Remaining</th>
              <th>Recommended step</th>
            </tr>
          </thead>
          <tbody>
            {withClock.map((c) => {
              const rem = daysRemainingFor(c);
              const action = computeNextAction(c);
              return (
                <tr key={c.suchnaId}>
                  <td>
                    <Link
                      to={`/app/cases/${c.suchnaId}/timeline`}
                      className="block text-[13px] font-medium text-ink hover:text-primary truncate max-w-[28ch]"
                    >
                      {c.subject}
                    </Link>
                    <span className="mono text-ink-3">{c.suchnaId}</span>
                  </td>
                  <td>
                    <CaseStatusPill status={c.status} />
                  </td>
                  <td className="text-ink-3 whitespace-nowrap">
                    {formatDate(c.responseDueAt)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span
                      className={`font-semibold tnum ${
                        rem === null
                          ? "text-ink-3"
                          : rem < 0
                            ? "text-danger"
                            : rem <= 5
                              ? "text-warn"
                              : "text-ink-2"
                      }`}
                    >
                      {rem === null
                        ? "—"
                        : rem < 0
                          ? `${Math.abs(rem)}d over`
                          : `${rem}d`}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={action.route(c.suchnaId)}
                      className={`text-[12.5px] font-medium hover:underline ${
                        action.urgent ? "text-danger" : "text-primary"
                      }`}
                    >
                      {action.label}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
