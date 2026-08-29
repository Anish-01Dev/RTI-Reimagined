import type { Authority } from "@/types";

/**
 * Demo identity layer — NOT authentication.
 *
 * The backend has no auth subsystem yet (see the NOTE on
 * backend/app/schemas/applications.py:ApplicationCreate.user_id — every
 * write endpoint takes a client-supplied user_id/actor_id "pre-auth
 * placeholder" by design, until a real session-derived identity exists).
 * There's also no user-creation or authority-listing endpoint yet (both
 * are documented as future onboarding phases).
 *
 * So this is a fixed demo directory, seeded into Postgres by
 * backend/scripts/seed_demo_data.py with the exact same UUIDs hardcoded
 * below. The Login page's phone/OTP flow is a UI walkthrough over this
 * fixed identity, not a real credential check — any 10-digit number and
 * the fixed demo OTP below "succeeds". Do not treat this as a security
 * boundary; it isn't one, on either side.
 */

export const DEMO_OTP = "123456";

export const DEMO_CITIZEN = {
  id: "ba38e470-c5e6-5901-ab60-7cffce1a746c",
  name: "Priya Sharma",
  phone: "+919876543210",
};

export const DEMO_OFFICIAL = {
  id: "gov-demo-officer",
  name: "R. Malhotra",
  title: "Public Information Officer",
  authority: "Municipal Corporation of Delhi",
};

export type Role = "CITIZEN" | "GOVERNMENT_OFFICIAL";

// Deterministic UUIDs (uuid5) matching backend/scripts/seed_demo_data.py —
// the two must stay in sync until a real authority-directory endpoint
// exists.
export const DEMO_AUTHORITIES: Authority[] = [
  {
    id: "2a6ca4ff-d1e6-580f-b939-5fa54e4a1ee0",
    name: "Public Works Department (PWD)",
    type: "STATE",
    jurisdiction: "State of Maharashtra",
    state: "Maharashtra",
    district: "Mumbai",
    department: "Public Works",
  },
  {
    id: "b753c576-9bed-5284-ade0-5f0bee7c350d",
    name: "Ministry of Environment, Forest and Climate Change",
    type: "CENTRAL",
    jurisdiction: "Central Government, New Delhi",
    state: "Delhi",
    district: "New Delhi",
    department: "Environment, Forest and Climate Change",
  },
  {
    id: "fe639773-fec4-5048-a786-68408e36a033",
    name: "Ministry of Housing and Urban Affairs",
    type: "CENTRAL",
    jurisdiction: "Central Government, New Delhi",
    state: "Delhi",
    district: "New Delhi",
    department: "Housing and Urban Affairs",
  },
  {
    id: "cc948144-9fdf-59a1-a323-c0676531d972",
    name: "Ministry of Home Affairs",
    type: "CENTRAL",
    jurisdiction: "Central Government, New Delhi",
    state: "Delhi",
    district: "New Delhi",
    department: "Home Affairs",
  },
  {
    id: "430ce298-bafa-5955-82d7-ea977423ea43",
    name: "Municipal Corporation, Ward 42",
    type: "STATE",
    jurisdiction: "Municipal Corporation of Greater Mumbai",
    state: "Maharashtra",
    district: "Mumbai",
    department: "Ward Office 42",
  },
  {
    id: "db3eeaa7-105f-5782-be6e-771487509c60",
    name: "Ministry of Urban Development, Delhi",
    type: "CENTRAL",
    jurisdiction: "Government of NCT of Delhi",
    state: "Delhi",
    district: "New Delhi",
    department: "Urban Development",
  },
];

const SESSION_KEY = "rti-reimagined:demo-session";

export interface Session {
  role: Role;
  userId: string;
  name: string;
  phone?: string;
  title?: string;
  authority?: string;
  /** True when this session was opened via a "demo workspace" entry on the
   * login screen. Drives the "Demo workspace" badge in the app chrome and
   * the "Exit demo" control. A plain citizen/official login is not a demo
   * session and never sees seeded data. */
  demo?: boolean;
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Sessions from before role-based auth existed had no `role` field —
    // treat them as citizen sessions rather than crashing every screen
    // that reads session.role.
    return { role: "CITIZEN", ...parsed };
  } catch {
    return null;
  }
}

export function startCitizenSession(opts?: { demo?: boolean }): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      role: "CITIZEN",
      userId: DEMO_CITIZEN.id,
      name: DEMO_CITIZEN.name,
      phone: DEMO_CITIZEN.phone,
      demo: opts?.demo ?? false,
    } satisfies Session),
  );
}

export function startGovSession(opts?: { demo?: boolean }): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      role: "GOVERNMENT_OFFICIAL",
      userId: DEMO_OFFICIAL.id,
      name: DEMO_OFFICIAL.name,
      title: DEMO_OFFICIAL.title,
      authority: DEMO_OFFICIAL.authority,
      demo: opts?.demo ?? false,
    } satisfies Session),
  );
}

export function isDemoSession(): boolean {
  return getSession()?.demo === true;
}

export function endSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** Very rough authority suggester used while the real AI decompose
 * endpoint is unconfigured (no LANGUAGE_MODEL_API_KEY — see
 * backend/.env.example) or unreachable. Keyword match against
 * department/name only; a human still confirms the choice before filing. */
export function suggestAuthority(freeText: string): Authority | null {
  const text = freeText.toLowerCase();
  const scored = DEMO_AUTHORITIES.map((authority) => {
    const haystack =
      `${authority.name} ${authority.department ?? ""}`.toLowerCase();
    const keywords = haystack
      .split(/[\s,()]+/)
      .filter((word) => word.length > 3);
    const score = keywords.filter((word) => text.includes(word)).length;
    return { authority, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].authority : null;
}
