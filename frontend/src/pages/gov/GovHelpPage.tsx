import { GovCard, GovPage } from "@/components/gov/GovUI";

const ITEMS = [
  [
    "Case Queue",
    "Every request routed to this authority, filterable by state and urgency. A red bar means overdue, amber means due within five days.",
  ],
  [
    "Response Review",
    "The drafting-to-release pipeline. Move a case forward from its workspace — each transition writes an audit event.",
  ],
  [
    "Deadlines",
    "The Section 7(1) clock on every open request. Overdue cases are flagged as appeal-eligible.",
  ],
  [
    "Audit",
    "Every recorded official action across every case — who did what, and when. Backed by real application state, not a display.",
  ],
  [
    "The citizen's view",
    "Everything here is one side of a shared record. The citizen sees the same case, the same timeline and the same evidence from their own workspace.",
  ],
];

export function GovHelpPage() {
  return (
    <GovPage title="Help" eyebrow="Operations console">
      <div className="max-w-reading flex flex-col gap-2">
        {ITEMS.map(([t, b]) => (
          <GovCard key={t} className="p-4">
            <p className="text-[13.5px] font-semibold text-gov-ink">{t}</p>
            <p className="text-[12.5px] text-gov-ink-2 mt-1 leading-relaxed">
              {b}
            </p>
          </GovCard>
        ))}
      </div>
    </GovPage>
  );
}
