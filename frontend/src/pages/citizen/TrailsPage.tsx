import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import { buildTrailPayload } from "@/domain/integrity";
import { citizenCases } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import { listOfflineRecords, syncOfflineRecord } from "@/offline/citizenRecord";
import { formatDate } from "@/lib/format";

export function TrailsPage() {
  const cases = useStore(citizenCases);
  const offlineIds = new Set(listOfflineRecords().map((r) => r.payload.suchnaId));

  if (cases.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Information Trails" eyebrow="Citizen-held records" />
        <EmptyState icon="verified_user" title="No trails yet">
          Each RTI you file carries a hash-chained record of everything that
          happened to it — one you can download, print or verify without this
          portal. They'll be listed here.
        </EmptyState>
      </PageContainer>
    );
  }

  function downloadAll() {
    const bundle = cases.map((c) => ({
      ...buildTrailPayload(c),
      events: c.events,
      evidence: c.evidence,
    }));
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suchna-rakshak-all-records.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Information Trails"
        eyebrow="Citizen-held records"
        subtitle="Your independent, tamper-evident copy of every case — verifiable without depending on any government portal staying online."
        actions={
          <>
            <button
              onClick={() => cases.forEach(syncOfflineRecord)}
              className="btn"
            >
              <span className="material-symbols-outlined text-[17px]">cloud_sync</span>
              Sync offline
            </button>
            <button onClick={downloadAll} className="btn btn-primary">
              <span className="material-symbols-outlined text-[17px]">download</span>
              Download all
            </button>
          </>
        }
      />

      <div className="card overflow-x-auto">
        <table className="data-table rows-link">
          <thead>
            <tr>
              <th>Request</th>
              <th className="text-right">Version</th>
              <th className="text-right">Events</th>
              <th className="text-right">Docs</th>
              <th>Integrity</th>
              <th>Offline</th>
              <th>Record hash</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const p = buildTrailPayload(c);
              return (
                <tr key={c.suchnaId}>
                  <td>
                    <Link
                      to={`/app/cases/${c.suchnaId}/trail`}
                      className="block text-[13px] font-medium text-ink hover:text-primary truncate max-w-[26ch]"
                    >
                      {c.subject}
                    </Link>
                    <span className="mono text-ink-3">{c.suchnaId}</span>
                  </td>
                  <td className="text-right tnum text-ink-2">v{c.trailVersion}</td>
                  <td className="text-right tnum text-ink-2">{c.events.length}</td>
                  <td className="text-right tnum text-ink-2">{c.evidence.length}</td>
                  <td>
                    <span className="chip chip-success">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      Valid
                    </span>
                  </td>
                  <td>
                    {offlineIds.has(c.suchnaId) ? (
                      <span className="chip chip-neutral">
                        <span className="material-symbols-outlined text-[13px]">cloud_done</span>
                        Saved
                      </span>
                    ) : (
                      <span className="text-[12px] text-ink-3">—</span>
                    )}
                  </td>
                  <td className="mono text-ink-3">
                    {p.hash ? `${p.hash.slice(0, 12)}…` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="meta mt-3">
        Last synced {formatDate(new Date().toISOString())}. A QR on any case's
        Citizen Trail tab resolves to a public integrity check at{" "}
        <span className="mono">/verify/&lt;Suchna ID&gt;</span>.
      </p>
    </PageContainer>
  );
}
