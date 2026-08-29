import type { CaseEvent, CaseEventType } from "@/domain/types";
import { formatDateTime } from "@/lib/format";

export const EVENT_LABEL: Record<CaseEventType, string> = {
  REQUEST_CREATED: "Request drafted",
  REQUEST_REVISED: "Request revised",
  REQUEST_SUBMITTED: "Application submitted",
  REQUEST_ACKNOWLEDGED: "Acknowledgement issued",
  REQUEST_FORWARDED: "Request forwarded",
  DOCUMENT_ADDED: "Document added to trail",
  RESPONSE_RECEIVED: "Response received",
  RESPONSE_VERIFIED: "Response verified",
  DEADLINE_APPROACHING: "Deadline approaching",
  DEADLINE_MISSED: "Response deadline missed",
  APPEAL_PREPARED: "First appeal prepared",
  APPEAL_SUBMITTED: "First appeal filed",
  GOV_STAGE_CHANGED: "Processing stage changed",
  CASE_CLOSED: "Case closed",
};

const ICON: Record<CaseEventType, string> = {
  REQUEST_CREATED: "edit_note",
  REQUEST_REVISED: "auto_fix_high",
  REQUEST_SUBMITTED: "send",
  REQUEST_ACKNOWLEDGED: "task_alt",
  REQUEST_FORWARDED: "alt_route",
  DOCUMENT_ADDED: "attach_file",
  RESPONSE_RECEIVED: "mark_email_read",
  RESPONSE_VERIFIED: "verified",
  DEADLINE_APPROACHING: "schedule",
  DEADLINE_MISSED: "error",
  APPEAL_PREPARED: "gavel",
  APPEAL_SUBMITTED: "outbound",
  GOV_STAGE_CHANGED: "sync_alt",
  CASE_CLOSED: "check_circle",
};

/** The forensic, chronological event stream. Every row is a real
 * CaseEvent carrying its own hash-chain link (domain/integrity.ts). */
export function TrailTimeline({
  events,
  onOpenDocument,
  dark = false,
}: {
  events: CaseEvent[];
  onOpenDocument?: (id: string) => void;
  dark?: boolean;
}) {
  const ordered = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const line = dark ? "bg-gov-line" : "bg-line";
  const node = dark
    ? "border-gov-line bg-gov-panel-2 text-gov-ink-2"
    : "border-line bg-panel-3 text-ink-2";
  const title = dark ? "text-gov-ink" : "text-ink";
  const body = dark ? "text-gov-ink-2" : "text-ink-2";
  const dim = dark ? "text-gov-ink-3" : "text-ink-3";

  return (
    <ol className="relative">
      <span className={`absolute left-[13px] top-3 bottom-3 w-px ${line}`} />
      {ordered.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
          <span
            className={`relative z-10 grid place-items-center h-[27px] w-[27px] rounded-full border shrink-0 ${node}`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {ICON[event.type]}
            </span>
          </span>
          <div className="min-w-0 flex-1 -mt-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className={`text-[13px] font-semibold ${title}`}>
                {EVENT_LABEL[event.type]}
              </p>
              <time className={`text-[11.5px] shrink-0 ${dim}`}>
                {formatDateTime(event.timestamp)}
              </time>
            </div>
            <p className={`text-[12.5px] mt-0.5 leading-snug ${body}`}>
              {event.description}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-[11px] font-semibold rounded px-1.5 py-0.5 border ${
                  dark
                    ? "border-gov-line text-gov-ink-2"
                    : "border-line bg-panel-3 text-ink-2"
                }`}
              >
                {event.actor}
              </span>
              {event.reference && (
                <span className={`font-mono text-[11.5px] ${dim}`}>
                  {event.reference}
                </span>
              )}
              {event.documentId && onOpenDocument && (
                <button
                  onClick={() => onOpenDocument(event.documentId!)}
                  className={`text-[11px] font-semibold rounded px-1.5 py-0.5 border ${
                    dark
                      ? "border-blue-500/30 text-blue-300"
                      : "border-primary-line bg-primary-wash text-primary-strong"
                  }`}
                >
                  View document
                </button>
              )}
              {event.hash && (
                <span
                  className={`font-mono text-[11.5px] ${dim}`}
                  title={`Hash link ${i + 1}: ${event.hash}`}
                >
                  #{event.hash.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
