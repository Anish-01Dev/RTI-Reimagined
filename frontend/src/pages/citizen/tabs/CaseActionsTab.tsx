import { useOutletContext } from "react-router-dom";
import { EVENT_LABEL } from "@/components/case/TrailTimeline";
import type { CaseRecord } from "@/domain/types";
import { formatDateTime } from "@/lib/format";

interface Entry {
  id: string;
  when: string;
  actor: string;
  label: string;
  detail?: string;
  kind: "event" | "audit";
}

export function CaseActivityTab() {
  const record = useOutletContext<CaseRecord>();

  const entries: Entry[] = [
    ...record.events.map((e) => ({
      id: `e-${e.id}`,
      when: e.timestamp,
      actor: e.actor,
      label: EVENT_LABEL[e.type],
      detail: e.description,
      kind: "event" as const,
    })),
    ...record.audit.map((a) => ({
      id: `a-${a.id}`,
      when: a.timestamp,
      actor: a.actor,
      label: a.action,
      detail: a.metadata,
      kind: "audit" as const,
    })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <div className="max-w-reading">
      <h2 className="section-label mb-1">Activity</h2>
      <p className="text-[12.5px] text-ink-3 mb-4">
        Every recorded event on this case — the citizen's trail and the
        authority's audited actions, merged and time-ordered.
      </p>
      <div className="card divide-y divide-line">
        {entries.map((e) => (
          <div key={e.id} className="p-3.5 flex items-start gap-3">
            <span
              className={`chip ${e.kind === "audit" ? "chip-info" : "chip-neutral"} shrink-0 mt-0.5`}
            >
              {e.kind === "audit" ? "Authority" : "Trail"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{e.label}</p>
              {e.detail && (
                <p className="text-[12px] text-ink-3 mt-0.5 leading-snug">
                  {e.detail}
                </p>
              )}
              <p className="meta mt-1">
                {e.actor} · {formatDateTime(e.when)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
