/**
 * Request diagnostics — a deterministic, inspectable pre-filing check that
 * runs an RTI draft against the disclosure tests a Public Information
 * Officer actually applies. Built on the same rule primitives as
 * lib/applicationDoctor.ts (no LLM, same input → same report), but
 * expressed as a categorised list of findings with severity, the part of
 * the request each one affects, and a concrete recommendation — the shape
 * a diagnostic workspace needs, not a single quality score.
 */

import { analyzeRequest } from "@/lib/applicationDoctor";

export type Severity = "critical" | "warning" | "pass";

export type DiagnosticCategory =
  | "Completeness"
  | "Scope"
  | "Routing"
  | "Legal exposure"
  | "Clarity";

export interface Diagnostic {
  id: string;
  category: DiagnosticCategory;
  title: string;
  severity: Severity;
  detail: string;
  affected: string;
  recommendation: string | null;
}

export type Assessment =
  | "Ready to file"
  | "File with caution"
  | "Revise before filing";

export interface DiagnosticReport {
  checks: Diagnostic[];
  passed: number;
  warnings: number;
  critical: number;
  total: number;
  score: number; // 0–100, derived from the findings
  assessment: Assessment;
  suggestedRewrite: string;
  /** True when applying the Doctor's rewrite would clear the open
   * findings — i.e. the issues are ones the rewrite actually fixes. */
  autoResolvable: boolean;
}

const RECORD_WORDS =
  /\b(provide|provided|share|furnish|copies?|copy of|records?|documents?|reports?|orders?|register|ledger|file notings?|correspondence|minutes|estimates?|certificates?)\b/i;
const EXEMPTION_WORDS =
  /\b(cabinet|national security|personal information|medical record|passport details|aadhaar number|home address|caste|salary of|phone number of)\b/i;
