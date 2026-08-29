import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { CaseTable } from "@/components/case/CaseTable";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { daysRemainingFor } from "@/domain/actionEngine";
import { bucket, citizenCases } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import type { CaseRecord } from "@/domain/types";

type View = "all" | "active" | "awaiting" | "overdue" | "responded" | "appeals";
type Sort = "recent" | "deadline" | "created";

const VIEWS: { key: View; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "awaiting", label: "Awaiting response" },
  { key: "overdue", label: "Overdue" },
  { key: "responded", label: "Responded" },
  { key: "appeals", label: "Appeals" },
];

function inView(c: CaseRecord, v: View): boolean {
  switch (v) {
    case "all":
      return true;
    case "active":
      return !["RESPONSE_RELEASED", "CLOSED"].includes(c.status);
    case "awaiting":
      return ["SUBMITTED", "ACKNOWLEDGED", "FORWARDED", "UNDER_REVIEW", "RESPONSE_DRAFTED"].includes(c.status);
    case "overdue":
      return c.status === "OVERDUE";
    case "responded":
      return c.status === "RESPONSE_RELEASED";
    case "appeals":
      return c.status === "FIRST_APPEAL" || c.status === "SECOND_APPEAL";
  }
}

export function MyCasesPage() {
  const cases = useStore(citizenCases);
  const counts = bucket(cases);
  const [view, setView] = useState<View>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases
      .filter((c) => inView(c, view))
      .filter(
        (c) =>
          !needle ||
          c.subject.toLowerCase().includes(needle) ||
          c.suchnaId.toLowerCase().includes(needle) ||
          c.authorityName.toLowerCase().includes(needle),
      )
      .sort((a, b) => {
        if (sort === "created")
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sort === "deadline") {
          const da = daysRemainingFor(a);
          const db = daysRemainingFor(b);
          return (da ?? 9999) - (db ?? 9999);
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [cases, view, sort, q]);

  if (cases.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="My RTIs" eyebrow="Case management" />
        <EmptyState
          icon="folder_open"
          title="No requests yet"
          primary={{ to: "/app/create", label: "Create RTI" }}
          secondary={{ to: "/how-it-works", label: "See how it works" }}
        >
          Your RTI workspace appears here once you file your first request —
          every one becomes a tracked case with its own timeline, evidence and
          citizen-held trail.
        </EmptyState>
      </PageContainer>
    );
  }

  const viewCount = (v: View) => cases.filter((c) => inView(c, v)).length;

  return (
    <PageContainer>
      <PageHeader
        title="My RTIs"
        eyebrow="Case management"
        subtitle={`${cases.length} tracked · ${counts.overdue.length} overdue · ${counts.dueSoon.length} due soon`}
        actions={
          <Link to="/app/create" className="btn btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New RTI
          </Link>
        }
      />

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-2.5 h-7 rounded text-[12px] font-medium transition-colors ${
                view === v.key
                  ? "bg-primary-wash text-primary-strong"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              {v.label}
              <span className="ml-1 tnum text-ink-3">{viewCount(v.key)}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-line-2 bg-panel">
            <span className="material-symbols-outlined text-[16px] text-ink-3">
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="bg-transparent outline-none text-[12.5px] w-32"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-8 rounded-md border border-line-2 bg-panel px-2 text-[12.5px] text-ink-2"
          >
            <option value="recent">Recent activity</option>
            <option value="deadline">Deadline</option>
            <option value="created">Date created</option>
          </select>
        </div>
      </div>

      <CaseTable
        cases={rows}
        columns={["id", "request", "authority", "status", "deadline", "activity"]}
        emptyLabel={q ? `Nothing matches “${q}”.` : "No requests in this view."}
      />
    </PageContainer>
  );
}
