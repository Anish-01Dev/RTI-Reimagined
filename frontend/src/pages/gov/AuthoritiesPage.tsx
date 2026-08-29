import { useNavigate } from "react-router-dom";
import { GovCard, GovPage } from "@/components/gov/GovUI";
import { computeAuthorityMetrics } from "@/domain/store";
import { useStore } from "@/hooks/useStore";

export function AuthoritiesPage() {
  const navigate = useNavigate();
  const authorities = useStore(computeAuthorityMetrics);

  return (
    <GovPage
      title="Authorities"
      eyebrow="Coverage"
      subtitle={`${authorities.length} public authorities with tracked requests in this workspace.`}
    >
      <GovCard className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-gov-line text-[10.5px] uppercase tracking-[0.07em] font-semibold text-gov-ink-3">
              <th className="px-3 py-2">Authority</th>
              <th className="px-3 py-2 text-right">Open</th>
              <th className="px-3 py-2 text-right">Due soon</th>
              <th className="px-3 py-2 text-right">Overdue</th>
              <th className="px-3 py-2 text-right">Response rate</th>
              <th className="px-3 py-2 text-right">Avg days</th>
            </tr>
          </thead>
          <tbody>
            {authorities.map((a) => (
              <tr
                key={a.name}
                onClick={() =>
                  navigate(`/gov/cases?authority=${encodeURIComponent(a.name)}`)
                }
                className="border-b border-gov-line last:border-0 hover:bg-gov-panel-2 cursor-pointer"
              >
                <td className="px-3 py-2.5">
                  <p className="text-gov-ink font-medium">{a.name}</p>
                  <p className="text-[11px] text-gov-ink-3">{a.department}</p>
                </td>
                <td className="px-3 py-2.5 text-right tnum text-gov-ink-2">
                  {a.openCases}
                </td>
                <td className="px-3 py-2.5 text-right tnum text-amber-400">
                  {a.dueSoon || "—"}
                </td>
                <td className="px-3 py-2.5 text-right tnum text-red-400">
                  {a.overdue || "—"}
                </td>
                <td className="px-3 py-2.5 text-right tnum text-gov-ink-2">
                  {Math.round(a.responseRate * 100)}%
                </td>
                <td className="px-3 py-2.5 text-right tnum text-gov-ink-2">
                  {a.avgResponseDays || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GovCard>
    </GovPage>
  );
}
