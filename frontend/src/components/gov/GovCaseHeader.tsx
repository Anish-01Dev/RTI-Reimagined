import { Link, NavLink } from "react-router-dom";
import type { CaseRecord } from "@/domain/types";
import { daysRemainingFor } from "@/domain/actionEngine";
import { STAGE_LABEL } from "@/components/gov/GovUI";
import { formatDate } from "@/lib/format";

interface Tab {
  to: string;
  label: string;
  end?: boolean;
}

export function GovCaseHeader({
  record,
  tabs,
}: {
  record: CaseRecord;
  tabs: Tab[];
}) {
  const rem = daysRemainingFor(record);
  const response = [...record.events]
    .reverse()
    .find((e) => e.type === "RESPONSE_RECEIVED");

  return (
    <div className="bg-gov-panel border-b border-gov-line">
      <div className="max-w-workspace mx-auto px-4 md:px-6 pt-4">
        <Link
          to="/gov/cases"
          className="text-[12px] text-gov-ink-3 hover:text-gov-ink inline-flex items-center gap-1 mb-3"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          Case Queue
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-gov-ink-2 border border-gov-line rounded px-1.5 py-0.5">
                {STAGE_LABEL[record.govStage]}
              </span>
              <span className="font-mono text-[12px] text-gov-ink-3">
                {record.suchnaId}
              </span>
              {record.status === "OVERDUE" && (
                <span className="text-[11px] font-semibold text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                  Overdue
                </span>
              )}
            </div>
            <h1 className="text-[21px] font-semibold tracking-tight text-gov-ink leading-tight">
              {record.subject}
            </h1>
            <p className="text-[12.5px] text-gov-ink-2 mt-1">
              {record.citizenName} · {record.authorityName} · {record.department}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-4 mb-3">
          <Meta label="Submitted">
            {record.submittedAt ? formatDate(record.submittedAt) : "—"}
          </Meta>
          <Meta label="Deadline">
            {rem === null
              ? "—"
              : rem < 0
                ? `${Math.abs(rem)}d overdue`
                : `${rem}d left`}
          </Meta>
          <Meta label="Response">
            {response ? formatDate(response.timestamp) : "Not sent"}
          </Meta>
          <Meta label="Events">{record.events.length}</Meta>
          <Meta label="Documents">{record.evidence.length}</Meta>
          <Meta label="Audit entries">{record.audit.length}</Meta>
        </dl>
      </div>

      <nav className="max-w-workspace mx-auto px-4 md:px-6 flex gap-5 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `pb-2.5 -mb-px border-b-2 text-[13px] font-medium whitespace-nowrap ${
                isActive
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-gov-ink-3 hover:text-gov-ink"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wide text-gov-ink-3 font-semibold">
        {label}
      </dt>
      <dd className="text-[13px] font-medium text-gov-ink tnum">{children}</dd>
    </div>
  );
}
