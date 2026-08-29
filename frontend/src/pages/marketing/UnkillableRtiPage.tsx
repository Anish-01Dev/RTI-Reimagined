import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export function UnkillableRtiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1 max-w-reading mx-auto px-6 py-14 w-full">
        <p className="eyebrow text-primary mb-2">The citizen trail</p>
        <h1 className="text-display-sm mb-6">
          A record the citizen owns, not the portal
        </h1>
        <div className="flex flex-col gap-4 text-[14px] text-ink-2 leading-relaxed">
          <p>
            Every case keeps an append-only log of what happened to it — filed,
            acknowledged, forwarded, responded to, appealed. Each entry is
            hashed together with the one before it, using the browser's native
            SHA-256:
          </p>
          <pre className="card p-4 mono text-[12.5px] text-ink overflow-x-auto">
{`H1 = sha256(event1)
H2 = sha256(event2 + H1)
H3 = sha256(event3 + H2)`}
          </pre>
          <p>
            Change or reorder any event and every hash after it stops matching.
            That is precisely what “tamper-evident” means here — not a claim of
            mathematical unkillability, not blockchain infrastructure.
          </p>
          <p className="text-ink font-medium border-l-2 border-primary pl-4">
            The point isn't the QR code. It's that the record belongs to the
            citizen — checkable without depending on this portal, or any single
            government system, staying online.
          </p>
          <p>
            Every case's Citizen Trail tab shows this live: Suchna ID, trail
            version, event and evidence counts, the full record hash, an
            offline copy stored in the browser, and a re-verification button
            that recomputes the chain from scratch and compares it against
            what's stored.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
