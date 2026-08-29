import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { CaseTable } from "@/components/case/CaseTable";
import {
  DeadlinePill,
  EmptyState,
  MetricStrip,
  SectionTitle,
} from "@/components/ui/Primitives";
import { EVENT_LABEL } from "@/components/case/TrailTimeline";
import { computeNextAction, daysRemainingFor } from "@/domain/actionEngine";
import { bucket, citizenCases, recentActivity } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import { DEMO_CITIZEN } from "@/lib/demoIdentity";
import { formatDate, formatDateTime, relativeTime } from "@/lib/format";

export function CitizenOverviewPage() {
  const cases = useStore(citizenCases);
  const b = bucket(cases);
  const activity = recentActivity(cases, 6);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = DEMO_CITIZEN.name.split(" ")[0];

  if (cases.length === 0) {
    return (
      <PageContainer>
        <p className="eyebrow mb-1.5">Your information requests</p>
        <h1 className="page-title mb-5">{greeting}, {firstName}</h1>
        <EmptyState
          icon="folder_open"
          title="You haven't filed an RTI yet"
          primary={{ to: "/app/create", label: "Create your first RTI" }}
          secondary={{ to: "/how-it-works", label: "How it works" }}
        >
          <p>
            Start a request and Suchna Rakshak will draft it with you, track its
            journey against the statutory clock, preserve the evidence, watch the
            deadlines, and keep a citizen-held record you can verify
            independently of any portal.
          </p>
        </EmptyState>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {[
            ["draw", "Application Doctor", "A weak question rarely gets a useful answer. Every request is checked for specificity and record-orientation before it's filed."],
            ["schedule", "The Rights Clock", "The 30-day response window under Section 7(1) is tracked from the moment you file — you're told before it lapses, not after."],
            ["verified_user", "The citizen trail", "A hash-chained log of every event on your case that you can download, print or hand over as a QR."],
          ].map(([icon, title, body]) => (
            <div key={title} className="card p-4">
              <span className="material-symbols-outlined text-primary text-[20px]">
                {icon}
              </span>
              <p className="text-[13px] font-semibold text-ink mt-1.5">{title}</p>
              <p className="text-[12px] text-ink-3 mt-1 leading-snug">{body}</p>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="eyebrow mb-1.5">Your information requests</p>
          <h1 className="page-title">{greeting}, {firstName}</h1>
        </div>
        <Link to="/app/create" className="btn btn-primary">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New RTI
        </Link>
      </div>

      <MetricStrip
        items={[
          { label: "Active", value: b.active.length },
          { label: "Due soon", value: b.dueSoon.length, tone: b.dueSoon.length ? "warn" : undefined },
          { label: "Overdue", value: b.overdue.length, tone: b.overdue.length ? "danger" : undefined },
          { label: "Responses received", value: b.responded.length, tone: b.responded.length ? "success" : undefined },
          { label: "Appeals", value: b.appeals.length, tone: b.appeals.length ? "warn" : undefined },
        ]}
      />

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 mt-6">
        <div className="min-w-0 flex flex-col gap-6">
          {b.needsAttention.length > 0 && (
            <section>
              <SectionTitle>Action required</SectionTitle>
              <div className="flex flex-col gap-2">
                {b.needsAttention.map((c) => {
                  const action = computeNextAction(c);
                  const rem = daysRemainingFor(c);
                  return (
                    <Link
                      key={c.suchnaId}
                      to={`/app/cases/${c.suchnaId}`}
                      className={`card card-hover p-3.5 flex items-center gap-4 ${
                        action.urgent ? "border-l-2 border-l-danger" : "border-l-2 border-l-warn"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CaseStatusPill status={c.status} />
                          <span className="mono text-ink-3">{c.suchnaId}</span>
                        </div>
                        <p className="text-[13.5px] font-medium text-ink truncate">
                          {c.subject}
                        </p>
                        <p className="meta mt-0.5">
                          {c.status === "OVERDUE" && rem !== null
                            ? `${Math.abs(rem)} days overdue · `
                            : ""}
                          Recommended: {action.label}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-ink-3 text-[18px] shrink-0">
                        chevron_right
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <SectionTitle right={<Link to="/app/cases" className="text-[12px] font-medium text-primary hover:underline">View all</Link>}>
              My information trails
            </SectionTitle>
            <CaseTable
              cases={cases.slice(0, 6)}
              columns={["request", "authority", "status", "deadline", "activity"]}
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {b.dueSoon.length > 0 && (
            <section>
              <SectionTitle>Upcoming deadlines</SectionTitle>
              <div className="card divide-y divide-line">
                {b.dueSoon.map((c) => (
                  <Link
                    key={c.suchnaId}
                    to={`/app/cases/${c.suchnaId}/timeline`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-panel-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-ink truncate">
                        {c.subject}
                      </span>
                      <span className="meta">
                        Due {formatDate(c.responseDueAt)}
                      </span>
                    </span>
                    <DeadlinePill days={daysRemainingFor(c)} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>Recent activity</SectionTitle>
            <ol className="card p-3 flex flex-col gap-3">
              {activity.map((e) => (
                <li key={e.id} className="flex gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-ink leading-snug">
                      {EVENT_LABEL[e.type] ?? e.type.replace(/_/g, " ")}
                    </p>
                    <p className="meta">
                      <Link
                        to={`/app/cases/${e.suchnaId}`}
                        className="hover:text-ink underline decoration-line"
                      >
                        {e.suchnaId}
                      </Link>{" "}
                      · {relativeTime(e.timestamp)}
                    </p>
                  </div>
                  <time className="meta ml-auto shrink-0" title={formatDateTime(e.timestamp)}>
                    {formatDate(e.timestamp)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
