import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { LEGAL_RULES } from "@/domain/legalRules";

export function PublicLegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1 max-w-reading mx-auto px-6 py-14 w-full">
        <p className="eyebrow text-primary mb-2">RTI process reference</p>
        <h1 className="text-display-sm mb-2">Rights, timelines &amp; escalation</h1>
        <p className="text-[14px] text-ink-2 mb-8">
          Process guidance drawn from the Right to Information Act, 2005 — not
          legal advice. Once you're tracking a case, its own Legal tab applies
          these rules to that case's actual dates.
        </p>
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
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                {rule.guidance}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
