import { useOutletContext } from "react-router-dom";
import type { CaseRecord } from "@/domain/types";
import { formatDateTime } from "@/lib/format";

export function GovAuditTab() {
  const record = useOutletContext<CaseRecord>();
  const ordered = [...record.audit].reverse();

  if (ordered.length === 0) {
    return (
      <p className="text-on-surface-variant">
        No audited actions recorded on this case yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-xs">
      {ordered.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm"
        >
          <div>
            <span className="text-on-surface">{entry.action}</span>
            <span className="text-on-surface-variant"> — {entry.actor}</span>
          </div>
          <span className="text-label-caps text-label-caps text-on-surface-variant">
            {formatDateTime(entry.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}
