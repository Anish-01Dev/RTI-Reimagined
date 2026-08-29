import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { LEGAL_RULES } from "@/domain/legalRules";

export function PublicLegalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow max-w-3xl mx-auto px-md md:px-lg py-3xl w-full">
        <h1 className="text-3xl font-light text-on-background mb-sm">
          RTI rights, timelines &amp; escalation
        </h1>
        <p className="text-on-surface-variant text-lg mb-2xl">
          Process guidance drawn from the Right to Information Act, 2005 — not
          legal advice. Once you're tracking a case, its own Legal tab applies
          these rules to that case's actual dates.
        </p>
        <div className="flex flex-col gap-sm">
          {LEGAL_RULES.map((rule) => (
            <div
              key={rule.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg"
            >
              <div className="flex items-center justify-between flex-wrap gap-sm mb-1">
                <h2 className="text-xl font-semibold text-on-surface">
                  {rule.title}
                </h2>
                {rule.deadlineDays !== null && (
                  <span className="text-label-caps text-label-caps bg-surface-container px-sm py-[2px] rounded-full border border-outline-variant text-on-surface-variant">
                    {rule.deadlineDays} days
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant mb-sm">{rule.guidance}</p>
              <p className="text-label-caps text-label-caps text-on-surface-variant">
                {rule.provision} · {rule.source}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
