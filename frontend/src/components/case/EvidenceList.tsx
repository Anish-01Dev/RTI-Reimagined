import { useState } from "react";
import type { Evidence } from "@/domain/types";
import { formatDate } from "@/lib/format";
import {
  DocumentDrawer,
  KIND_ICON,
  KIND_LABEL,
} from "@/components/case/DocumentDrawer";

/** A document workspace, not attachment chips — every item opens into a
 * reader. Previews are demo-safe seeded text (no file storage in scope),
 * but the relationship (this document, this case, this point in the
 * trail) is real and read from the same CaseRecord every tab uses. */
export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  const [open, setOpen] = useState<Evidence | null>(null);

  if (evidence.length === 0) {
    return (
      <div className="card py-10 text-center text-[13px] text-ink-3">
        No documents attached to this trail yet.
      </div>
    );
  }

  return (
    <>
      <div className="card divide-y divide-line">
        {evidence.map((item) => (
          <button
            key={item.id}
            onClick={() => setOpen(item)}
            className="w-full text-left p-3.5 flex items-center gap-3.5 hover:bg-panel-2 transition-colors"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-panel-3 text-ink-2 shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                {KIND_ICON[item.kind]}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink truncate">
                {item.title}
              </span>
              <span className="meta">
                {KIND_LABEL[item.kind]} · {item.source} · {formatDate(item.dateIso)}
              </span>
            </span>
            {item.integrity === "VERIFIED" && (
              <span className="material-symbols-outlined text-success text-[18px] shrink-0 filled-icon">
                verified
              </span>
            )}
          </button>
        ))}
      </div>
      <DocumentDrawer doc={open} onClose={() => setOpen(null)} />
    </>
  );
}
