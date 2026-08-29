import type { CaseRecord } from "@/domain/types";
import { formatDate } from "@/lib/format";

export const APPEAL_CITATION = "Section 19(1) of the RTI Act, 2005";

/** A First Appeal narrative built entirely from this case's own stored
 * facts — Suchna ID, verbatim original request, authority, dates. No
 * invented facts, no external AI call; deterministic so it's demo-safe. */
export function buildAppealNarrative(record: CaseRecord): string {
  return [
    `I filed RTI request ${record.suchnaId} ("${record.subject}") with ${record.authorityName} on ${formatDate(record.submittedAt)}.`,
    `Original request: "${record.originalRequest}"`,
    record.status === "OVERDUE"
      ? `No response was received within the statutory 30-day period under Section 7(1) of the RTI Act, 2005.`
      : `The response received did not adequately address the request.`,
    `I am filing this First Appeal under ${APPEAL_CITATION} and request that the Appellate Authority direct the Public Information Officer to furnish the information in full.`,
  ].join("\n\n");
}
