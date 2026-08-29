import { useOutletContext } from "react-router-dom";
import { EvidenceList } from "@/components/case/EvidenceList";
import type { CaseRecord } from "@/domain/types";

export function CaseEvidenceTab() {
  const record = useOutletContext<CaseRecord>();
  const byKind = record.evidence.reduce<Record<string, number>>((acc, d) => {
    acc[d.kind] = (acc[d.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="section-label">
          Documents · {record.evidence.length}
        </h2>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(byKind).map(([k, n]) => (
            <span key={k} className="chip chip-neutral">
              {k.replace(/_/g, " ").toLowerCase()} · {n}
            </span>
          ))}
        </div>
      </div>
      <p className="text-[12.5px] text-ink-3 max-w-reading">
        Every document connected to the moment it entered the trail — not a loose
        file list. Click any item to read it.
      </p>
      <EvidenceList evidence={record.evidence} />
    </div>
  );
}
