import { Link } from "react-router-dom";
import { GovCard, GovMetrics, GovPage } from "@/components/gov/GovUI";
import { getAllCases } from "@/domain/store";
import { bucket } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import { formatDate } from "@/lib/format";

export function GovAppealsPage() {
  const cases = useStore(getAllCases);
  const { appeals, overdue } = bucket(cases);

  return (
    <GovPage
      title="Appeals"
      eyebrow="Section 19"
      subtitle="First and second appeals filed against this workspace's requests, and the requests currently eligible for one."
    >
      <GovMetrics
        items={[
          { label: "First appeals", value: appeals.filter((c) => c.status === "FIRST_APPEAL").length, tone: "warn" },
          { label: "Second appeals", value: appeals.filter((c) => c.status === "SECOND_APPEAL").length, tone: "warn" },
          { label: "Appeal-eligible (overdue)", value: overdue.length, tone: overdue.length ? "danger" : undefined },
        ]}
      />

      <div className="mt-6 flex flex-col gap-2">
        {[...appeals, ...overdue].length === 0 && (
          <GovCard className="py-10 text-center text-[13px] text-gov-ink-3">
            No appeals filed or pending.
          </GovCard>
        )}
        {appeals.map((c) => (
          <Link
            key={c.suchnaId}
            to={`/gov/cases/${c.suchnaId}/legal`}
            className="block bg-gov-panel border border-gov-line rounded-lg p-4 hover:border-amber-500/40"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-[11px] font-semibold text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">
                {c.status === "FIRST_APPEAL" ? "First appeal" : "Second appeal"}
              </span>
              <span className="font-mono text-[11px] text-gov-ink-3">{c.suchnaId}</span>
            </div>
            <p className="text-[13.5px] font-medium text-gov-ink">{c.subject}</p>
            <p className="text-[12px] text-gov-ink-2 mt-1 leading-snug">
              {c.appealReason ?? "Appeal recorded on the citizen trail."}
            </p>
            <p className="text-[11px] text-gov-ink-3 mt-1.5">
              {c.authorityName} · filed {formatDate(c.updatedAt)}
            </p>
          </Link>
        ))}
        {overdue.map((c) => (
          <Link
            key={c.suchnaId}
            to={`/gov/cases/${c.suchnaId}`}
            className="block bg-gov-panel border border-gov-line rounded-lg p-4 hover:border-red-500/40"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-[11px] font-semibold text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                Appeal eligible
              </span>
              <span className="font-mono text-[11px] text-gov-ink-3">{c.suchnaId}</span>
            </div>
            <p className="text-[13.5px] font-medium text-gov-ink">{c.subject}</p>
            <p className="text-[12px] text-gov-ink-2 mt-1">
              30-day response window lapsed — the citizen may file a First Appeal
              under Section 19(1) without waiting further.
            </p>
          </Link>
        ))}
      </div>
    </GovPage>
  );
}
