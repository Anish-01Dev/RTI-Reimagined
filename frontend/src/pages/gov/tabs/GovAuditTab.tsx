import { useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import type { CaseRecord } from "@/domain/types";
import { formatDateTime } from "@/lib/format";

export function GovAuditTab() {
  const record = useOutletContext<CaseRecord>();
  const ordered = [...record.audit].reverse();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] text-gov-ink-2">
        {ordered.length} recorded actions on this case. Every workflow
        transition and document attachment writes an entry here — this is real
        application state, not a display.
      </p>
      {ordered.length === 0 ? (
        <GovCard className="py-10 text-center text-[13px] text-gov-ink-3">
          No audited actions on this case yet.
        </GovCard>
      ) : (
        <GovCard>
          <ol className="relative p-4">
            <span className="absolute left-[19px] top-6 bottom-6 w-px bg-gov-line" />
            {ordered.map((e) => (
              <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                <span className="relative z-10 mt-1 h-2 w-2 rounded-full bg-blue-400 shrink-0 ml-[3px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-gov-ink">
                    <span className="font-medium">{e.actor}</span> — {e.action}
                  </p>
                  {e.metadata && (
                    <p className="text-[11.5px] text-gov-ink-3 mt-0.5">
                      {e.metadata}
                    </p>
                  )}
                  <time className="text-[11px] text-gov-ink-3">
                    {formatDateTime(e.timestamp)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </GovCard>
      )}
    </div>
  );
}
