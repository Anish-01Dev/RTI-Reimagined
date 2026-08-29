import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { PageHeader } from "@/components/ui/Primitives";
import { LEGAL_RULES } from "@/domain/legalRules";
import { daysRemainingFor } from "@/domain/actionEngine";
import { bucket, citizenCases } from "@/domain/selectors";
import { useStore } from "@/hooks/useStore";
import { formatDate } from "@/lib/format";

export function LegalReferencePage() {
  const cases = useStore(citizenCases);
  const { overdue, appeals } = bucket(cases);
  const actionable = [...overdue, ...appeals];

  return (
    <PageContainer>
      <PageHeader
        title="Appeals & Legal"
        eyebrow="Right to Information Act, 2005"
        subtitle="Process guidance — not legal advice. Each case's own Legal tab applies these rules to that case's actual dates."
      />

      {actionable.length > 0 && (
        <section className="mb-6">
          <h2 className="section-label mb-2.5">Cases with a legal step available</h2>
          <div className="flex flex-col gap-2">
            {actionable.map((c) => {
              const rem = daysRemainingFor(c);
              return (
                <Link
                  key={c.suchnaId}
                  to={`/app/cases/${c.suchnaId}/legal`}
                  className="card card-hover p-3.5 flex items-center gap-4 border-l-2 border-l-warn"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {c.subject}
                    </p>
                    <p className="meta mt-0.5">
                      {c.status === "OVERDUE"
                        ? `${rem !== null ? Math.abs(rem) : ""} days overdue — First Appeal available under Section 19(1)`
                        : `First Appeal filed ${formatDate(c.updatedAt)} — Section 19(3) window opens if undecided`}
                    </p>
                  </div>
                  <span className="btn btn-sm shrink-0">Open</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <h2 className="section-label mb-2.5">Process reference</h2>
      <div className="card divide-y divide-line">
        {LEGAL_RULES.map((rule) => (
          <div key={rule.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {rule.title}
                </p>
                <p className="mono text-ink-3 mt-0.5">
                  {rule.provision} · {rule.source}
                </p>
              </div>
              {rule.deadlineDays !== null && (
                <span className="chip chip-neutral shrink-0">
                  {rule.deadlineDays} days
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed max-w-reading">
              {rule.guidance}
            </p>
            {rule.recommendedAction && (
              <p className="meta mt-1.5">
                <span className="font-semibold text-ink-2">Recommended:</span>{" "}
                {rule.recommendedAction}
              </p>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