const MULTI_ASK = /\b(and also|as well as|additionally|furthermore|;|\balso provide)\b/i;
const VAGUE_WORDS =
  /\b(some|many|a lot of|lots of|things|stuff|etc\.?|properly|somehow|various|several times)\b/i;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function diagnoseRequest(input: {
  text: string;
  /** Pass true when the target authority is already chosen (case is
   * routed) so routing isn't re-litigated from the text alone. */
  authorityKnown?: boolean;
}): DiagnosticReport {
  const text = input.text.trim();
  const a = analyzeRequest(text);
  const words = text.split(/\s+/).filter(Boolean);

  const namesRecords =
    a.questionType === "Record request" || RECORD_WORDS.test(text);
  const reasonSeeking = a.questionType === "Reason-seeking (why/how)";
  const bounded = a.timePeriodPresent;
  const multiAsk = MULTI_ASK.test(text) || words.length > 90;
  const routed = input.authorityKnown ?? Boolean(a.authorityGuess);
  const exemptionRisk = EXEMPTION_WORDS.test(text);
  const specificEnough = a.specificity >= 52;
  const vague = VAGUE_WORDS.test(text);

  const checks: Diagnostic[] = [
    {
      id: "records",
      category: "Completeness",
      title: "Names the records being sought",
      severity: namesRecords ? "pass" : "critical",
      detail: namesRecords
        ? "The request points at documents a public authority can retrieve and disclose."
        : "The request names no document. Under Section 2(f) an authority discloses material it holds — it is not obliged to research a topic or compile a new answer.",
      affected: "Request text",
      recommendation: namesRecords
        ? null
        : "Ask for the specific work orders, ledgers, notings or correspondence rather than posing a general question.",
    },
    {
      id: "framing",
      category: "Legal exposure",
      title: "Seeks information, not an explanation",
      severity: reasonSeeking ? "critical" : "pass",
      detail: reasonSeeking
        ? 'The question asks "why" or "how" — a justification. An officer can be compelled to hand over records, not to give reasons, so a request framed this way is routinely refused under Section 2(f).'
        : "The request seeks disclosure of held material, which is within Section 2(f).",
      affected: "Question framing",
      recommendation: reasonSeeking
        ? "Reframe as a request for the records that would show the position — sanction orders, file notings, expenditure statements, correspondence."
        : null,
    },
    {
      id: "period",
      category: "Scope",
      title: "Bounded by a time period",
      severity: bounded ? "pass" : "warning",
      detail: bounded
        ? "A date range is stated, so the search can be scoped precisely."
        : "No date range is given. Authorities routinely narrow, delay or return unbounded requests, or invoke Section 7(9) — disproportionate diversion of resources.",
      affected: "Request scope",
      recommendation: bounded
        ? null
        : "State the financial year or month range the records should cover.",
    },
    {
      id: "single",
      category: "Scope",
      title: "One coherent subject",
      severity: multiAsk ? "warning" : "pass",
      detail: multiAsk
        ? "The draft bundles several distinct asks. Each answer, and each 30-day clock, stays cleaner when they are filed separately."
        : "The request has a single, answerable subject.",
      affected: "Request scope",
      recommendation: multiAsk
        ? "Split unrelated asks into separate applications."
        : null,
    },
    {
      id: "routing",
      category: "Routing",
      title: "Addressed to a likely record-holder",
      severity: routed ? "pass" : "warning",
      detail: routed
        ? `Routing looks correct${a.authorityGuess ? ` — ${a.authorityGuess}` : ""}. A misdirected request loses five working days on transfer under Section 6(3).`
        : "The holding authority isn't clear from the text. A misdirected request loses time on transfer under Section 6(3).",
      affected: "Target authority",
      recommendation: routed
        ? null
        : "Confirm which office actually holds these records before filing.",
    },
    {
      id: "exemption",
      category: "Legal exposure",
      title: "No obvious exemption trigger",
      severity: exemptionRisk ? "warning" : "pass",
      detail: exemptionRisk
        ? "Some wording may attract a Section 8(1) exemption — personal information, security, or cabinet papers. Expect a partial response or a public-interest argument."
        : "Nothing in the request obviously attracts a Section 8(1) exemption.",
      affected: "Request text",
      recommendation: exemptionRisk
        ? "Narrow to the non-exempt part, or be ready to argue the larger public interest under Section 8(2)."
        : null,
    },
    {
      id: "specificity",
      category: "Clarity",
      title: "Specific enough to action without clarification",
      severity: specificEnough ? "pass" : "warning",
      detail:
        `Specificity scores ${a.specificity}/100 on named entities, quantities and record types.` +
        (specificEnough
          ? ""
          : " A PIO may return it for clarification, which restarts the clock."),
      affected: "Request text",
      recommendation: specificEnough
        ? null
        : "Name the ward, scheme, contract number or office to raise specificity.",
    },
    {
      id: "phrasing",
      category: "Clarity",
      title: "Unambiguous phrasing",
      severity: vague ? "warning" : "pass",
      detail: vague
        ? 'Vague quantifiers ("some", "many", "properly") let the authority answer a narrower question than the one intended.'
        : "Phrasing is precise.",
      affected: "Request text",
      recommendation: vague
        ? "Replace vague terms with specific figures, names or dates."
        : null,
    },
  ];

  const critical = checks.filter((c) => c.severity === "critical").length;
  const warnings = checks.filter((c) => c.severity === "warning").length;
  const passed = checks.filter((c) => c.severity === "pass").length;

  const score = Math.round(clamp(100 - critical * 27 - warnings * 9, 4, 100));
  const assessment: Assessment =
    critical > 0
      ? "Revise before filing"
      : warnings > 1
        ? "File with caution"
        : "Ready to file";

  // The rewrite names records and adds an April–March window, so it
  // clears the framing / records / period findings. Offer it whenever
  // one of those is open.
  const autoResolvable =
    !namesRecords || reasonSeeking || !bounded || !specificEnough;

  return {
    checks,
    passed,
    warnings,
    critical,
    total: checks.length,
    score,
    assessment,
    suggestedRewrite: a.suggestedRewrite,
    autoResolvable,
  };
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; chip: string; dot: string; icon: string }
> = {
  critical: {
    label: "Critical",
    chip: "chip-danger",
    dot: "bg-danger",
    icon: "error",
  },
  warning: {
    label: "Review",
    chip: "chip-warn",
    dot: "bg-warn",
    icon: "warning",
  },
  pass: {
    label: "Passed",
    chip: "chip-success",
    dot: "bg-success",
    icon: "check_circle",
  },
};
