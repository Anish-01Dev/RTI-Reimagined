import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { PageHeader } from "@/components/ui/Primitives";
import { CaseStatusPill } from "@/components/case/CaseStatusPill";
import { addEvent, addVersion, getAllCases, getCase, submitCase } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { DEMO_CITIZEN } from "@/lib/demoIdentity";
import {
  diagnoseRequest,
  SEVERITY_META,
  type Diagnostic,
  type DiagnosticReport,
} from "@/lib/requestDiagnostics";
import { DOCTOR_EXAMPLE } from "@/lib/applicationDoctor";
import { formatDate } from "@/lib/format";
import type { CaseRecord } from "@/domain/types";

const ASSESSMENT_TONE: Record<string, { text: string; border: string; bar: string }> = {
  "Ready to file": { text: "text-success", border: "border-l-success", bar: "bg-success" },
  "File with caution": { text: "text-warn", border: "border-l-warn", bar: "bg-warn" },
  "Revise before filing": { text: "text-danger", border: "border-l-danger", bar: "bg-danger" },
};

function findDraftCase(): CaseRecord | undefined {
  return getAllCases().find(
    (c) => c.citizenName === DEMO_CITIZEN.name && c.status === "DRAFT",
  );
}

export function ApplicationDoctorPage() {
  const draftId = useStore(useCallback(() => findDraftCase()?.suchnaId, []));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Pre-filing diagnostic"
        title="Application Doctor"
        subtitle="Every draft is run against the disclosure tests a Public Information Officer applies — completeness, scope, routing and legal exposure. Deterministic and inspectable: the same draft always produces the same report."
      />
      {draftId ? (
        <CaseDoctor suchnaId={draftId} />
      ) : (
        <DraftDoctor />
      )}
    </PageContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Case mode — diagnose a real unfiled draft and act on the findings */
/* ------------------------------------------------------------------ */

function CaseDoctor({ suchnaId }: { suchnaId: string }) {
  const navigate = useNavigate();
  const record = useStore(useCallback(() => getCase(suchnaId), [suchnaId]));
  const [busy, setBusy] = useState(false);

  const report = useMemo(
    () =>
      record
        ? diagnoseRequest({ text: record.originalRequest, authorityKnown: true })
        : null,
    [record],
  );

  if (!record || !report) return null;

  const revised = record.versions.some((v) => v.source === "doctor");

  async function applyRevision() {
    if (!record || !report || busy) return;
    setBusy(true);
    await addVersion(suchnaId, {
      label: "Application Doctor revision",
      text: report.suggestedRewrite,
      createdAt: new Date().toISOString(),
      source: "doctor",
    });
    await addEvent(
      suchnaId,
      "REQUEST_REVISED",
      "Request reframed to name specific records and bound the time period",
      "Application Doctor",
    );
    setBusy(false);
  }

  async function fileNow() {
    if (busy) return;
    setBusy(true);
    await submitCase(suchnaId);
    navigate(`/app/cases/${suchnaId}`);
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
      {/* Context rail */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CaseStatusPill status={record.status} />
          <span className="mono text-ink-3">{record.suchnaId}</span>
        </div>
        <h2 className="text-[15px] font-semibold text-ink leading-snug">
          {record.subject}
        </h2>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 py-1 border-y border-line">
          <Field label="Applicant">{record.citizenName}</Field>
          <Field label="Created">{formatDate(record.createdAt)}</Field>
          <Field label="Target authority">{record.authorityName}</Field>
          <Field label="Stage">Draft — not filed</Field>
        </dl>

        <div>
          <p className="eyebrow mb-1.5">
            {revised ? "Request (revision 2)" : "Draft request"}
          </p>
          <p className="inset p-3 font-serif text-[13.5px] text-ink leading-relaxed">
            {record.originalRequest}
          </p>
          {revised && (
            <p className="meta mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-primary">
                auto_fix_high
              </span>
              Reframed by Application Doctor · original kept in version history
            </p>
          )}
        </div>
      </div>

      {/* Report */}
      <DiagnosticPanel
        report={report}
        busy={busy}
        revised={revised}
        onApply={applyRevision}
        footer={
          report.critical === 0 && report.warnings <= 1 ? (
            <div className="card border-success-line bg-success-wash p-4 flex flex-wrap items-center gap-3 fade-in">
              <span className="material-symbols-outlined text-[22px] text-success">
                verified
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">
                  This request is ready to file.
                </p>
                <p className="meta">
                  Filing creates a Suchna ID and starts the 30-day response
                  clock under Section 7(1).
                </p>
              </div>
              <button
                onClick={fileNow}
                disabled={busy}
                className="btn btn-primary"
              >
                File this RTI now
              </button>
            </div>
          ) : null
        }
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wide text-ink-3 font-semibold">
        {label}
      </dt>
      <dd className="text-[12.5px] text-ink mt-0.5">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draft mode — check an arbitrary draft, then carry it into filing  */
/* ------------------------------------------------------------------ */

function DraftDoctor() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [ran, setRan] = useState(false);

  const report = useMemo(
    () => (ran && text.trim().length >= 8 ? diagnoseRequest({ text }) : null),
    [ran, text],
  );

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
      <div className="card p-4 flex flex-col gap-3">
        <label className="field-label">Draft request</label>
        <textarea
          className="field min-h-[150px] font-serif text-[14px] leading-relaxed"
          placeholder={DOCTOR_EXAMPLE}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setRan(false);
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRan(true)}
            disabled={text.trim().length < 8}
            className="btn btn-primary"
          >
            Run diagnostic
          </button>
          <button
            onClick={() => {
              setText(DOCTOR_EXAMPLE);
              setRan(true);
            }}
            className="btn"
          >
            Use the example
          </button>
        </div>
      </div>

      {report ? (
        <DiagnosticPanel
          report={report}
          busy={false}
          revised={text === report.suggestedRewrite}
          onApply={() => {
            setText(report.suggestedRewrite);
            setRan(true);
          }}
          footer={
            report.critical === 0 && report.warnings <= 1 ? (
              <div className="card border-success-line bg-success-wash p-4 flex flex-wrap items-center gap-3 fade-in">
                <span className="material-symbols-outlined text-[22px] text-success">
                  verified
                </span>
                <p className="text-[13.5px] font-semibold text-ink flex-1 min-w-0">
                  This request is ready to file.
                </p>
                <button
                  onClick={() =>
                    navigate("/app/create", { state: { prefill: text } })
                  }
                  className="btn btn-primary"
                >
                  Continue to filing
                </button>
              </div>
            ) : null
          }
        />
      ) : (
        <div className="card py-20 text-center text-[13px] text-ink-3">
          The diagnostic report appears here.
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared report panel                                               */
/* ------------------------------------------------------------------ */

function DiagnosticPanel({
  report,
  busy,
  revised,
  onApply,
  footer,
}: {
  report: DiagnosticReport;
  busy: boolean;
  revised: boolean;
  onApply: () => void;
  footer: React.ReactNode;
}) {
  const tone = ASSESSMENT_TONE[report.assessment];
  const critical = report.checks.filter((c) => c.severity === "critical");
  const warnings = report.checks.filter((c) => c.severity === "warning");
  const passed = report.checks.filter((c) => c.severity === "pass");
  const showApply =
    report.autoResolvable && (report.critical > 0 || report.warnings > 0) && !revised;

  return (
    <div className="flex flex-col gap-4 fade-in">
      {/* Assessment banner */}
      <div className={`card p-4 border-l-2 ${tone.border}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow mb-1">Overall assessment</p>
            <p className={`text-[19px] font-semibold ${tone.text}`}>
              {report.assessment}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-semibold tnum leading-none text-ink">
              {report.score}
              <span className="text-[14px] text-ink-3">/100</span>
            </p>
            <p className="meta mt-1">request quality</p>
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-panel-3 mt-3 overflow-hidden">
          <div
            className={`h-full ${tone.bar} transition-all duration-500`}
            style={{ width: `${report.score}%` }}
          />
        </div>

        <div className="flex items-center gap-4 mt-3 text-[12px]">
          <Count n={report.total} label="checks" dot="bg-ink-3" />
          <Count n={report.passed} label="passed" dot="bg-success" />
          <Count n={report.warnings} label="to review" dot="bg-warn" />
          <Count n={report.critical} label="critical" dot="bg-danger" />
        </div>
      </div>

      {/* Auto-resolve action */}
      {showApply && (
        <div className="card border-primary-line bg-primary-wash/50 p-3.5 flex flex-wrap items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-primary">
            auto_fix_high
          </span>
          <p className="text-[12.5px] text-ink-2 flex-1 min-w-0 leading-snug">
            The Doctor can rewrite this to name specific records and bound the
            time period — clearing the findings below.
          </p>
          <button
            onClick={onApply}
            disabled={busy}
            className="btn btn-sm btn-primary"
          >
            {busy ? "Applying…" : "Apply the Doctor's revision"}
          </button>
        </div>
      )}

      {/* Findings */}
      {critical.length > 0 && (
        <FindingGroup title="Critical — likely to be refused" items={critical} />
      )}
      {warnings.length > 0 && (
        <FindingGroup title="Review before filing" items={warnings} />
      )}

      {passed.length > 0 && (
        <div className="card p-4">
          <h3 className="section-label mb-2.5">
            Passed · {passed.length} of {report.total}
          </h3>
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
            {passed.map((c) => (
              <li key={c.id} className="flex items-start gap-2 row-flash">
                <span className="material-symbols-outlined text-[16px] text-success shrink-0 translate-y-0.5">
                  check_circle
                </span>
                <span className="text-[12.5px] text-ink-2 leading-snug">
                  {c.title}
                  <span className="block text-[11px] text-ink-3">
                    {c.category}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer}
    </div>
  );
}

function Count({ n, label, dot }: { n: number; label: string; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-3">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="tnum font-semibold text-ink">{n}</span> {label}
    </span>
  );
}

function FindingGroup({ title, items }: { title: string; items: Diagnostic[] }) {
  return (
    <section className="card overflow-hidden">
      <h3 className="section-label px-4 py-2.5 border-b border-line bg-panel-2">
        {title}
      </h3>
      <ul className="divide-y divide-line">
        {items.map((c) => {
          const meta = SEVERITY_META[c.severity];
          return (
            <li key={c.id} className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`chip ${meta.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="eyebrow">{c.category}</span>
              </div>
              <p className="text-[13.5px] font-semibold text-ink">{c.title}</p>
              <p className="text-[12.5px] text-ink-2 leading-snug mt-1">
                {c.detail}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2.5">
                <span className="text-[11.5px] text-ink-3">
                  Affects:{" "}
                  <span className="text-ink-2 font-medium">{c.affected}</span>
                </span>
                {c.recommendation && (
                  <span className="text-[11.5px] text-ink-3 flex items-start gap-1.5 max-w-[46ch]">
                    <span className="material-symbols-outlined text-[14px] text-primary shrink-0">
                      tips_and_updates
                    </span>
                    <span className="text-ink-2">{c.recommendation}</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
