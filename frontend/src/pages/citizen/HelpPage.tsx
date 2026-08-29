import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { PageHeader } from "@/components/ui/Primitives";

const FLOW = [
  ["Create an RTI", "Draft the request — Application Doctor checks specificity, time period and record-orientation before you file.", "/app/create"],
  ["Track the journey", "Filing mints a Suchna ID and starts the 30-day Rights Clock. Every acknowledgement, transfer and response is logged as an event.", "/app/cases"],
  ["Watch the deadlines", "The Deadlines view counts the statutory window on every open case and names the next legal step.", "/app/deadlines"],
  ["Hold your own record", "Each case keeps a hash-chained trail you can download, print, verify or carry offline — independent of any portal.", "/app/trails"],
  ["Act on silence", "When a deadline lapses, the case surfaces a First Appeal drafted from its own facts, ready to review and file.", "/app/legal"],
];

const FAQ = [
  ["Is this an official government portal?", "No. Suchna Rakshak is an independent reliability layer around the RTI process. You still file with the public authority; this keeps a citizen-owned record of what happened."],
  ["What does “tamper-evident” mean here?", "Every event in a case is hashed together with the one before it using the browser's SHA-256. Reorder or edit any event and every later hash stops matching. It is not blockchain and not a guarantee against someone who controls this browser."],
  ["Where is my data stored?", "In this browser. Nothing about your cases is sent anywhere unless you download or share it yourself."],
];

export function HelpPage() {
  return (
    <PageContainer>
      <div className="max-w-reading">
        <PageHeader title="Help" eyebrow="Getting started" />

        <h2 className="section-label mb-3">The five stages</h2>
        <ol className="flex flex-col gap-2 mb-8">
          {FLOW.map(([title, body, to], i) => (
            <li key={title}>
              <Link to={to} className="card card-hover p-4 flex gap-3.5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-primary text-white text-[12px] font-semibold shrink-0">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink">
                    {title}
                  </span>
                  <span className="block text-[12.5px] text-ink-3 mt-0.5 leading-snug">
                    {body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <h2 className="section-label mb-3">Frequently asked</h2>
        <div className="card divide-y divide-line">
          {FAQ.map(([q, a]) => (
            <div key={q} className="p-4">
              <p className="text-[13px] font-semibold text-ink">{q}</p>
              <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
