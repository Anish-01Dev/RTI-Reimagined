import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

export function UnkillableRtiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow max-w-2xl mx-auto px-md md:px-lg py-3xl w-full">
        <h1 className="text-3xl font-light text-on-background mb-md">
          The citizen-owned information trail
        </h1>
        <div className="flex flex-col gap-lg text-on-surface-variant text-lg leading-relaxed">
          <p>
            Every case in Suchna Rakshak keeps an append-only log of what
            happened to it — filed, acknowledged, forwarded, responded to,
            appealed. Each entry is hashed together with the one before it,
            using the browser's native SHA-256 implementation:
          </p>
          <pre className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-sm text-on-surface font-mono overflow-x-auto">
            {`H1 = sha256(event1)
H2 = sha256(event2 + H1)
H3 = sha256(event3 + H2)`}
          </pre>
          <p>
            Change or reorder any event and every hash after it stops matching.
            That's what "tamper-evident" means here, precisely — not a claim of
            mathematical unkillability, not blockchain infrastructure. A citizen
            can download this record, print it, or hand someone a QR code that
            resolves to an independent integrity check.
          </p>
          <p className="text-on-background font-medium">
            The point isn't the QR code. It's that the record belongs to the
            citizen — checkable without depending on this portal, or any single
            government system, staying online.
          </p>
          <p>
            Every case's Unkillable RTI tab shows this record live: Suchna ID,
            trail version, event and evidence counts, the current hash, and a
            re-verification button that recomputes the chain from scratch and
            compares it against what's stored.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
