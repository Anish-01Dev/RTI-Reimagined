import { useNavigate } from "react-router-dom";
import { GovPage } from "@/components/gov/GovUI";
import { computeAuthorityMetrics, getAllCases } from "@/domain/store";
import { useStore } from "@/hooks/useStore";

/**
 * A system-level coverage view — deliberately not a fabricated
 * state-by-state choropleth. What's real: coverage by public authority,
 * computed from actual tracked cases.
 */
export function CoveragePage() {
  const navigate = useNavigate();
  const authorities = useStore(computeAuthorityMetrics);
  const cases = useStore(getAllCases);
  const maxVol = Math.max(...authorities.map((a) => a.openCases + a.overdue), 1);

  return (
    <GovPage
      title="System Coverage"
      eyebrow="Reach"
      subtitle={`${cases.length} tracked requests across ${authorities.length} authorities. Intensity reflects live workload.`}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {authorities.map((a) => {
          const vol = a.openCases + a.overdue;
          const intensity = vol / maxVol;
          return (
            <button
              key={a.name}
              onClick={() =>
                navigate(`/gov/cases?authority=${encodeURIComponent(a.name)}`)
              }
              className="text-left rounded-lg border border-gov-line p-4 hover:border-blue-500/40 transition-colors"
              style={{
                background: `rgba(59,130,246,${0.04 + intensity * 0.16})`,
              }}
            >
              <p className="text-[13px] font-medium text-gov-ink">{a.name}</p>
              <p className="text-[11px] text-gov-ink-3 mb-3">{a.department}</p>
              <div className="grid grid-cols-4 gap-1 text-center">
                <Stat value={vol} label="Load" />
                <Stat value={a.dueSoon} label="Soon" tone="text-amber-400" />
                <Stat value={a.overdue} label="Overdue" tone="text-red-400" />
                <Stat
                  value={`${Math.round(a.responseRate * 100)}%`}
                  label="Resp."
                  tone="text-emerald-400"
                />
              </div>
            </button>
          );
        })}
      </div>
    </GovPage>
  );
}

function Stat({
  value,
  label,
  tone = "text-gov-ink",
}: {
  value: string | number;
  label: string;
  tone?: string;
}) {
  return (
    <div>
      <p className={`text-[15px] font-semibold tnum ${tone}`}>{value}</p>
      <p className="text-[9.5px] uppercase tracking-wide text-gov-ink-3">
        {label}
      </p>
    </div>
  );
}
