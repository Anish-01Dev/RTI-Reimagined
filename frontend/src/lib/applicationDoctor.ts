/**
 * Application Doctor — deterministic, rule-based RTI-quality analysis.
 *
 * Deliberately NOT an LLM call: the demo must never depend on an external
 * AI API being reachable or configured (see backend/app/domain/ai/client.py
 * for what that dependency looks like when it fails). Every score here is
 * computed from the input text by a fixed, inspectable rule, not sampled —
 * the same input always produces the same analysis.
 */

export type QuestionType =
  | "Reason-seeking (why/how)"
  | "Record request"
  | "Status inquiry"
  | "General information seeking";

export interface DoctorAnalysis {
  clarity: number;
  specificity: number;
  timePeriodPresent: boolean;
  authorityConfidence: "Likely correct" | "Uncertain — verify jurisdiction";
  authorityGuess: string | null;
  questionType: QuestionType;
  issue: string | null;
  suggestedRewrite: string;
  subject: string;
  location: string | null;
}

const REASON_WORDS = /\b(why|how come|reason)\b/i;
const RECORD_WORDS =
  /\b(provide|copies?|copy of|details? of|records?|documents?|inspection|expenditure)\b/i;
const STATUS_WORDS = /\b(status|progress|when will|update on)\b/i;
const TIME_PATTERN =
  /\b(20\d{2}|since|from\s+\w+\s+to|between\s+\w+\s+and|last\s+(month|year|quarter)|financial\s+year|fy\s?\d{2,4})\b/i;
const VAGUE_WORDS = /\b(some|things|stuff|etc|whatever|somehow)\b/i;
const LOCATION_PATTERN = /\bward\s*(no\.?)?\s*(\d+)\b/i;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function detectQuestionType(text: string): QuestionType {
  if (REASON_WORDS.test(text)) return "Reason-seeking (why/how)";
  if (STATUS_WORDS.test(text)) return "Status inquiry";
  if (RECORD_WORDS.test(text)) return "Record request";
  return "General information seeking";
}

function scoreClarity(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let score = 74;
  score += clamp(words.length - 6, 0, 10); // a bare few words reads as unclear
  score -= (text.match(VAGUE_WORDS) ?? []).length * 12;
  score -= text.includes("...") ? 8 : 0;
  score += /\?$/.test(text.trim()) ? 5 : 0;
  score -= words.length > 60 ? 10 : 0; // a wall of text is unclear too
  return Math.round(clamp(score, 15, 96));
}

function scoreSpecificity(text: string): number {
  let score = 28;
  if (LOCATION_PATTERN.test(text)) score += 16;
  if (TIME_PATTERN.test(text)) score += 20;
  if (/\d/.test(text)) score += 5;
  // Skip the sentence's first word — capitalization there is a grammar
  // artifact ("Why...", "The..."), not a genuine specific/named entity.
  const [, ...rest] = text.split(/\s+/);
  const properNouns = rest.join(" ").match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  score += clamp(properNouns.length * 5, 0, 16);
  if (RECORD_WORDS.test(text)) score += 10;
  return Math.round(clamp(score, 10, 95));
}

function extractLocation(text: string): string | null {
  const wardMatch = text.match(LOCATION_PATTERN);
  if (wardMatch) return `Ward ${wardMatch[2]}`;
  return null;
}

function extractSubject(text: string): string {
  const cleaned = text
    .replace(/^(why hasn'?t|why has|why did|why is|why isn'?t|how come)/i, "")
    .replace(/\?$/, "")
    .trim();
  // Only the keyword itself, deliberately not a greedy tail match — a
  // case-insensitive [a-z]* tail would also swallow the next capitalized
  // word (e.g. "Ward"), which then duplicated the location clause below.
  const subjectMatch = cleaned.match(
    /\b(road|water supply|sanitation|street\s?light|drainage|construction|contract|expenditure|budget|school|hospital)( repair| work| project)?\b/i,
  );
  return subjectMatch ? subjectMatch[0].trim() : cleaned.slice(0, 60);
}

function buildRewrite(text: string, location: string | null): string {
  let subject = extractSubject(text).toLowerCase() || "the matter raised";
  if (/\brepair/i.test(text) && !/repair/i.test(subject)) {
    subject += " repair work";
  }
  const locClause = location ? ` in ${location}` : "";
  return (
    `Please provide copies of work orders, expenditure records, inspection reports ` +
    `and completion reports relating to ${subject}${locClause} from April 2025 to March 2026.`
  );
}

export function analyzeRequest(rawText: string): DoctorAnalysis {
  const text = rawText.trim();
  const questionType = detectQuestionType(text);
  const timePeriodPresent = TIME_PATTERN.test(text);
  const location = extractLocation(text);
  const authorityGuess = location ? "Public Works Department (PWD)" : null;

  const issue =
    questionType === "Reason-seeking (why/how)"
      ? "The question asks for a reason rather than requesting an existing record or document — public authorities aren't obligated to explain themselves, only to disclose records they hold."
      : !timePeriodPresent
        ? "No time period is specified — authorities may reject or narrow a request that doesn't bound the records being asked for."
        : null;

  return {
    clarity: scoreClarity(text),
    specificity: scoreSpecificity(text),
    timePeriodPresent,
    authorityConfidence: authorityGuess
      ? "Likely correct"
      : "Uncertain — verify jurisdiction",
    authorityGuess,
    questionType,
    issue,
    suggestedRewrite: buildRewrite(text, location),
    subject: extractSubject(text),
    location,
  };
}

export const DOCTOR_EXAMPLE = "Why hasn't the road in Ward 17 been repaired?";
