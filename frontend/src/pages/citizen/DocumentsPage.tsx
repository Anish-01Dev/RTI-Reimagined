import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import {
  DocumentDrawer,
  KIND_ICON,
  KIND_LABEL,
} from "@/components/case/DocumentDrawer";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { allDocuments, citizenCases } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import type { Evidence } from "@/domain/types";
import { formatDate } from "@/lib/format";

export function DocumentsPage() {
  const cases = useStore(citizenCases);
  const docs = allDocuments(cases);
  const [kind, setKind] = useState<string>("ALL");
  const [open, setOpen] = useState<Evidence | null>(null);

  const kinds = Array.from(new Set(docs.map((d) => d.kind)));
  const filtered = kind === "ALL" ? docs : docs.filter((d) => d.kind === kind);

  if (docs.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Documents" eyebrow="Evidence library" />
        <EmptyState icon="description" title="No documents yet">
          Receipts, acknowledgements, forwarding notices and responses attached
          to any of your cases collect here — each linked to the event that
          produced it.
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        eyebrow="Evidence library"
        subtitle={`${docs.length} documents across ${cases.length} cases, newest first.`}
      />

      <div className="flex gap-1.5 flex-wrap mb-3">
        <FilterChip active={kind === "ALL"} onClick={() => setKind("ALL")}>
          All · {docs.length}
        </FilterChip>
        {kinds.map((k) => (
          <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
            {KIND_LABEL[k]} · {docs.filter((d) => d.kind === k).length}
          </FilterChip>
        ))}
      </div>

      <div className="card divide-y divide-line">
        {filtered.map((d) => (
          <button
            key={d.id}
            onClick={() => setOpen(d)}
            className="w-full text-left p-3.5 flex items-center gap-3.5 hover:bg-panel-2"
          >
            <span className="grid place-items-center h-9 w-9 rounded-md bg-panel-3 text-ink-2 shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                {KIND_ICON[d.kind]}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-ink truncate">
                {d.title}
              </span>
              <span className="meta">
                {KIND_LABEL[d.kind]} · {d.source} · {formatDate(d.dateIso)}
              </span>
            </span>
            <Link
              to={`/app/cases/${d.suchnaId}`}
              onClick={(e) => e.stopPropagation()}
              className="mono text-ink-3 shrink-0 hover:text-primary"
            >
              {d.suchnaId}
            </Link>
          </button>
        ))}
      </div>

      <DocumentDrawer doc={open} onClose={() => setOpen(null)} />
    </PageContainer>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] font-medium rounded-md border px-2.5 h-7 transition-colors ${
        active
          ? "border-primary-line bg-primary-wash text-primary-strong"
          : "border-line bg-panel text-ink-3 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
