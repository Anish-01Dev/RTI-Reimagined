import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && (
          <p className="text-[13.5px] text-ink-2 mt-1 max-w-reading">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <h2 className="section-label">{children}</h2>
      {right}
    </div>
  );
}

export function MetricStrip({
  items,
}: {
  items: {
    label: string;
    value: ReactNode;
    tone?: "danger" | "warn" | "success";
    hint?: string;
  }[];
}) {
  return (
    <div
      className="metric-strip"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
    >
      {items.map((m) => (
        <div key={m.label} className="metric">
          <span
            className={`metric-value ${
              m.tone === "danger"
                ? "text-danger"
                : m.tone === "warn"
                  ? "text-warn"
                  : m.tone === "success"
                    ? "text-success"
                    : ""
            }`}
          >
            {m.value}
          </span>
          <span className="metric-label">{m.label}</span>
          {m.hint && <span className="text-[10.5px] text-ink-3">{m.hint}</span>}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  primary,
  secondary,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  primary?: { to: string; label: string };
  secondary?: { to: string; label: string };
}) {
  return (
    <div className="empty-state">
      <span className="grid place-items-center h-11 w-11 rounded-full bg-primary-wash text-primary">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </span>
      <h3 className="card-title">{title}</h3>
      {children && (
        <div className="text-[13px] text-ink-2 max-w-reading leading-relaxed">
          {children}
        </div>
      )}
      {(primary || secondary) && (
        <div className="flex items-center gap-2 mt-1">
          {primary && (
            <Link to={primary.to} className="btn btn-primary">
              {primary.label}
            </Link>
          )}
          {secondary && (
            <Link to={secondary.to} className="btn">
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="kv">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{children}</span>
    </div>
  );
}

export function DeadlinePill({ days }: { days: number | null }) {
  if (days === null)
    return <span className="text-[12.5px] text-ink-3">No deadline set</span>;
  if (days < 0)
    return (
      <span className="text-[12.5px] font-semibold text-danger tnum">
        {Math.abs(days)}d overdue
      </span>
    );
  if (days <= 5)
    return (
      <span className="text-[12.5px] font-semibold text-warn tnum">
        {days}d left
      </span>
    );
  return (
    <span className="text-[12.5px] text-ink-2 tnum">{days}d left</span>
  );
}
