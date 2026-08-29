import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

const PARAS = [
  "A status tracker answers one question: is this application still open? Useful, but not what a citizen actually needs to know.",
  "An RTI is rarely one question — it's several distinct records asked for at once. A status of \"responded\" can hide that three of five things you asked for were never answered. Application-level tracking has no way to say that; it sees one file with one status.",
  "The deeper problem is memory. Once a request leaves the citizen's hands, its history lives entirely inside the government's own systems — which the citizen has no independent access to and no way to verify later. If a portal goes down, a case is misfiled, or a PIO changes, the citizen's only record is whatever they personally remembered to save.",
];

export function WhySuchnaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1 max-w-reading mx-auto px-6 py-14 w-full">
        <p className="eyebrow text-primary mb-2">Why Suchna Rakshak</p>
        <h1 className="text-display-sm mb-6">
          Why traditional RTI tracking is insufficient
        </h1>
        <div className="flex flex-col gap-4 text-[14px] text-ink-2 leading-relaxed">
          {PARAS.map((p) => (
            <p key={p.slice(0, 20)}>{p}</p>
          ))}
          <p className="text-ink font-medium border-l-2 border-primary pl-4">
            Suchna Rakshak's answer: track the information itself — every item
            requested, every event, every piece of evidence — and give the
            citizen an independent, portable copy they don't have to trust any
            single system to keep.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
