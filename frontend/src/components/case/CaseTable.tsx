import { useNavigate } from "react-router-dom";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { DeadlinePill } from "@/components/ui/Primitives";
import { daysRemainingFor } from "@/domain/actionEngine";
import type { CaseRecord } from "@/domain/types";
import { relativeTime } from "@/lib/format";

export type CaseColumn =
  | "id"
  | "request"
  | "authority"
  | "department"
  | "status"
  | "deadline"
  | "activity"
  | "events"
  | "evidence";

const HEAD: Record<CaseColumn, string> = {
  id: "Suchna ID",
  request: "Request",
  authority: "Authority",
  department: "Department",
  status: "Status",
  deadline: "Deadline",
  activity: "Last activity",
  events: "Events",
  evidence: "Docs",
};

export function CaseTable({
  cases,
  columns = ["id", "request", "authority", "status", "deadline", "activity"],
  base = "/app/cases",
  emptyLabel = "No requests match.",
}: {
  cases: CaseRecord[];
  columns?: CaseColumn[];
  base?: string;
  emptyLabel?: string;
}) {
  const navigate = useNavigate();

  if (cases.length === 0) {
    return (
      <div className="card py-10 text-center text-[13px] text-ink-3">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="data-table rows-link">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className={
                  c === "deadline" || c === "events" || c === "evidence"
                    ? "text-right"
                    : undefined
                }
              >
                {HEAD[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((r) => (
            <tr
              key={r.suchnaId}
              onClick={() => navigate(`${base}/${r.suchnaId}`)}
            >
              {columns.map((c) => (
                <Cell key={c} col={c} record={r} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ col, record: r }: { col: CaseColumn; record: CaseRecord }) {
  switch (col) {
    case "id":
      return <td className="mono text-ink-3 whitespace-nowrap">{r.suchnaId}</td>;
    case "request":
      return (
        <td>
          <span className="block text-[13px] font-medium text-ink truncate max-w-[32ch]">
            {r.subject}
          </span>
        </td>
      );
    case "authority":
      return <td className="text-ink-3">{r.authorityName}</td>;
    case "department":
      return <td className="text-ink-3">{r.department}</td>;
    case "status":
      return (
        <td>
          <CaseStatusPill status={r.status} />
        </td>
      );
    case "deadline":
      return (
        <td className="text-right whitespace-nowrap">
          <DeadlinePill days={daysRemainingFor(r)} />
        </td>
      );
    case "activity":
      return (
        <td className="text-ink-3 whitespace-nowrap">
          {relativeTime(r.updatedAt)}
        </td>
      );
    case "events":
      return <td className="text-right tnum text-ink-2">{r.events.length}</td>;
    case "evidence":
      return <td className="text-right tnum text-ink-2">{r.evidence.length}</td>;
  }
}
