import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GovCaseTable, GovPage } from "@/components/gov/GovUI";
import { getAllCases } from "@/domain/store";
import { daysRemainingFor } from "@/domain/actionEngine";
import { useStore } from "@/hooks/useStore";
import type { CaseRecord, CaseStatus } from "@/domain/types";

type View = "ALL" | "URGENT" | CaseStatus;
const VIEWS: { key: View; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "URGENT", label: "Urgent" },
  { key: "SUBMITTED", label: "New" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "RESPONSE_RELEASED", label: "Released" },
  { key: "FIRST_APPEAL", label: "Appeals" },
];

function inView(c: CaseRecord, v: View): boolean {
  if (v === "ALL") return true;
  if (v === "URGENT") {
    const r = daysRemainingFor(c);
    return c.status === "OVERDUE" || c.status === "FIRST_APPEAL" || (r !== null && r >= 0 && r <= 5);
  }
  return c.status === v;
}

export function GovCaseQueuePage() {
  const [params, setParams] = useSearchParams();
  const authority = params.get("authority");
  const cases = useStore(getAllCases);
  const [view, setView] = useState<View>("ALL");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases
      .filter((c) => (authority ? c.authorityName === authority : true))
      .filter((c) => inView(c, view))
      .filter(
        (c) =>
          !needle ||
          c.subject.toLowerCase().includes(needle) ||
          c.suchnaId.toLowerCase().includes(needle) ||
          c.department.toLowerCase().includes(needle),
      )
      .sort(
        (a, c) => (daysRemainingFor(a) ?? 9999) - (daysRemainingFor(c) ?? 9999),
      );
  }, [cases, authority, view, q]);

  return (
    <GovPage
      title="Case Queue"
      eyebrow="Operations"
      subtitle={`${rows.length} of ${cases.length} requests`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="inline-flex rounded-md border border-gov-line bg-gov-panel p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-2.5 h-7 rounded text-[12px] font-medium ${
                view === v.key
                  ? "bg-gov-panel-2 text-gov-ink"
                  : "text-gov-ink-3 hover:text-gov-ink"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {authority && (
          <button
            onClick={() => setParams({})}
            className="text-[12px] text-blue-400 hover:underline flex items-center gap-1"
          >
            {authority}
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-gov-line bg-gov-panel">
          <span className="material-symbols-outlined text-[16px] text-gov-ink-3">
            search
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter…"
            className="bg-transparent outline-none text-[12.5px] w-36 text-gov-ink placeholder:text-gov-ink-3"
          />
        </div>
      </div>

      <GovCaseTable
        cases={rows}
        columns={["priority", "id", "subject", "authority", "department", "stage", "deadline"]}
        empty="No cases match this view."
      />
    </GovPage>
  );
}
