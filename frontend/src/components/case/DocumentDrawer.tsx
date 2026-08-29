import { useEffect } from "react";
import type { Evidence } from "@/domain/types";
import { formatDate } from "@/lib/format";

export const KIND_LABEL: Record<Evidence["kind"], string> = {
  ACKNOWLEDGEMENT: "Acknowledgement",
  RECEIPT: "Receipt",
  FORWARDING_NOTICE: "Forwarding notice",
  RESPONSE_DOCUMENT: "Response document",
  CORRESPONDENCE: "Correspondence",
  APPEAL_DOCUMENT: "Appeal document",
  DELIVERY_RECORD: "Delivery record",
};

export const KIND_ICON: Record<Evidence["kind"], string> = {
  ACKNOWLEDGEMENT: "task_alt",
  RECEIPT: "receipt_long",
  FORWARDING_NOTICE: "alt_route",
  RESPONSE_DOCUMENT: "description",
  CORRESPONDENCE: "mail",
  APPEAL_DOCUMENT: "gavel",
  DELIVERY_RECORD: "local_shipping",
};

export function DocumentDrawer({
  doc,
  onClose,
  context,
}: {
  doc: Evidence | null;
  onClose: () => void;
  context?: { suchnaId: string; subject: string };
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/25 fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-panel h-full shadow-drawer flex flex-col drawer-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-line">
          <div className="min-w-0">
            <p className="eyebrow mb-1">{KIND_LABEL[doc.kind]}</p>
            <h3 className="card-title truncate">{doc.title}</h3>
            <p className="meta mt-1">
              {doc.source} · {formatDate(doc.dateIso)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-panel-2">
          <div className="card p-5 font-serif text-[14px] text-ink leading-relaxed">
            {doc.preview}
          </div>
        </div>

        <div className="p-3 border-t border-line flex items-center gap-2 flex-wrap">
          <span
            className={`chip ${doc.integrity === "VERIFIED" ? "chip-success" : "chip-warn"}`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {doc.integrity === "VERIFIED" ? "verified" : "help"}
            </span>
            Integrity {doc.integrity === "VERIFIED" ? "verified" : "unverified"}
          </span>
          {context && (
            <span className="mono text-ink-3">{context.suchnaId}</span>
          )}
        </div>
      </div>
    </div>
  );
}
