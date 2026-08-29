interface Datum {
  label: string;
  value: number;
}

/** Horizontal bars — for categorical breakdowns. Dark-console styling. */
export function BarRows({
  data,
  suffix = "",
  tone = "bg-blue-500",
}: {
  data: Datum[];
  suffix?: string;
  tone?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0)
    return <p className="text-[12px] text-gov-ink-3">No data.</p>;
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-[12px] text-gov-ink-2 truncate">
            {d.label}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-gov-panel-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${tone}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[12px] font-semibold text-gov-ink tnum">
            {d.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Vertical columns — for a time series. */
export function ColumnSeries({
  data,
  tone = "bg-blue-500/70",
}: {
  data: Datum[];
  tone?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-gov-ink-2 tnum">{d.value}</span>
          <div className="w-full flex-1 bg-gov-panel-2 rounded flex items-end overflow-hidden">
            <div
              className={`w-full ${tone}`}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[9.5px] text-gov-ink-3">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  value,
  label,
  tone = "#3b82f6",
}: {
  value: number;
  label: string;
  tone?: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1b2a3d" strokeWidth="10" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="49"
          textAnchor="middle"
          className="fill-gov-ink"
          style={{ fontSize: 17, fontWeight: 600 }}
        >
          {value}%
        </text>
      </svg>
      <span className="text-[11px] text-gov-ink-3">{label}</span>
    </div>
  );
}
