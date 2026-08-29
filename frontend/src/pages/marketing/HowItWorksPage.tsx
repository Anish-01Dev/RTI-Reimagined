import { Link } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";

const STEPS = [
  ["Ask", "Describe what you need in plain language. Application Doctor checks it for specificity, time period and record-orientation before you file — a deterministic quality check, not a chatbot."],
  ["Track", "Filing mints a Suchna ID — a durable identity for the request, not a receipt number. Every acknowledgement, transfer and response is logged as a timestamped event."],
  ["Preserve", "Each case carries its own SHA-256 hash-chained event log and evidence record. This is what survives independently of the portal — your own copy of the journey."],
  ["Verify", "When a response arrives it is checked against the case's own trail, item by item — not summarised. A QR and record hash let anyone confirm nothing was altered."],
  ["Act", "If the statutory deadline lapses or the response is incomplete, the case surfaces the next legal step, drafted from its own facts, ready to review and file."],
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopNav />
      <main className="flex-1 max-w-reading mx-auto px-6 py-14 w-full">
        <p className="eyebrow text-primary mb-2">How it works</p>
        <h1 className="text-display-sm mb-2">Five stages, one continuous record</h1>
        <p className="text-[14px] text-ink-2 mb-8">
          Not five disconnected features — one information journey the citizen
          owns end to end.
        </p>
        <ol className="flex flex-col gap-3">
          {STEPS.map(([t, b], i) => (
            <li key={t} className="card p-4 flex gap-4">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-primary text-white text-[13px] font-semibold shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t}</p>
                <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">{b}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to="/login" className="btn btn-primary mt-8">
          Create your first RTI
        </Link>
      </main>
      <Footer />
    </div>
  );
}
