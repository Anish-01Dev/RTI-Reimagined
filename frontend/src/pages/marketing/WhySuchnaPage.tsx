import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export function WhySuchnaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow max-w-2xl mx-auto px-md md:px-lg py-3xl w-full">
        <h1 className="text-3xl font-light text-on-background mb-md">
          Why traditional RTI tracking is insufficient
        </h1>
        <div className="flex flex-col gap-lg text-on-surface-variant text-lg leading-relaxed">
          <p>
            A status tracker answers one question: is this application still
            open? That's useful, but it's not what a citizen actually needs to
            know.
          </p>
          <p>
            An RTI is rarely one question — it's several distinct records being
            asked for at once. A status of "responded" can hide the fact that
            three of five things you asked for were never answered.
            Application-level tracking has no way to say that; it only sees one
            file with one status.
          </p>
          <p>
            The deeper problem is memory. Once a request leaves the citizen's
            hands, its history lives entirely inside the government's own
            systems — systems the citizen has no independent access to, and no
            way to verify later. If a portal goes down, if a case gets misfiled,
            if a PIO changes, the citizen's only record is whatever they
            personally remembered to save.
          </p>
          <p className="text-on-background font-medium">
            Suchna Rakshak's answer: track the information itself — every item
            requested, every event that happened to it, every piece of evidence
            — and give the citizen an independent, portable copy of that record
            they don't have to trust any single system to keep.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
