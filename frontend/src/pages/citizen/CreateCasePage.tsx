import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { api, ApiError } from "@/lib/api";
import { createCase, submitCase } from "@/domain/store";
import { syncOfflineRecord } from "@/offline/citizenRecord";
import { getCase } from "@/domain/store";
import type { RequestVersion } from "@/domain/types";
import {
  DEMO_AUTHORITIES,
  DEMO_CITIZEN,
  getSession,
  suggestAuthority,
} from "@/lib/demoIdentity";
import { analyzeRequest } from "@/lib/applicationDoctor";
import { heuristicSubject } from "@/lib/heuristics";

const TEMPLATES = [
  {
    label: "Public works expenditure",
    text: "Please provide copies of work orders, sanctioned estimates, expenditure records and completion certificates for road repair work in Ward 17 from April 2025 to March 2026.",
    period: "April 2025 – March 2026",
  },
  {
    label: "Contract / tender records",
    text: "Please provide a copy of the tender document, the bid evaluation record and the awarded contract value for the Zone 4 solid waste collection contract for FY 2024–25.",
    period: "FY 2024–25",
  },
  {
    label: "Scheme fund utilisation",
    text: "Please provide the grant-in-aid released to government schools in District North for FY 2025–26 and the utilisation certificates on record.",
    period: "FY 2025–26",
  },
];

const STEPS = ["Request", "Authority", "Scope", "Review", "Confirm"] as const;

