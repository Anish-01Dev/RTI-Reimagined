import { Link } from "react-router-dom";
import { computeNextAction } from "@/domain/actionEngine";
import type { CaseRecord } from "@/domain/types";

export function ActionBanner({ record }: { record: CaseRecord }) {
  const action = computeNextAction(record);
  return (
    <div
      className={`rounded-xl border p-lg flex items-start gap-md ${
        action.urgent
          ? "bg-error-container/40 border-error/30"
          : "bg-surface-container-low border-outline-variant"
      }`}
    >
      <span
        className={`material-symbols-outlined text-2xl shrink-0 ${action.urgent ? "text-error" : "text-primary"}`}
      >
        {action.urgent ? "priority_high" : "task_alt"}
      </span>
      <div className="flex-grow">
        <p className="text-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">
          Next best action
        </p>
        <h3 className="font-headline-md text-headline-md !text-lg text-on-surface mb-1">
          {action.label}
        </h3>
        <p className="text-body-sm text-on-surface-variant">{action.reason}</p>
      </div>
      <Link
        to={action.route(record.suchnaId)}
        className={`shrink-0 px-md py-xs rounded-lg font-medium text-body-sm transition-colors ${
          action.urgent
            ? "bg-error text-on-error hover:opacity-90"
            : "bg-primary text-on-primary hover:bg-primary/90"
        }`}
      >
        Review
      </Link>
    </div>
  );
}
