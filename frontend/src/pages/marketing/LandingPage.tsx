import { Link, useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { QrCode } from "@/components/QrCode";
import { analyzeRequest } from "@/lib/applicationDoctor";
import { getCase } from "@/domain/store";
import { getSession } from "@/lib/demoIdentity";
import { formatDate } from "@/lib/format";

const HERO_CASE_ID = "SR-2026-A7F29C";
const WEAK_QUESTION = "Why hasn't the road in Ward 17 been repaired?";

export function LandingPage() {
  const navigate = useNavigate();
  const loggedIn = Boolean(getSession());
  const heroCase = getCase(HERO_CASE_ID);
  const doctorPreview = analyzeRequest(WEAK_QUESTION);

  function goApp() {
    navigate(loggedIn ? "/app" : "/login");
  }

  return (
    <div className="antialiased min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow">
        {/* HERO */}
        <section className="py-3xl md:py-[100px] px-md md:px-lg max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps tracking-widest uppercase mb-lg">
            Build With India · Unkillable RTI
          </span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg font-light text-on-background mb-md leading-tight">
            Information shouldn't disappear into process.
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto mb-xl">
            Government processes should not be the single source of truth for a
            citizen's information journey. Suchna Rakshak preserves it
            independently — from the question you asked to what you can prove
            today.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-md">
            <button
              onClick={goApp}
              className="px-xl py-3 bg-primary text-on-primary rounded-full font-medium hover:bg-primary-container transition-colors"
            >
              {loggedIn ? "Go to your requests" : "Get started"}
            </button>
            <Link
              to="/how-it-works"
              className="px-xl py-3 border border-outline-variant text-on-surface-variant rounded-full font-medium hover:bg-surface-container transition-colors"
            >
              How it works
            </Link>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="py-2xl px-md md:px-lg max-w-3xl mx-auto border-t border-outline-variant">
          <p className="text-label-caps text-label-caps text-error uppercase tracking-widest mb-sm">
            The problem
          </p>
          <h2 className="text-2xl font-semibold text-on-background mb-md">
            "Where is my application?" is the wrong question.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Traditional RTI tracking answers where a request sits in a queue. It
            cannot tell you what information you actually asked for, what
            evidence exists, which deadlines are approaching, or what to do when
            the government stays silent. The application gets tracked. The
            information — the thing you actually wanted — does not.
          </p>
        </section>

        {/* THE NEW MODEL */}
        <section className="py-2xl px-md md:px-lg max-w-4xl mx-auto border-t border-outline-variant">
          <p className="text-label-caps text-label-caps text-primary uppercase tracking-widest mb-sm">
            The new model
          </p>
          <h2 className="text-2xl font-semibold text-on-background mb-lg">
            Track the information journey, not the file.
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch gap-sm">
            {["Ask", "Track", "Preserve", "Verify", "Act"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-sm flex-1">
                  <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-md text-center">
                    <span className="font-semibold text-on-surface">
                      {step}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="material-symbols-outlined text-outline-variant hidden sm:block">
                      arrow_forward
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        </section>

        {/* APPLICATION DOCTOR */}
        <section className="py-2xl px-md md:px-lg max-w-4xl mx-auto border-t border-outline-variant grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
          <div>
            <p className="text-label-caps text-label-caps text-primary uppercase tracking-widest mb-sm">
              Before you file
            </p>
            <h2 className="text-2xl font-semibold text-on-background mb-md">
              A weak question rarely gets a useful answer.
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-md">
              Every request passes through Application Doctor before it's filed
              — a deterministic quality check, not a chatbot. It catches the
              difference between asking why something happened and asking for
              the records that prove what happened.
            </p>
            <Link
              to="/app/doctor"
              className="text-primary font-medium hover:underline"
            >
              Try Application Doctor →
            </Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
            <p className="text-label-caps text-label-caps text-on-surface-variant mb-1">
              Draft
            </p>
            <p className="text-on-surface italic mb-md">"{WEAK_QUESTION}"</p>
            <div className="grid grid-cols-2 gap-sm mb-md text-body-sm">
              <span className="text-on-surface-variant">
                Clarity{" "}
                <strong className="text-on-surface">
                  {doctorPreview.clarity}
                </strong>
              </span>
              <span className="text-on-surface-variant">
                Specificity{" "}
                <strong className="text-on-surface">
                  {doctorPreview.specificity}
                </strong>
              </span>
            </div>
            <div className="border-t border-outline-variant pt-md">
              <p className="text-label-caps text-label-caps text-tertiary mb-1">
                Recommended
              </p>
              <p className="text-on-surface text-body-sm">
                {doctorPreview.suggestedRewrite}
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCT IN ACTION — real seeded case */}
        {heroCase && (
          <section className="py-2xl px-md md:px-lg max-w-4xl mx-auto border-t border-outline-variant">
            <p className="text-label-caps text-label-caps text-primary uppercase tracking-widest mb-sm">
              A real case workspace
            </p>
            <h2 className="text-2xl font-semibold text-on-background mb-lg">
              Every request becomes a persistent information trail.
            </h2>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-lg border-b border-outline-variant flex items-center justify-between flex-wrap gap-sm">
                <div>
                  <div className="flex items-center gap-sm mb-1">
                    <CaseStatusPill status={heroCase.status} />
                    <span className="text-label-caps text-label-caps text-on-surface-variant">
                      {heroCase.suchnaId}
                    </span>
                  </div>
                  <p className="font-semibold text-on-surface">
                    {heroCase.subject}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {heroCase.authorityName}
                  </p>
                </div>
                <span className="text-body-sm text-on-surface-variant">
                  {heroCase.events.length} events · {heroCase.evidence.length}{" "}
                  evidence records
                </span>
              </div>
              <div className="p-lg grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="p-1.5 bg-white border border-outline-variant rounded-lg w-fit">
                  <QrCode value={heroCase.suchnaId} size={90} />
                </div>
                <ul className="text-body-sm text-on-surface-variant space-y-1">
                  {heroCase.events.slice(0, 4).map((e) => (
                    <li key={e.id}>
                      <span className="text-on-surface font-medium">
                        {e.type.replace(/_/g, " ")}
                      </span>{" "}
                      — {formatDate(e.timestamp)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* TRUST / UNKILLABLE RTI */}
        <section className="py-2xl px-md md:px-lg max-w-3xl mx-auto border-t border-outline-variant">
          <p className="text-label-caps text-label-caps text-primary uppercase tracking-widest mb-sm">
            The moat
          </p>
          <h2 className="text-2xl font-semibold text-on-background mb-md">
            The portal can change. Your trail remains with you.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-md">
            Every case carries a hash-chained event log a citizen can verify
            independently of this website — download it, print it, or hand over
            a QR that resolves to an integrity check, not a marketing claim. We
            call this <strong>tamper-evident</strong>, not blockchain: change or
            reorder an event, and the chain after it stops matching.
          </p>
          <Link
            to="/unkillable-rti"
            className="text-primary font-medium hover:underline"
          >
            How the citizen trail works →
          </Link>
        </section>

        {/* LEGAL / ACTION */}
        <section className="py-2xl px-md md:px-lg max-w-3xl mx-auto border-t border-outline-variant">
          <p className="text-label-caps text-label-caps text-error uppercase tracking-widest mb-sm">
            When the law is ignored
          </p>
          <h2 className="text-2xl font-semibold text-on-background mb-md">
            Silence has a legal consequence. The product treats it like one.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            When the statutory 30-day window lapses under Section 7(1) of the
            RTI Act, 2005, the case doesn't just say "overdue" — it surfaces the
            next legal step, drafted from the case's own facts, ready for the
            citizen to review and file under Section 19(1).
          </p>
        </section>

        {/* GOVERNMENT SIDE */}
        <section className="py-2xl px-md md:px-lg max-w-4xl mx-auto border-t border-outline-variant bg-[#0f1720] text-slate-100 rounded-2xl">
          <div className="p-2xl">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-sm">
              The other side of the desk
            </p>
            <h2 className="text-2xl font-semibold text-white mb-md">
              The same information infrastructure, run as operations.
            </h2>
            <p className="text-slate-300 leading-relaxed mb-lg max-w-2xl">
              A Public Information Officer sees the identical request ledger —
              cleanly routed, complete, with the same deadline clock — inside a
              case-management console built for their workload: a response
              pipeline, a compliance view, and an audit trail of every action
              taken.
            </p>
            <Link
              to="/login"
              className="text-white font-medium hover:underline"
            >
              Government / Official Login →
            </Link>
          </div>
        </section>

        {/* FINAL THESIS */}
        <section className="py-3xl px-md md:px-lg max-w-2xl mx-auto text-center border-t border-outline-variant">
          <p className="text-2xl font-light text-on-background leading-snug">
            Other systems track whether an application exists.
            <br />
            <span className="font-semibold text-primary">
              Suchna Rakshak preserves what happened to the information journey.
            </span>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
