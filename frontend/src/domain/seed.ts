import { computeHashChain } from "@/domain/integrity";
import {
  bulkInsert,
  hasDemoWorkspace,
  markDemoWorkspace,
  pushNotification,
} from "@/domain/store";
import type {
  CaseEvent,
  CaseRecord,
  Evidence,
  RequestVersion,
} from "@/domain/types";

const CITIZEN = "Priya Sharma";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

let seq = 0;
function ev(
  type: CaseEvent["type"],
  timestamp: string,
  actor: string,
  description: string,
  reference?: string,
): CaseEvent {
  seq += 1;
  return {
    id: `seed-evt-${seq}`,
    type,
    timestamp,
    actor,
    description,
    reference,
  };
}

function doc(
  kind: Evidence["kind"],
  title: string,
  source: string,
  dateIso: string,
  preview: string,
): Evidence {
  seq += 1;
  return {
    id: `seed-doc-${seq}`,
    kind,
    title,
    source,
    dateIso,
    preview,
    integrity: "VERIFIED",
  };
}

function versions(
  original: string,
  improved: string,
  createdAt: string,
): RequestVersion[] {
  return [
    {
      version: 1,
      label: "Citizen draft",
      text: original,
      createdAt,
      source: "citizen",
    },
    {
      version: 2,
      label: "Application Doctor revision",
      text: improved,
      createdAt,
      source: "doctor",
    },
    {
      version: 3,
      label: "Submitted",
      text: improved,
      createdAt,
      source: "system",
    },
  ];
}

function baseChecklist() {
  return {
    requestUnderstood: false,
    recordsIdentified: false,
    documentsLocated: false,
    exemptionReviewDone: false,
    responsePrepared: false,
    responseVerified: false,
    responseReleased: false,
  };
}

async function buildCaseA(): Promise<CaseRecord> {
  const submittedAt = daysAgo(35);
  const events = [
    ev(
      "REQUEST_CREATED",
      daysAgo(36),
      CITIZEN,
      'Request drafted: "Road repair expenditure — Ward 17"',
    ),
    ev(
      "REQUEST_REVISED",
      daysAgo(36),
      "Application Doctor",
      "Request rewritten to name specific records and a time period",
    ),
    ev(
      "REQUEST_SUBMITTED",
      submittedAt,
      CITIZEN,
      "Application submitted to Municipal Corporation of Delhi",
      "SR-2026-A7F29C",
    ),
    ev(
      "REQUEST_ACKNOWLEDGED",
      daysAgo(34),
      "Municipal Corporation of Delhi",
      "Acknowledgement of receipt issued",
    ),
    ev(
      "REQUEST_FORWARDED",
      daysAgo(32),
      "Public Works Department",
      "Request forwarded to the Ward 17 engineering desk",
    ),
    ev(
      "RESPONSE_RECEIVED",
      daysAgo(7),
      "Municipal Corporation of Delhi",
      "Response document attached to the trail",
    ),
    ev(
      "RESPONSE_VERIFIED",
      daysAgo(6),
      "System",
      "Response checked against the original request and attached to the trail",
    ),
  ];
  const evidence = [
    doc(
      "RECEIPT",
      "Application Receipt",
      "System",
      submittedAt,
      "Acknowledges receipt of application SR-2026-A7F29C, filed under the Right to Information Act, 2005.",
    ),
    doc(
      "FORWARDING_NOTICE",
      "Forwarding Notice",
      "Public Works Department",
      daysAgo(32),
      "Forwarded to the Ward 17 engineering desk for records relating to road repair work, FY 2025–26.",
    ),
    doc(
      "RESPONSE_DOCUMENT",
      "Response Document",
      "Municipal Corporation of Delhi",
      daysAgo(7),
      "Sanctioned estimate: Rs. 38.2 lakh. Work order WO-2025-1142 issued 14 May 2025 to Shivalik Infra Contractors. Completion certified 22 Jul 2025. Expenditure released: Rs. 36.9 lakh against the sanctioned estimate.",
    ),
  ];
  const record: CaseRecord = {
    suchnaId: "SR-2026-A7F29C",
    backendId: null,
    subject: "Road repair expenditure — Ward 17",
    authorityName: "Municipal Corporation of Delhi",
    department: "Public Works Department",
    citizenName: CITIZEN,
    originalRequest:
      "Please provide copies of work orders, expenditure records, inspection reports and completion reports relating to road repair work in Ward 17 from April 2025 to March 2026.",
    status: "RESPONSE_RELEASED",
    submittedAt,
    responseDueAt: daysAgo(5),
    createdAt: daysAgo(36),
    updatedAt: daysAgo(6),
    trailVersion: events.length,
    govStage: "RESPONSE_RELEASED",
    versions: versions(
      "Why hasn't the road in Ward 17 been repaired?",
      "Please provide copies of work orders, expenditure records, inspection reports and completion reports relating to road repair work in Ward 17 from April 2025 to March 2026.",
      daysAgo(36),
    ),
    events,
    evidence,
    audit: [
      {
        id: "seed-aud-a1",
        actor: "R. Malhotra (PIO)",
        action: "Opened case",
        timestamp: daysAgo(9),
      },
      {
        id: "seed-aud-a2",
        actor: "R. Malhotra (PIO)",
        action: "Attached response document",
        timestamp: daysAgo(7),
      },
      {
        id: "seed-aud-a3",
        actor: "R. Malhotra (PIO)",
        action: "Released response",
        timestamp: daysAgo(7),
      },
    ],
    reviewChecklist: {
      requestUnderstood: true,
      recordsIdentified: true,
      documentsLocated: true,
      exemptionReviewDone: true,
      responsePrepared: true,
      responseVerified: true,
      responseReleased: true,
    },
    appealReason: null,
    category: "Infrastructure",
  };
  await computeHashChain(record.events);
  return record;
}

