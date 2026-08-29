interface Bar {
  label: string;
  value: number;
  tone?: string;
}

/** A plain horizontal bar list — deliberately not a charting library. The
 * dataset here is small (seeded demo cases), so a heavy dependency would
 * cost more in bundle size and fragility than it buys in visual polish. */
export function BarChart({
  bars,
  suffix = "",
}: {
  bars: Bar[];
  suffix?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex flex-col gap-sm">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-md">
          <span className="w-40 shrink-0 text-body-sm text-on-surface-variant truncate">
            {bar.label}
          </span>
          <div className="flex-1 h-3 bg-surface-variant rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${bar.tone ?? "bg-primary"}`}
              style={{ width: `${(bar.value / max) * 100}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-body-sm text-on-surface font-medium text-right">
            {bar.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
