import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

const STEPS = [
  {
    title: "Ask",
    body: "Describe what you need in plain language. Application Doctor checks it for clarity, specificity, and time period before you file — a deterministic quality check, not a chatbot.",
  },
  {
    title: "Track",
    body: "Filing creates a Suchna ID — a persistent identity for the request, not just a receipt number. Every hop, acknowledgement, and transfer is logged as a timestamped event.",
  },
  {
    title: "Preserve",
    body: "Each case carries its own hash-chained event log and evidence record. This is what survives independently of the portal — a citizen-owned copy of the journey.",
  },
  {
    title: "Verify",
    body: "When a response arrives, it's checked against the case's own trail — not summarized. A QR and hash let anyone confirm the record hasn't been altered.",
  },
  {
    title: "Act",
    body: "If the statutory deadline lapses or the response is incomplete, the system surfaces the next legal step — drafted from the case's own facts, ready to review.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <TopNav />
      <main className="flex-grow max-w-3xl mx-auto px-md md:px-lg py-3xl w-full">
        <h1 className="text-3xl font-light text-on-background mb-md">
          How Suchna Rakshak works
        </h1>
        <p className="text-on-surface-variant text-lg mb-2xl">
          Five stages, one continuous record — not five disconnected features.
        </p>
        <div className="flex flex-col gap-xl">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-lg">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-background mb-1">
                  {step.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
