import { useMemo, useState } from "react";
import { GovCard, GovMetrics, GovPage } from "@/components/gov/GovUI";
import { BarRows, ColumnSeries, Donut } from "@/components/gov/Charts";
import { getAllCases } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import type { CaseRecord } from "@/domain/types";

function group(items: string[]): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return Array.from(m, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value,
  );
}

function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short" });
}

export function AnalyticsPage() {
  const all = useStore(getAllCases);
  const [authority, setAuthority] = useState("ALL");

  const authorities = Array.from(new Set(all.map((c) => c.authorityName)));
  const cases = useMemo(
    () => (authority === "ALL" ? all : all.filter((c) => c.authorityName === authority)),
    [all, authority],
  );

  const resolved = cases.filter((c) => c.status === "RESPONSE_RELEASED");
  const overdue = cases.filter((c) => c.status === "OVERDUE" || c.status === "FIRST_APPEAL");
  const appeals = cases.filter((c) => c.status === "FIRST_APPEAL" || c.status === "SECOND_APPEAL");
  const rate = (n: number) => (cases.length ? Math.round((n / cases.length) * 100) : 0);

  const avgDays =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((s, c: CaseRecord) => {
            const from = new Date(c.submittedAt ?? c.createdAt).getTime();
            const to =
              c.events.find((e) => e.type === "RESPONSE_RECEIVED")?.timestamp ??
              c.updatedAt;
            return s + (new Date(to).getTime() - from) / 86_400_000;
          }, 0) / resolved.length,
        )
      : 0;

  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const volume = group(
    cases.map((c) => monthKey(c.submittedAt ?? c.createdAt)),
  ).sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label));

  return (
    <GovPage
      title="Analytics"
      eyebrow="Information governance"
      subtitle={`Aggregated over ${cases.length} tracked requests — real counts from this workspace, not illustrative figures.`}
      actions={
        <select
          value={authority}
          onChange={(e) => setAuthority(e.target.value)}
          className="h-9 rounded-md border border-gov-line bg-gov-panel px-2 text-[12.5px] text-gov-ink-2"
        >
          <option value="ALL">All authorities</option>
          {authorities.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      }
    >
      <GovMetrics
        items={[
          { label: "Requests", value: cases.length },
          { label: "Response rate", value: `${rate(resolved.length)}%`, tone: "success" },
          { label: "Overdue rate", value: `${rate(overdue.length)}%`, tone: overdue.length ? "danger" : undefined },
          { label: "Appeal rate", value: `${rate(appeals.length)}%`, tone: appeals.length ? "warn" : undefined },
          { label: "Avg response", value: `${avgDays}d` },
        ]}
      />

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <GovCard className="p-4">
          <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
            Request volume by month filed
          </h3>
          <ColumnSeries data={volume} />
        </GovCard>

        <GovCard className="p-4 flex items-center justify-around">
          <Donut value={rate(resolved.length)} label="Responded" tone="#34d399" />
          <Donut value={rate(overdue.length)} label="Overdue" tone="#f87171" />
          <Donut value={rate(appeals.length)} label="Appealed" tone="#fbbf24" />
        </GovCard>

        <GovCard className="p-4">
          <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
            By category
          </h3>
          <BarRows data={group(cases.map((c) => c.category))} />
        </GovCard>

        <GovCard className="p-4">
          <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-3">
            Overdue burden by department
          </h3>
          <BarRows
            data={group(overdue.map((c) => c.department))}
            tone="bg-red-500"
          />
        </GovCard>
      </div>
    </GovPage>
  );
}