async function buildCaseB(): Promise<CaseRecord> {
  const submittedAt = daysAgo(48);
  const dueAt = daysAgo(18);
  const events = [
    ev(
      "REQUEST_CREATED",
      daysAgo(49),
      CITIZEN,
      'Request drafted: "Waste management contract — Zone 4"',
    ),
    ev(
      "REQUEST_SUBMITTED",
      submittedAt,
      CITIZEN,
      "Application submitted to Municipal Corporation of Delhi",
      "SR-2026-B3819C",
    ),
    ev(
      "REQUEST_ACKNOWLEDGED",
      daysAgo(46),
      "Municipal Corporation of Delhi",
      "Acknowledgement of receipt issued",
    ),
    ev(
      "DEADLINE_MISSED",
      dueAt,
      "System",
      "Statutory 30-day response window lapsed with no response on record",
    ),
  ];
  const evidence = [
    doc(
      "RECEIPT",
      "Application Receipt",
      "System",
      submittedAt,
      "Acknowledges receipt of application SR-2026-B3819C.",
    ),
    doc(
      "ACKNOWLEDGEMENT",
      "Acknowledgement Notice",
      "Municipal Corporation of Delhi",
      daysAgo(46),
      "Application registered and assigned to the Solid Waste Management cell for response.",
    ),
  ];
  const record: CaseRecord = {
    suchnaId: "SR-2026-B3819C",
    backendId: null,
    subject: "Waste management contract — Zone 4",
    authorityName: "Municipal Corporation of Delhi",
    department: "Solid Waste Management",
    citizenName: CITIZEN,
    originalRequest:
      "Please provide copies of the tender, awarded contract value, and vendor compliance reports for the Zone 4 solid waste collection contract for FY 2024–25.",
    status: "OVERDUE",
    submittedAt,
    responseDueAt: dueAt,
    createdAt: daysAgo(49),
    updatedAt: dueAt,
    trailVersion: events.length,
    govStage: "UNDER_REVIEW",
    versions: [
      {
        version: 1,
        label: "Citizen draft",
        text: "Please provide copies of the tender, awarded contract value, and vendor compliance reports for the Zone 4 solid waste collection contract for FY 2024–25.",
        createdAt: daysAgo(49),
        source: "citizen",
      },
    ],
    events,
    evidence,
    audit: [
      {
        id: "seed-aud-b1",
        actor: "System",
        action: "Deadline sweep flagged case as overdue",
        timestamp: dueAt,
      },
    ],
    reviewChecklist: { ...baseChecklist(), requestUnderstood: true },
    appealReason: null,
    category: "Waste Management",
  };
  await computeHashChain(record.events);
  return record;
}

