export function heuristicSubject(rawText: string): string {
  const clean = rawText.trim().replace(/\s+/g, " ");
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 77)}...`;
}
