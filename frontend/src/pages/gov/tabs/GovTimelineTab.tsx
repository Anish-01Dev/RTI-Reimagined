import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import { TrailTimeline } from "@/components/case/TrailTimeline";
import { DocumentDrawer } from "@/components/case/DocumentDrawer";
import type { CaseRecord } from "@/domain/types";

export function GovTimelineTab() {
  const record = useOutletContext<CaseRecord>();
  const [openId, setOpenId] = useState<string | null>(null);
  const doc = record.evidence.find((d) => d.id === openId) ?? null;

  return (
    <>
      <GovCard className="p-4">
        <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-4">
          Shared information trail
        </h2>
        <TrailTimeline events={record.events} onOpenDocument={setOpenId} dark />
      </GovCard>
      <DocumentDrawer doc={doc} onClose={() => setOpenId(null)} />
    </>
  );
}
