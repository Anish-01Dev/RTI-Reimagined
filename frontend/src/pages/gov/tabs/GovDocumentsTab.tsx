import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { GovCard } from "@/components/gov/GovUI";
import {
  DocumentDrawer,
  KIND_ICON,
  KIND_LABEL,
} from "@/components/case/DocumentDrawer";
import { addAudit, addEvidence } from "@/domain/store";
import type { CaseRecord, Evidence, EvidenceKind } from "@/domain/types";
import { getSession } from "@/lib/demoIdentity";
import { formatDate } from "@/lib/format";

const KINDS: EvidenceKind[] = [
  "ACKNOWLEDGEMENT",
  "FORWARDING_NOTICE",
  "RESPONSE_DOCUMENT",
  "CORRESPONDENCE",
  "DELIVERY_RECORD",
];

export function GovDocumentsTab() {
  const record = useOutletContext<CaseRecord>();
  const session = getSession();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<EvidenceKind>("RESPONSE_DOCUMENT");
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState("");
  const [open, setOpen] = useState<Evidence | null>(null);

  async function attach() {
    if (!title.trim() || !preview.trim() || !session) return;
    await addEvidence(record.suchnaId, {
      kind,
      title,
      source: record.authorityName,
      dateIso: new Date().toISOString(),
      preview,
      integrity: "VERIFIED",
    });
    addAudit(record.suchnaId, session.name, `Attached document: ${title}`);
    setTitle("");
    setPreview("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-gov-ink-2">
          Documents you attach appear on the citizen's trail immediately.
        </p>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-8 px-3 rounded-md border border-gov-line text-gov-ink-2 text-[12.5px] font-semibold hover:bg-gov-panel-2"
        >
          {adding ? "Cancel" : "Attach document"}
        </button>
      </div>

      {adding && (
        <GovCard className="p-4 flex flex-col gap-2.5">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as EvidenceKind)}
            className="h-9 rounded-md border border-gov-line bg-gov-panel-2 px-2 text-[12.5px] text-gov-ink"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="h-9 rounded-md border border-gov-line bg-gov-panel-2 px-2.5 text-[12.5px] text-gov-ink placeholder:text-gov-ink-3"
          />
          <textarea
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            placeholder="Document content (demo preview text)"
            rows={4}
            className="rounded-md border border-gov-line bg-gov-panel-2 px-2.5 py-2 text-[12.5px] text-gov-ink placeholder:text-gov-ink-3"
          />
          <button
            onClick={attach}
            className="self-start h-8 px-3 rounded-md bg-blue-600 text-white text-[12.5px] font-semibold hover:bg-blue-700"
          >
            Attach to trail
          </button>
        </GovCard>
      )}

      {record.evidence.length === 0 ? (
        <GovCard className="py-10 text-center text-[13px] text-gov-ink-3">
          No documents on this case yet.
        </GovCard>
      ) : (
        <GovCard className="divide-y divide-gov-line">
          {record.evidence.map((d) => (
            <button
              key={d.id}
              onClick={() => setOpen(d)}
              className="w-full text-left p-3.5 flex items-center gap-3.5 hover:bg-gov-panel-2"
            >
              <span className="grid place-items-center h-9 w-9 rounded-md bg-gov-panel-2 border border-gov-line text-gov-ink-2 shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {KIND_ICON[d.kind]}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-gov-ink truncate">
                  {d.title}
                </span>
                <span className="text-[11px] text-gov-ink-3">
                  {KIND_LABEL[d.kind]} · {d.source} · {formatDate(d.dateIso)}
                </span>
              </span>
            </button>
          ))}
        </GovCard>
      )}

      <DocumentDrawer doc={open} onClose={() => setOpen(null)} />
    </div>
  );
}
