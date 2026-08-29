import { Link, NavLink } from "react-router-dom";
import type { CaseRecord } from "@/domain/types";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { daysRemainingFor } from "@/domain/actionEngine";
import { buildTrailPayload } from "@/domain/integrity";
import { formatDate } from "@/lib/format";

interface Tab {
  to: string;
  label: string;
  end?: boolean;
}

export function CaseHeader({
  record,
  tabs,
  backTo = "/app/cases",
  backLabel = "My RTIs",
}: {
  record: CaseRecord;
  tabs: Tab[];
  backTo?: string;
  backLabel?: string;
}) {
  const rem = daysRemainingFor(record);
  const response = [...record.events]
    .reverse()
    .find((e) => e.type === "RESPONSE_RECEIVED");
  const payload = buildTrailPayload(record);

  return (
    <div className="bg-panel border-b border-line">
      <div className="max-w-workspace mx-auto px-4 md:px-6 pt-4">
        <Link
          to={backTo}
          className="text-[12px] text-ink-3 hover:text-ink inline-flex items-center gap-1 mb-3"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          {backLabel}
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <CaseStatusPill status={record.status} />
              <span className="mono text-ink-3">{record.suchnaId}</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink leading-tight">
              {record.subject}
            </h1>
            <p className="text-[13px] text-ink-2 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-ink-3">
                account_balance
              </span>
              {record.authorityName} · {record.department}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-4 mb-3">
          <Meta label="Submitted">
            {record.submittedAt ? formatDate(record.submittedAt) : "Not filed"}
          </Meta>
          <Meta label="Response">
            {response ? formatDate(response.timestamp) : "Awaited"}
          </Meta>
          <Meta label="Deadline">
            {rem === null
              ? "—"
              : rem < 0
                ? `${Math.abs(rem)}d overdue`
                : record.status === "RESPONSE_RELEASED"
                  ? "Met"
                  : `${rem}d left`}
          </Meta>
          <Meta label="Events">{record.events.length}</Meta>
          <Meta label="Evidence">{record.evidence.length}</Meta>
          <Meta label="Integrity">
            <span className="text-success inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] filled-icon">
                verified
              </span>
              {payload.hash ? "Valid" : "—"}
            </span>
          </Meta>
        </dl>
      </div>

      <nav className="max-w-workspace mx-auto px-4 md:px-6 flex gap-5 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `pb-2.5 -mb-px border-b-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-3 hover:text-ink"
              }`
            }
          >
            {tab.label}
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
      <dt className="text-[10.5px] uppercase tracking-wide text-ink-3 font-semibold">
        {label}
      </dt>
      <dd className="text-[13px] font-medium text-ink tnum">{children}</dd>
    </div>
  );
}
