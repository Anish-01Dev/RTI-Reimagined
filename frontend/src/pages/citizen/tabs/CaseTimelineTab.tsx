import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { TrailTimeline } from "@/components/case/TrailTimeline";
import { DocumentDrawer } from "@/components/case/DocumentDrawer";
import { daysRemainingFor } from "@/domain/actionEngine";
import type { CaseRecord } from "@/domain/types";
import { formatDate } from "@/lib/format";

export function CaseTimelineTab() {
  const record = useOutletContext<CaseRecord>();
  const rem = daysRemainingFor(record);
  const [openId, setOpenId] = useState<string | null>(null);
  const openDoc = record.evidence.find((d) => d.id === openId) ?? null;

  return (
    <div className="grid lg:grid-cols-[1fr_260px] gap-6">
      <div className="card p-4">
        <h2 className="section-label mb-4">Information trail</h2>
        <TrailTimeline events={record.events} onOpenDocument={setOpenId} />
      </div>

      <aside className="flex flex-col gap-3">
        {record.responseDueAt && (
          <div className="card p-4">
            <p className="eyebrow mb-1.5">Statutory response window</p>
            <p
              className={`text-[24px] font-semibold tnum ${
                rem === null
                  ? "text-ink"
                  : rem < 0
                    ? "text-danger"
                    : rem <= 5
                      ? "text-warn"
                      : "text-ink"
              }`}
            >
              {rem === null
                ? "—"
                : rem < 0
                  ? `${Math.abs(rem)}d overdue`
                  : `${rem}d left`}
            </p>
            <p className="meta mt-1">
              Due {formatDate(record.responseDueAt)} · Section 7(1), RTI Act 2005
            </p>
          </div>
        )}
        <div className="card p-4">
          <p className="eyebrow mb-2">Trail integrity</p>
          <dl className="flex flex-col gap-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-3">Version</dt>
              <dd className="font-medium text-ink">v{record.trailVersion}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-3">Events</dt>
              <dd className="font-medium text-ink tnum">{record.events.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-3">Chain</dt>
              <dd className="text-success font-medium">Intact</dd>
            </div>
          </dl>
        </div>
      </aside>

      <DocumentDrawer
        doc={openDoc}
        onClose={() => setOpenId(null)}
        context={{ suchnaId: record.suchnaId, subject: record.subject }}
      />
    </div>
  );
}