async function buildCaseC(): Promise<CaseRecord> {
  const submittedAt = daysAgo(27);
  const dueAt = daysFromNow(3);
  const events = [
    ev(
      "REQUEST_CREATED",
      daysAgo(28),
      CITIZEN,
      'Request drafted: "Public infrastructure spending — Rohini Sector 9"',
    ),
    ev(
      "REQUEST_SUBMITTED",
      submittedAt,
      CITIZEN,
      "Application submitted to Delhi Development Authority",
      "SR-2026-C1942D",
    ),
    ev(
      "REQUEST_ACKNOWLEDGED",
      daysAgo(25),
      "Delhi Development Authority",
      "Acknowledgement of receipt issued",
    ),
    ev(
      "REQUEST_FORWARDED",
      daysAgo(20),
      "Infrastructure Division",
      "Request forwarded to the Rohini project cell",
    ),
  ];
  const evidence = [
    doc(
      "RECEIPT",
      "Application Receipt",
      "System",
      submittedAt,
      "Acknowledges receipt of application SR-2026-C1942D.",
    ),
    doc(
      "FORWARDING_NOTICE",
      "Forwarding Notice",
      "Infrastructure Division",
      daysAgo(20),
      "Forwarded to the Rohini Sector 9 project cell for capital expenditure records.",
    ),
  ];
  const record: CaseRecord = {
    suchnaId: "SR-2026-C1942D",
    backendId: null,
    subject: "Public infrastructure spending — Rohini Sector 9",
    authorityName: "Delhi Development Authority",
    department: "Infrastructure Division",
    citizenName: CITIZEN,
    originalRequest:
      "Please provide the capital expenditure sanctioned and released for public infrastructure works in Rohini Sector 9 for FY 2025–26, with project-wise break-up.",
    status: "UNDER_REVIEW",
    submittedAt,
    responseDueAt: dueAt,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(20),
    trailVersion: events.length,
    govStage: "INFO_LOCATED",
    versions: [
      {
        version: 1,
        label: "Citizen draft",
        text: "Please provide the capital expenditure sanctioned and released for public infrastructure works in Rohini Sector 9 for FY 2025–26, with project-wise break-up.",
        createdAt: daysAgo(28),
        source: "citizen",
      },
    ],
    events,
    evidence,
    audit: [
      {
        id: "seed-aud-c1",
        actor: "N. Bhardwaj (PIO)",
        action: "Opened case",
        timestamp: daysAgo(21),
      },
      {
        id: "seed-aud-c2",
        actor: "N. Bhardwaj (PIO)",
        action: "Located project ledger",
        timestamp: daysAgo(19),
      },
    ],
    reviewChecklist: {
      ...baseChecklist(),
      requestUnderstood: true,
      recordsIdentified: true,
    },
    appealReason: null,
    category: "Infrastructure",
  };
  await computeHashChain(record.events);
  return record;
}

async function buildCaseD(): Promise<CaseRecord> {
  const submittedAt = daysAgo(25);
  const events = [
    ev(
      "REQUEST_CREATED",
      daysAgo(26),
      CITIZEN,
      'Request drafted: "Government school expenditure — District North"',
    ),
    ev(
      "REQUEST_SUBMITTED",
      submittedAt,
      CITIZEN,
      "Application submitted to Directorate of Education, Delhi",
      "SR-2026-D72E11",
    ),
    ev(
      "REQUEST_ACKNOWLEDGED",
      daysAgo(23),
      "Directorate of Education, Delhi",
      "Acknowledgement of receipt issued",
    ),
    ev(
      "RESPONSE_RECEIVED",
      daysAgo(1),
      "Directorate of Education, Delhi",
      "Response document attached to the trail",
    ),
  ];
  const evidence = [
    doc(
      "RECEIPT",
      "Application Receipt",
      "System",
      submittedAt,
      "Acknowledges receipt of application SR-2026-D72E11.",
    ),
    doc(
      "RESPONSE_DOCUMENT",
      "Response Document",
      "Directorate of Education, Delhi",
      daysAgo(1),
      "Annual grant-in-aid released to District North government schools for FY 2025–26: Rs. 4.1 crore. Utilization certificates pending from 3 of 14 schools.",
    ),
  ];
  const record: CaseRecord = {
    suchnaId: "SR-2026-D72E11",
    backendId: null,
    subject: "Government school expenditure — District North",
    authorityName: "Directorate of Education, Delhi",
    department: "School Administration",
    citizenName: CITIZEN,
    originalRequest:
      "Please provide the annual grant-in-aid released to government schools in District North for FY 2025–26, and utilization certificates on record.",
    status: "RESPONSE_RELEASED",
    submittedAt,
    responseDueAt: daysAgo(1),
    createdAt: daysAgo(26),
    updatedAt: daysAgo(1),
    trailVersion: events.length,
    govStage: "RESPONSE_RELEASED",
    versions: [
      {
        version: 1,
        label: "Citizen draft",
        text: "Please provide the annual grant-in-aid released to government schools in District North for FY 2025–26, and utilization certificates on record.",
        createdAt: daysAgo(26),
        source: "citizen",
      },
    ],
    events,
    evidence,
    audit: [
      {
        id: "seed-aud-d1",
        actor: "K. Iyer (PIO)",
        action: "Released response",
        timestamp: daysAgo(1),
      },
    ],
    reviewChecklist: {
      ...baseChecklist(),
      requestUnderstood: true,
      recordsIdentified: true,
      documentsLocated: true,
      responsePrepared: true,
      responseVerified: true,
      responseReleased: true,
    },
    appealReason: null,
    category: "Education",
  };
  await computeHashChain(record.events);
  return record;
}

