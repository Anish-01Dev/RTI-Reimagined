import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GovCard, GovPage } from "@/components/gov/GovUI";
import { getAllCases } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import type { AuditEvent } from "@/domain/types";
import { formatDateTime } from "@/lib/format";

interface Row extends AuditEvent {
  suchnaId: string;
  subject: string;
}

export function GlobalAuditPage() {
  const navigate = useNavigate();
  const cases = useStore(getAllCases);
  const [q, setQ] = useState("");

  const rows: Row[] = cases
    .flatMap((c) =>
      c.audit.map((a) => ({ ...a, suchnaId: c.suchnaId, subject: c.subject })),
    )
    .filter(
      (r) =>
        !q.trim() ||
        r.action.toLowerCase().includes(q.toLowerCase()) ||
        r.actor.toLowerCase().includes(q.toLowerCase()) ||
        r.suchnaId.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <GovPage
      title="Audit Log"
      eyebrow="Accountability"
      subtitle={`${rows.length} recorded official actions across every case — backed by application state, not a display.`}
      actions={
        <div className="flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-gov-line bg-gov-panel">
          <span className="material-symbols-outlined text-[16px] text-gov-ink-3">
            search
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter actions…"
            className="bg-transparent outline-none text-[12.5px] w-40 text-gov-ink placeholder:text-gov-ink-3"
          />
        </div>
      }
    >
      {rows.length === 0 ? (
        <GovCard className="py-10 text-center text-[13px] text-gov-ink-3">
          No audited actions{q ? " match" : " yet"}.
        </GovCard>
      ) : (
        <GovCard className="divide-y divide-gov-line">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/gov/cases/${r.suchnaId}/audit`)}
              className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-gov-panel-2"
            >
              <span className="font-mono text-[11px] text-gov-ink-3 w-24 shrink-0">
                {r.suchnaId.slice(-6)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-gov-ink">
                  <span className="font-medium">{r.actor}</span> — {r.action}
                </span>
                <span className="block text-[11px] text-gov-ink-3 truncate">
                  {r.subject}
                </span>
              </span>
              <time className="text-[11px] text-gov-ink-3 shrink-0">
                {formatDateTime(r.timestamp)}
              </time>
            </button>
          ))}
        </GovCard>
      )}
    </GovPage>
  );
}
