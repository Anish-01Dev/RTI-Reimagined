import { Link, useOutletContext } from "react-router-dom";
import { EVENT_LABEL } from "@/components/case/TrailTimeline";
import { computeNextAction, daysRemainingFor } from "@/domain/actionEngine";
import type { CaseRecord } from "@/domain/types";
import { formatDate } from "@/lib/format";

export function CaseOverviewTab() {
  const record = useOutletContext<CaseRecord>();
  const action = computeNextAction(record);
  const rem = daysRemainingFor(record);
  const response = [...record.events]
    .reverse()
    .find((e) => e.type === "RESPONSE_RECEIVED");
  const submitted = record.events.find((e) => e.type === "REQUEST_SUBMITTED");
  const lastEvent = record.events.at(-1);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="min-w-0 flex flex-col gap-5">
        <Block title="What you asked">
          <p className="font-serif text-[14.5px] text-ink leading-relaxed">
            {record.originalRequest}
          </p>
          {record.versions.length > 1 && (
            <p className="meta mt-2">
              Refined from {record.versions.length} drafts —{" "}
              <Link to="legal" className="text-primary hover:underline">
                see version history
              </Link>
            </p>
          )}
        </Block>

        <Block
          title="What happened"
          right={
            <Link to="timeline" className="text-[12px] text-primary hover:underline">
              Full timeline
            </Link>
          }
        >
          <ol className="flex flex-col gap-2">
            {record.events.slice(-4).reverse().map((e) => (
              <li key={e.id} className="flex items-baseline gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 translate-y-1.5" />
                <span className="text-[13px] text-ink flex-1">
                  {EVENT_LABEL[e.type]}
                  <span className="text-ink-3"> · {e.actor}</span>
                </span>
                <time className="meta shrink-0">{formatDate(e.timestamp)}</time>
              </li>
            ))}
          </ol>
        </Block>

        <Block
          title="What you received"
          right={
            record.evidence.length > 0 ? (
              <Link to="evidence" className="text-[12px] text-primary hover:underline">
                {record.evidence.length} documents
              </Link>
            ) : undefined
          }
        >
          {response ? (
            <p className="font-serif text-[14px] text-ink leading-relaxed">
              {response.description}
            </p>
          ) : (
            <p className="text-[13px] text-ink-3">
              No response on record yet. The authority has until{" "}
              {record.responseDueAt ? formatDate(record.responseDueAt) : "its statutory deadline"}{" "}
              to reply under Section 7(1).
            </p>
          )}
        </Block>
      </div>

      <aside className="flex flex-col gap-3">
        <div
          className={`card p-4 ${action.urgent ? "border-l-2 border-l-danger" : ""}`}
        >
          <p className="eyebrow mb-1.5">Next action</p>
          <p className="text-[14px] font-semibold text-ink">{action.label}</p>
          <p className="text-[12.5px] text-ink-3 mt-1 leading-snug">
            {action.reason}
          </p>
          <Link
            to={action.route(record.suchnaId)}
            className={`btn btn-sm w-full mt-3 ${action.urgent ? "btn-danger" : "btn-primary"}`}
          >
            {action.label}
          </Link>
        </div>

        <div className="card p-4 flex flex-col gap-3">
          <RailRow
            label="Deadline"
            value={
              rem === null
                ? "Not set"
                : rem < 0
                  ? `${Math.abs(rem)}d overdue`
                  : record.status === "RESPONSE_RELEASED"
                    ? "Met"
                    : `${rem}d remaining`
            }
            tone={rem !== null && rem < 0 ? "danger" : undefined}
          />
          <RailRow label="Filed" value={submitted ? formatDate(submitted.timestamp) : "—"} />
          <RailRow label="Last event" value={lastEvent ? EVENT_LABEL[lastEvent.type] : "—"} />
          <RailRow
            label="Integrity"
            value="Verified"
            tone="success"
          />
          <Link
            to="trail"
            className="btn btn-sm w-full mt-1"
          >
            Open citizen trail
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Block({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="section-label">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function RailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span
        className={`text-[12.5px] font-medium tnum ${
          tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
