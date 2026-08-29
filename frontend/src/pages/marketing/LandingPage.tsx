import { Link } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { analyzeRequest } from "@/lib/applicationDoctor";

const WEAK = "Why hasn't the road in Ward 17 been repaired?";

const TRAIL = [
  ["Created", "Citizen", "Request drafted and checked"],
  ["Submitted", "Citizen", "Filed with Municipal Corporation"],
  ["Acknowledged", "Authority", "Receipt issued, 2 days"],
  ["Forwarded", "Authority", "Routed to Ward 17 engineering desk"],
  ["Under review", "Authority", "Records located"],
  ["Response received", "Authority", "Expenditure record attached"],
  ["Verified", "System", "Checked against the original request"],
];

export function LandingPage() {
  const doctor = analyzeRequest(WEAK);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1">
        {/* HERO */}
        <section className="border-b border-line">
          <div className="max-w-container-max mx-auto px-6 py-16 grid lg:grid-cols-[1fr_460px] gap-12 items-center">
            <div>
              <p className="eyebrow text-primary mb-3">
                Reliability layer for the Right to Information Act, 2005
              </p>
              <h1 className="text-display leading-[1.08] tracking-[-0.02em] mb-4 max-w-[16ch]">
                Information shouldn't disappear into process.
              </h1>
              <p className="text-[15px] text-ink-2 leading-relaxed max-w-[52ch] mb-6">
                A government portal tells you where your application sits in a
                queue. It can't tell you what you asked for, what evidence
                exists, which deadline is next, or what to do when the reply
                never comes. Suchna Rakshak keeps the whole information journey
                as a citizen-owned, verifiable trail.
              </p>
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn btn-primary">
                  Create an RTI
                </Link>
                <Link to="/how-it-works" className="btn">
                  Explore how it works
                </Link>
              </div>
            </div>

            {/* Composed product visual */}
            <div className="card shadow-raised overflow-hidden">
              <div className="px-4 py-2.5 border-b border-line bg-panel-2 flex items-center gap-2">
                <span className="chip chip-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Response received
                </span>
                <span className="mono text-ink-3">SR-2026-A7F29C</span>
              </div>
              <div className="p-4">
                <p className="text-[13.5px] font-semibold text-ink">
                  Road repair expenditure — Ward 17
                </p>
                <p className="meta mb-3">
                  Municipal Corporation of Delhi · Public Works Department
                </p>
                <div className="grid grid-cols-4 gap-px bg-line border border-line rounded-md overflow-hidden mb-3">
                  {[
                    ["Events", "7"],
                    ["Evidence", "3"],
                    ["Deadline", "Met"],
                    ["Integrity", "Valid"],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-panel px-2.5 py-2">
                      <p className="text-[9.5px] uppercase tracking-wide text-ink-3">
                        {l}
                      </p>
                      <p className="text-[13px] font-semibold text-ink">{v}</p>
                    </div>
                  ))}
                </div>
                <ol className="flex flex-col gap-1.5">
                  {TRAIL.slice(0, 4).map(([t, who]) => (
                    <li key={t} className="flex items-center gap-2 text-[12px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-ink font-medium">{t}</span>
                      <span className="text-ink-3">· {who}</span>
                    </li>
                  ))}
                </ol>
                <div className="inset p-2.5 mt-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    bolt
                  </span>
                  <span className="text-[12px] text-ink-2">
                    Next action: review response against original request
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRADITIONAL vs SUCHNA */}
        <Section eyebrow="The shift" title="Track the information, not the file.">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="eyebrow mb-3">Traditional tracking</p>
              <ol className="flex flex-col gap-2">
                {["Application number", "Portal status", "Wait"].map((s) => (
                  <li key={s} className="flex items-center gap-2 text-[13px] text-ink-2">
                    <span className="material-symbols-outlined text-[16px] text-ink-3">
                      radio_button_unchecked
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-5 border-primary-line">
              <p className="eyebrow text-primary mb-3">Suchna Rakshak</p>
              <ol className="flex flex-col gap-2">
                {["Request", "Evidence", "Timeline", "Deadline", "Response", "Citizen trail", "Action"].map(
                  (s) => (
                    <li key={s} className="flex items-center gap-2 text-[13px] text-ink">
                      <span className="material-symbols-outlined text-[16px] text-success">
                        check_circle
                      </span>
                      {s}
                    </li>
                  ),
                )}
              </ol>
            </div>
          </div>
        </Section>

        {/* APPLICATION DOCTOR */}
        <Section
          eyebrow="Before you file"
          title="A weak question rarely gets a useful answer."
        >
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            <div className="card p-4">
              <p className="eyebrow mb-2">Draft</p>
              <p className="font-serif text-[14px] text-ink leading-relaxed">
                “{WEAK}”
              </p>
              <div className="flex gap-4 mt-3 text-[12px] text-ink-3">
                <span>
                  Specificity{" "}
                  <strong className="text-danger">{doctor.specificity}</strong>
                </span>
                <span>
                  Clarity <strong className="text-ink">{doctor.clarity}</strong>
                </span>
              </div>
            </div>
            <div className="card p-4">
              <p className="eyebrow mb-2">Application Doctor</p>
              <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink-2">
                <li className="flex gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-warn">warning</span>
                  Asks for a reason, not a record
                </li>
                <li className="flex gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-warn">warning</span>
                  No time period
                </li>
                <li className="flex gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-primary">tips_and_updates</span>
                  Request the expenditure records instead
                </li>
              </ul>
            </div>
            <div className="card p-4 border-success-line">
              <p className="eyebrow text-success mb-2">Revised</p>
              <p className="font-serif text-[13.5px] text-ink leading-relaxed">
                {doctor.suggestedRewrite}
              </p>
            </div>
          </div>
        </Section>

        {/* THE TRAIL */}
        <Section
          eyebrow="The information trail"
          title="Every request becomes a forensic, timestamped record."
        >
          <div className="card overflow-hidden">
            <ol className="divide-y divide-line">
              {TRAIL.map(([t, who, detail], i) => (
                <li key={t} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="mono text-ink-3 w-6 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-medium text-ink w-40 shrink-0">
                    {t}
                  </span>
                  <span className="chip chip-neutral shrink-0">{who}</span>
                  <span className="text-[12.5px] text-ink-3 truncate">{detail}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* CITIZEN RECORD */}
        <Section
          eyebrow="The moat"
          title="The portal can change. Your trail stays with you."
        >
          <div className="grid md:grid-cols-[1fr_320px] gap-4">
            <div className="card p-5">
              <p className="text-[14px] text-ink-2 leading-relaxed">
                Each case carries a hash-chained event log, computed with the
                browser's own SHA-256. Reorder or edit any event and every hash
                after it stops matching. It is <strong className="text-ink">tamper-evident</strong>,
                not blockchain — a record a citizen can download, print, carry
                offline, or hand over as a QR that resolves to an independent
                integrity check.
              </p>
              <Link
                to="/unkillable-rti"
                className="text-[13px] text-primary font-medium hover:underline mt-3 inline-block"
              >
                How the citizen trail works →
              </Link>
            </div>
            <div className="card p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Suchna ID", "SR-2026-A7F29C"],
                  ["Trail version", "v7"],
                  ["Events", "7"],
                  ["Evidence", "3"],
                  ["Integrity", "Valid"],
                  ["Offline copy", "Synced"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="kv-label">{l}</p>
                    <p className="text-[13px] font-semibold text-ink mono">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* LEGAL / ACTION */}
        <Section
          eyebrow="When the law is ignored"
          title="Silence has a legal consequence. The product treats it like one."
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-[22px] font-semibold text-warn tnum">3 days</p>
              <p className="meta">remaining on the Section 7(1) window</p>
            </div>
            <div className="card p-4">
              <p className="text-[22px] font-semibold text-danger tnum">18 days</p>
              <p className="meta">overdue — First Appeal now available</p>
            </div>
            <div className="card p-4 border-primary-line">
              <p className="text-[13px] font-semibold text-ink">Next action</p>
              <p className="meta">
                Prepare First Appeal under Section 19(1), drafted from the case's
                own facts
              </p>
            </div>
          </div>
        </Section>

        {/* GOVERNMENT */}
        <section className="bg-gov-bg">
          <div className="max-w-container-max mx-auto px-6 py-14">
            <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gov-ink-3 mb-2">
              The other side of the desk
            </p>
            <h2 className="text-[24px] font-semibold text-gov-ink mb-3">
              The same infrastructure, run as operations.
            </h2>
            <p className="text-[14px] text-gov-ink-2 max-w-[56ch] leading-relaxed mb-6">
              A Public Information Officer sees the identical request — cleanly
              routed, on the same clock — inside a case-management console built
              for their workload: a response pipeline, compliance view, and an
              audit trail of every action taken.
            </p>
            <div
              className="grid gap-px bg-gov-line border border-gov-line rounded-lg overflow-hidden max-w-xl"
              style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}
            >
              {[
                ["18", "Open"],
                ["4", "Due today"],
                ["2", "Overdue"],
                ["7", "Awaiting review"],
              ].map(([v, l]) => (
                <div key={l} className="bg-gov-panel px-4 py-3">
                  <p className="text-[20px] font-semibold text-gov-ink tnum">{v}</p>
                  <p className="text-[11px] text-gov-ink-3">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THESIS */}
        <section className="border-t border-line">
          <div className="max-w-container-max mx-auto px-6 py-16 text-center">
            <p className="text-[22px] text-ink-2 leading-snug max-w-[40ch] mx-auto">
              Other systems track whether an application exists.{" "}
              <span className="text-ink font-semibold">
                Suchna Rakshak preserves what happened to the information.
              </span>
            </p>
            <Link to="/login" className="btn btn-primary mt-6">
              Get started
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line">
      <div className="max-w-container-max mx-auto px-6 py-12">
        <p className="eyebrow text-primary mb-2">{eyebrow}</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-ink mb-6 max-w-[26ch]">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