export function CreateCasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const prefill = location.state as
    | { prefill?: string; versions?: RequestVersion[] }
    | undefined;

  const [step, setStep] = useState(prefill?.prefill ? 3 : 0);
  const [text, setText] = useState(prefill?.prefill ?? "");
  const [authorityId, setAuthorityId] = useState("");
  const [department, setDepartment] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [applied, setApplied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = text.length > 12 ? suggestAuthority(text) : null;
  const authority = DEMO_AUTHORITIES.find(
    (a) => a.id === (authorityId || suggested?.id),
  );
  const analysis = useMemo(
    () => (text.trim().length > 8 ? analyzeRequest(text) : null),
    [text],
  );

  const canNext =
    step === 0
      ? text.trim().length > 12
      : step === 1
        ? Boolean(authorityId || suggested)
        : true;

  function applyDoctor() {
    if (!analysis) return;
    setText(analysis.suggestedRewrite);
    setApplied(true);
  }

  async function handleCreate() {
    if (!session || !text.trim()) return;
    const targetId = authorityId || suggested?.id;
    if (!targetId) {
      setError("Select a public authority.");
      setStep(1);
      return;
    }
    const target = DEMO_AUTHORITIES.find((a) => a.id === targetId)!;
    setCreating(true);
    setError(null);

    const versions: RequestVersion[] =
      prefill?.versions ??
      (applied
        ? [
            { version: 1, label: "Citizen draft", text: prefill?.prefill ?? text, createdAt: new Date().toISOString(), source: "citizen" },
          ]
        : [
            { version: 1, label: "Citizen draft", text, createdAt: new Date().toISOString(), source: "citizen" },
          ]);
    if (applied)
      versions.push({
        version: versions.length + 1,
        label: "Application Doctor revision",
        text,
        createdAt: new Date().toISOString(),
        source: "doctor",
      });

    // The real backend drives the case through its state machine so the
    // signed certificate is genuine — but if it's unreachable (no local
    // API in a pure front-end demo) we still create the local trail.
    let backendId: string | null = null;
    try {
      const app = await api.applications.create({
        user_id: session.userId,
        authority_id: targetId,
        subject: heuristicSubject(text),
        original_request: text,
      });
      backendId = app.id;
      await api.applications.createEvent(app.id, "VALIDATED", session.userId);
      await api.applications.createEvent(app.id, "READY_TO_FILE", session.userId);
      await api.applications.createEvent(app.id, "SUBMITTED", session.userId);
    } catch (err) {
      if (!(err instanceof ApiError) && !(err instanceof TypeError)) {
        setCreating(false);
        setError("Could not create this request.");
        return;
      }
      // offline / no backend — continue with a local-only trail
    }

    const record = await createCase({
      subject: heuristicSubject(text),
      authorityName: target.name,
      department: department || target.department || target.name,
      citizenName: DEMO_CITIZEN.name,
      originalRequest: text,
      category: "General",
      backendId,
      responseDueAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      versions,
    });
    await submitCase(record.suchnaId);
    const fresh = getCase(record.suchnaId);
    if (fresh) syncOfflineRecord(fresh);
    navigate(`/app/cases/${record.suchnaId}`);
  }

  return (
    <PageContainer>
      <div className="max-w-3xl">
        <p className="eyebrow mb-1.5">New information request</p>
        <h1 className="page-title mb-4">Create an RTI</h1>

        {/* Stepper */}
        <ol className="flex items-center gap-2 mb-6 text-[12px]">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`grid place-items-center h-5 w-5 rounded-full text-[11px] font-semibold ${
                  i < step
                    ? "bg-success text-white"
                    : i === step
                      ? "bg-primary text-white"
                      : "bg-panel-3 text-ink-3"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={i === step ? "font-semibold text-ink" : "text-ink-3"}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <span className="w-6 h-px bg-line" />
              )}
            </li>
          ))}
        </ol>

        {error && (
          <div className="card border-danger-line bg-danger-wash p-3 text-[13px] text-danger mb-4">
            {error}
          </div>
        )}

        <div className="card p-5">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <label className="field-label">What information do you need?</label>
              <textarea
                className="field min-h-[120px] font-serif text-[14px] leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe the records you're asking for. Name the document, the office and the time period if you can."
              />
              <div>
                <p className="meta mb-1.5">Start from a template</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => {
                        setText(t.text);
                        setTimePeriod(t.period);
                      }}
                      className="btn btn-sm"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <label className="field-label">Which public authority?</label>
              {suggested && !authorityId && (
                <div className="inset p-2.5 text-[12.5px] text-ink-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    lightbulb
                  </span>
                  Suggested from your request:{" "}
                  <strong className="text-ink">{suggested.name}</strong>
                </div>
              )}
              <select
                className="field"
                value={authorityId || suggested?.id || ""}
                onChange={(e) => setAuthorityId(e.target.value)}
              >
                <option value="">Select an authority…</option>
                {DEMO_AUTHORITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.jurisdiction}
                  </option>
                ))}
              </select>
              <label className="field-label mt-1">Department (optional)</label>
              <input
                className="field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={authority?.department ?? "e.g. Public Works"}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <label className="field-label">Time period the records cover</label>
              <input
                className="field"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                placeholder="e.g. April 2025 – March 2026"
              />
              <p className="meta">
                A bounded time period is the single biggest reason requests get
                narrowed or rejected. Application Doctor will flag it if it's
                missing from the request text.
              </p>
            </div>
          )}

          {step === 3 && analysis && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="section-label">Application Doctor</h2>
                <span
                  className={`text-[20px] font-semibold tnum ${
                    analysis.clarity >= 75
                      ? "text-success"
                      : analysis.clarity >= 50
                        ? "text-warn"
                        : "text-danger"
                  }`}
                >
                  {Math.round((analysis.clarity + analysis.specificity) / 2)}
                  <span className="text-[12px] text-ink-3">/100</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Gauge label="Specificity" value={analysis.specificity} />
                <Gauge label="Clarity" value={analysis.clarity} />
                <Check
                  label="Time period"
                  ok={analysis.timePeriodPresent || Boolean(timePeriod)}
                  okText="Bounded"
                  badText="Missing"
                />
                <Check
                  label="Record-oriented"
                  ok={analysis.questionType !== "Reason-seeking (why/how)"}
                  okText="Yes"
                  badText="Asks for a reason"
                />
              </div>
              {analysis.issue && !applied && (
                <div className="card border-warn-line bg-warn-wash p-3 text-[12.5px] text-warn leading-snug">
                  {analysis.issue}
                </div>
              )}
              <div className="inset p-3">
                <p className="eyebrow mb-1.5">
                  {applied ? "Current request" : "Suggested revision"}
                </p>
                <p className="font-serif text-[13.5px] text-ink leading-relaxed">
                  {applied ? text : analysis.suggestedRewrite}
                </p>
              </div>
              {!applied && (
                <div className="flex gap-2">
                  <button onClick={applyDoctor} className="btn btn-sm btn-primary">
                    Apply revision
                  </button>
                  <button
                    onClick={() => setApplied(true)}
                    className="btn btn-sm"
                  >
                    Keep my wording
                  </button>
                </div>
              )}
              {applied && (
                <button
                  onClick={() => setStep(0)}
                  className="btn btn-sm self-start"
                >
                  Edit request text
                </button>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <h2 className="section-label">Confirm &amp; file</h2>
              <dl className="divide-y divide-line">
                <Review label="Citizen" value={DEMO_CITIZEN.name} />
                <Review label="Authority" value={authority?.name ?? "—"} />
                <Review
                  label="Department"
                  value={department || authority?.department || "—"}
                />
                <Review label="Time period" value={timePeriod || "Stated in text"} />
                <Review label="Doctor" value={applied ? "Revision applied" : "Original wording"} />
              </dl>
              <div className="inset p-3">
                <p className="eyebrow mb-1.5">Request</p>
                <p className="font-serif text-[13.5px] text-ink leading-relaxed">
                  {text}
                </p>
              </div>
              <p className="meta">
                Filing creates a Suchna ID, starts the 30-day Rights Clock and
                saves an offline copy of the trail to this browser.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn"
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="btn btn-primary"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn btn-primary"
            >
              {creating ? "Filing…" : "File RTI"}
            </button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function Gauge({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 75 ? "bg-success" : value >= 50 ? "bg-warn" : "bg-danger";
  return (
    <div className="inset p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] text-ink-3">{label}</span>
        <span className="text-[13px] font-semibold text-ink tnum">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-panel-3 mt-1.5 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Check({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div className="inset p-3">
      <span className="text-[12px] text-ink-3 block">{label}</span>
      <span
        className={`text-[13px] font-semibold flex items-center gap-1 mt-0.5 ${ok ? "text-success" : "text-danger"}`}
      >
        <span className="material-symbols-outlined text-[15px]">
          {ok ? "check_circle" : "cancel"}
        </span>
        {ok ? okText : badText}
      </span>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 text-[13px]">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-ink text-right">{value}</dd>
    </div>
  );
}
