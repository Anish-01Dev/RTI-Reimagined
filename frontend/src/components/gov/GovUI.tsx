import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { CaseRecord } from "@/domain/types";
import { daysRemainingFor } from "@/domain/actionEngine";
import { relativeTime } from "@/lib/format";

export function GovPage({
  title,
  eyebrow,
  subtitle,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="max-w-workspace mx-auto px-4 md:px-6 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-1.5">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[26px] font-semibold tracking-tight text-gov-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-gov-ink-2 mt-1 max-w-reading">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function GovSection({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function GovMetrics({
  items,
}: {
  items: { label: string; value: ReactNode; tone?: "danger" | "warn" | "success" }[];
}) {
  return (
    <div
      className="grid gap-px bg-gov-line border border-gov-line rounded-lg overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
    >
      {items.map((m) => (
        <div key={m.label} className="bg-gov-panel px-4 py-3">
          <p
            className={`text-[22px] font-semibold leading-none tnum ${
              m.tone === "danger"
                ? "text-red-400"
                : m.tone === "warn"
                  ? "text-amber-400"
                  : m.tone === "success"
                    ? "text-emerald-400"
                    : "text-gov-ink"
            }`}
          >
            {m.value}
          </p>
          <p className="text-[11.5px] text-gov-ink-3 mt-1">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

export function GovCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gov-panel border border-gov-line rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export type GovColumn =
  | "priority"
  | "id"
  | "subject"
  | "authority"
  | "department"
  | "stage"
  | "deadline"
  | "activity";

const HEAD: Record<GovColumn, string> = {
  priority: "",
  id: "Suchna ID",
  subject: "Subject",
  authority: "Authority",
  department: "Department",
  stage: "Stage",
  deadline: "Deadline",
  activity: "Updated",
};

const STAGE_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  UNDER_REVIEW: "Under review",
  INFO_LOCATED: "Info located",
  RESPONSE_DRAFTED: "Drafted",
  COMPLIANCE_REVIEW: "Compliance",
  READY_TO_RELEASE: "Ready",
  RESPONSE_RELEASED: "Released",
};

export function GovCaseTable({
  cases,
  columns = ["priority", "id", "subject", "department", "stage", "deadline"],
  empty = "No cases.",
}: {
  cases: CaseRecord[];
  columns?: GovColumn[];
  empty?: string;
}) {
  const navigate = useNavigate();
  if (cases.length === 0) {
    return (
      <GovCard className="py-10 text-center text-[13px] text-gov-ink-3">
        {empty}
      </GovCard>
    );
  }
  return (
    <GovCard className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-gov-line">
            {columns.map((c) => (
              <th
                key={c}
                className={`px-3 py-2 text-[10.5px] uppercase tracking-[0.07em] font-semibold text-gov-ink-3 ${
                  c === "deadline" ? "text-right" : ""
                }`}
              >
                {HEAD[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((r) => {
            const rem = daysRemainingFor(r);
            return (
              <tr
                key={r.suchnaId}
                onClick={() => navigate(`/gov/cases/${r.suchnaId}`)}
                className="border-b border-gov-line last:border-0 hover:bg-gov-panel-2 cursor-pointer"
              >
                {columns.map((c) => {
                  if (c === "priority")
                    return (
                      <td key={c} className="px-3 py-2.5 w-1">
                        <span
                          className={`block h-6 w-1 rounded-full ${
                            r.status === "OVERDUE" || r.status === "FIRST_APPEAL"
                              ? "bg-red-500"
                              : rem !== null && rem >= 0 && rem <= 5
                                ? "bg-amber-500"
                                : "bg-gov-line"
                          }`}
                        />
                      </td>
                    );
                  if (c === "id")
                    return (
                      <td key={c} className="px-3 py-2.5 font-mono text-[12px] text-gov-ink-3 whitespace-nowrap">
                        {r.suchnaId}
                      </td>
                    );
                  if (c === "subject")
                    return (
                      <td key={c} className="px-3 py-2.5 text-gov-ink font-medium max-w-[30ch] truncate">
                        {r.subject}
                      </td>
                    );
                  if (c === "authority")
                    return (
                      <td key={c} className="px-3 py-2.5 text-gov-ink-2">
                        {r.authorityName}
                      </td>
                    );
                  if (c === "department")
                    return (
                      <td key={c} className="px-3 py-2.5 text-gov-ink-2">
                        {r.department}
                      </td>
                    );
                  if (c === "stage")
                    return (
                      <td key={c} className="px-3 py-2.5">
                        <span className="text-[11px] font-semibold text-gov-ink-2 border border-gov-line rounded px-1.5 py-0.5">
                          {STAGE_LABEL[r.govStage]}
                        </span>
                      </td>
                    );
                  if (c === "deadline")
                    return (
                      <td key={c} className="px-3 py-2.5 text-right whitespace-nowrap tnum">
                        <span
                          className={
                            rem === null
                              ? "text-gov-ink-3"
                              : rem < 0
                                ? "text-red-400 font-semibold"
                                : rem <= 5
                                  ? "text-amber-400 font-semibold"
                                  : "text-gov-ink-2"
                          }
                        >
                          {rem === null
                            ? "—"
                            : rem < 0
                              ? `${Math.abs(rem)}d over`
                              : `${rem}d`}
                        </span>
                      </td>
                    );
                  return (
                    <td key={c} className="px-3 py-2.5 text-gov-ink-3 whitespace-nowrap">
                      {relativeTime(r.updatedAt)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </GovCard>
  );
}

export { STAGE_LABEL };
