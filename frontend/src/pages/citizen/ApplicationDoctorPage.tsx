import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { PageHeader } from "@/components/ui/Primitives";
import {
  analyzeRequest,
  DOCTOR_EXAMPLE,
} from "@/lib/applicationDoctor";
import type { RequestVersion } from "@/domain/types";

const WHY_BETTER = [
  "Names concrete records instead of asking for a reason",
  "Bounds the request with a time period",
  "Reduces ambiguity about what is being requested",
  "A PIO can act on it directly, without seeking clarification",
];

export function ApplicationDoctorPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [ran, setRan] = useState(false);
  const analysis = useMemo(
    () => (ran && text.trim().length >= 8 ? analyzeRequest(text) : null),
    [ran, text],
  );

  function versionsFor(): RequestVersion[] {
    const now = new Date().toISOString();
    return [
      { version: 1, label: "Citizen draft", text, createdAt: now, source: "citizen" },
      {
        version: 2,
        label: "Application Doctor revision",
        text: analysis?.suggestedRewrite ?? text,
        createdAt: now,
        source: "doctor",
      },
    ];
  }

  const overall = analysis
    ? Math.round((analysis.clarity + analysis.specificity) / 2)
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Application Doctor"
        eyebrow="Request analysis"
        subtitle="A deterministic quality check — same input, same result, no external AI call. Run a draft here, or use it inline while creating an RTI."
        actions={
          <button onClick={() => navigate("/app/create")} className="btn btn-primary">
            Start an RTI
          </button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div className="card p-4 flex flex-col gap-3">
          <label className="field-label">Your RTI question</label>
          <textarea
            className="field min-h-[160px] font-serif text-[14px] leading-relaxed"
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
              Analyse
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

        <div className="min-w-0">
          {!analysis ? (
            <div className="card py-16 text-center text-[13px] text-ink-3">
              Analysis appears here.
            </div>
          ) : (
            <div className="card p-4 flex flex-col gap-4 fade-in">
              <div className="flex items-center justify-between">
                <h2 className="section-label">Request quality</h2>
                <span
                  className={`text-[24px] font-semibold tnum ${
                    overall >= 75 ? "text-success" : overall >= 50 ? "text-warn" : "text-danger"
                  }`}
                >
                  {overall}
                  <span className="text-[13px] text-ink-3">/100</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Bar label="Specificity" value={analysis.specificity} />
                <Bar label="Clarity" value={analysis.clarity} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Flag
                  label="Time period"
                  ok={analysis.timePeriodPresent}
                  ok_="Present"
                  bad="Missing"
                />
                <Flag
                  label="Record-oriented"
                  ok={analysis.questionType !== "Reason-seeking (why/how)"}
                  ok_="Yes"
                  bad="Asks for a reason"
                />
                <Flag
                  label="Authority"
                  ok={analysis.authorityConfidence === "Likely correct"}
                  ok_="Likely correct"
                  bad="Verify jurisdiction"
                />
                <div className="inset p-3">
                  <span className="text-[12px] text-ink-3 block">Question type</span>
                  <span className="text-[13px] font-semibold text-ink mt-0.5 block">
                    {analysis.questionType}
                  </span>
                </div>
              </div>

              {analysis.issue && (
                <div className="card border-warn-line bg-warn-wash p-3 text-[12.5px] text-warn leading-snug">
                  {analysis.issue}
                </div>
              )}

              <div className="inset p-3">
                <p className="eyebrow mb-1.5">Suggested revision</p>
                <p className="font-serif text-[13.5px] text-ink leading-relaxed">
                  {analysis.suggestedRewrite}
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {WHY_BETTER.map((r) => (
                    <li key={r} className="text-[12px] text-ink-3 flex gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-success">
                        check
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() =>
                  navigate("/app/create", {
                    state: { prefill: analysis.suggestedRewrite, versions: versionsFor() },
                  })
                }
                className="btn btn-primary w-full"
              >
                Use this revision in a new RTI
              </button>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-success" : value >= 50 ? "bg-warn" : "bg-danger";
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

function Flag({
  label,
  ok,
  ok_,
  bad,
}: {
  label: string;
  ok: boolean;
  ok_: string;
  bad: string;
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
        {ok ? ok_ : bad}
      </span>
    </div>
  );
}