async function buildCaseE(): Promise<CaseRecord> {
  const submittedAt = daysAgo(65);
  const dueAt = daysAgo(35);
  const appealAt = daysAgo(5);
  const events = [
    ev(
      "REQUEST_CREATED",
      daysAgo(66),
      CITIZEN,
      'Request drafted: "Public procurement records — office equipment tender"',
    ),
    ev(
      "REQUEST_SUBMITTED",
      submittedAt,
      CITIZEN,
      "Application submitted to Central Public Works Department",
      "SR-2026-E91F27",
    ),
    ev(
      "REQUEST_ACKNOWLEDGED",
      daysAgo(63),
      "Central Public Works Department",
      "Acknowledgement of receipt issued",
    ),
    ev(
      "DEADLINE_MISSED",
      dueAt,
      "System",
      "Statutory 30-day response window lapsed with no response on record",
    ),
    ev(
      "APPEAL_PREPARED",
      appealAt,
      CITIZEN,
      "First Appeal prepared and saved to the trail",
    ),
    ev(
      "APPEAL_SUBMITTED",
      daysAgo(4),
      CITIZEN,
      "First Appeal filed with the Appellate Authority",
    ),
  ];
  const evidence = [
    doc(
      "RECEIPT",
      "Application Receipt",
      "System",
      submittedAt,
      "Acknowledges receipt of application SR-2026-E91F27.",
    ),
    doc(
      "APPEAL_DOCUMENT",
      "First Appeal",
      CITIZEN,
      appealAt,
      "First Appeal citing Section 19(1) of the RTI Act, 2005 — no response received within the statutory 30-day window.",
    ),
  ];
  const record: CaseRecord = {
    suchnaId: "SR-2026-E91F27",
    backendId: null,
    subject: "Public procurement records — office equipment tender",
    authorityName: "Central Public Works Department",
    department: "Procurement Wing",
    citizenName: CITIZEN,
    originalRequest:
      "Please provide the tender document, bid evaluation records, and awarded vendor details for the FY 2025–26 office equipment procurement tender.",
    status: "FIRST_APPEAL",
    submittedAt,
    responseDueAt: dueAt,
    createdAt: daysAgo(66),
    updatedAt: daysAgo(4),
    trailVersion: events.length,
    govStage: "UNDER_REVIEW",
    versions: [
      {
        version: 1,
        label: "Citizen draft",
        text: "Please provide the tender document, bid evaluation records, and awarded vendor details for the FY 2025–26 office equipment procurement tender.",
        createdAt: daysAgo(66),
        source: "citizen",
      },
    ],
    events,
    evidence,
    audit: [
      {
        id: "seed-aud-e1",
        actor: "System",
        action: "Deadline sweep flagged case as overdue",
        timestamp: dueAt,
      },
    ],
    reviewChecklist: baseChecklist(),
    appealReason:
      "No response was received within the statutory 30-day window under Section 7(1) of the RTI Act, 2005.",
    category: "Procurement",
  };
  await computeHashChain(record.events);
  return record;
}

/**
 * Loads the deliberate demo workspace — a coherent set of five linked
 * cases for one citizen (Priya Sharma), all visible from both the citizen
 * and government sides, feeding the same analytics, audit and search.
 *
 * This is NEVER called on plain app start. It runs only when a presenter
 * explicitly picks "Citizen demo" / "Government demo" on the login
 * screen, or re-enters a demo session. A fresh citizen login seeds
 * nothing.
 */
export async function loadDemoWorkspace(): Promise<void> {
  if (hasDemoWorkspace()) return;
  const [a, b, c, d, e] = await Promise.all([
    buildCaseA(),
    buildCaseB(),
    buildCaseC(),
    buildCaseD(),
    buildCaseE(),
  ]);
  bulkInsert([a, b, c, d, e]);
  markDemoWorkspace();
  pushNotification(
    b.suchnaId,
    "Your response deadline for SR-2026-B3819C has passed.",
  );
  pushNotification(
    d.suchnaId,
    "A new response document was added to SR-2026-D72E11.",
  );
  pushNotification(c.suchnaId, "SR-2026-C1942D is due for response in 3 days.");
}
