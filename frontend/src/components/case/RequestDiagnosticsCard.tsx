import { Link } from "react-router-dom";
import { diagnoseRequest } from "@/lib/requestDiagnostics";
import type { CaseRecord } from "@/domain/types";

const TONE: Record<string, { bar: string; text: string; border: string }> = {
  "Ready to file": {
    bar: "bg-success",
    text: "text-success",
    border: "border-l-success",
  },
  "File with caution": {
    bar: "bg-warn",
    text: "text-warn",
    border: "border-l-warn",
  },
  "Revise before filing": {
    bar: "bg-danger",
    text: "text-danger",
    border: "border-l-danger",
  },
};

/**
 * Compact pre-filing diagnostic summary for a case workspace. Light
 * (citizen) and dark (gov) variants render the same numbers; only the
 * citizen variant links through to the full Application Doctor.
 */
export function RequestDiagnosticsCard({
  record,
  variant = "citizen",
}: {
  record: CaseRecord;
  variant?: "citizen" | "gov";
}) {
  const report = diagnoseRequest({
    text: record.originalRequest,
    authorityKnown: true,
  });
  const tone = TONE[report.assessment];
  const open = [...report.checks]
    .filter((c) => c.severity !== "pass")
    .sort((a) => (a.severity === "critical" ? -1 : 1));
  const dark = variant === "gov";

  const shell = dark
    ? "rounded-lg border border-gov-line bg-gov-panel-2 p-4"
    : `card p-4 border-l-2 ${tone.border}`;

  return (
    <section className={shell}>
      <div className="flex items-center justify-between mb-2.5">
        <h2
          className={
            dark
              ? "text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3"
              : "section-label"
          }
        >
          Pre-filing diagnostic
        </h2>
        <span
          className={`text-[12px] font-semibold ${dark ? (report.assessment === "Ready to file" ? "text-emerald-400" : report.assessment === "File with caution" ? "text-amber-400" : "text-red-400") : tone.text}`}
        >
          {report.assessment}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={`text-[26px] font-semibold tnum leading-none ${dark ? "text-gov-ink" : "text-ink"}`}
        >
          {report.passed}
          <span
            className={`text-[14px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
          >
            /{report.total}
          </span>
        </span>
        <span
          className={`text-[12px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
        >
          checks passed
        </span>
      </div>

      <div
        className={`mt-2 h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-panel-3"}`}
      >
        <div
          className={`h-full ${tone.bar}`}
          style={{ width: `${(report.passed / report.total) * 100}%` }}
        />
      </div>

      {open.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {open.slice(0, 2).map((c) => (
            <li
              key={c.id}
              className={`flex items-start gap-1.5 text-[12px] leading-snug ${dark ? "text-gov-ink-2" : "text-ink-2"}`}
            >
              <span
                className={`material-symbols-outlined text-[14px] shrink-0 translate-y-0.5 ${c.severity === "critical" ? (dark ? "text-red-400" : "text-danger") : dark ? "text-amber-400" : "text-warn"}`}
              >
                {c.severity === "critical" ? "error" : "warning"}
              </span>
              {c.title}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={`mt-3 text-[12px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
        >
          Every disclosure test passes — the request as filed is well-formed.
        </p>
      )}

      {variant === "citizen" && (
        <Link
          to="/app/doctor"
          className="btn btn-sm w-full mt-3"
        >
          {open.length > 0 ? "Open Application Doctor" : "View full diagnostic"}
        </Link>
      )}
    </section>
  );
}
