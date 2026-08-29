import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DEMO_CITIZEN,
  DEMO_OFFICIAL,
  DEMO_OTP,
  startCitizenSession,
  startGovSession,
} from "@/lib/demoIdentity";
import { loadDemoWorkspace } from "@/domain/seed";

type Gate = "choose" | "citizen-phone" | "citizen-otp" | "gov";

export function LoginPage() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<Gate>("choose");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState<null | "citizen" | "gov">(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  function handlePhoneSubmit(event: FormEvent) {
    event.preventDefault();
    if (phone.length !== 10) return;
    setGate("citizen-otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 0);
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  }

  function verifyCitizen() {
    if (otp.join("") !== DEMO_OTP) {
      setError(`Demo code is ${DEMO_OTP} — this is a walkthrough login, not a real OTP.`);
      return;
    }
    startCitizenSession();
    navigate("/app");
  }

  async function enterDemo(role: "citizen" | "gov") {
    setLoadingDemo(role);
    if (role === "citizen") startCitizenSession({ demo: true });
    else startGovSession({ demo: true });
    await loadDemoWorkspace();
    navigate(role === "citizen" ? "/app" : "/gov");
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="h-topbar border-b border-line flex items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid place-items-center h-6 w-6 rounded bg-primary text-white text-[13px] font-bold">
            सू
          </span>
          <span className="font-semibold text-[14.5px] tracking-tight">
            Suchna Rakshak
          </span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1fr_460px]">
        {/* Left: product context so the page isn't an empty white field */}
        <section className="hidden lg:flex flex-col justify-center px-14 border-r border-line bg-panel-2">
          <p className="eyebrow text-primary mb-3">
            One information journey, two sides of the desk
          </p>
          <h1 className="text-display leading-[1.1] max-w-[15ch] mb-4">
            Track the information, not just the application.
          </h1>
          <p className="text-[14px] text-ink-2 max-w-[46ch] leading-relaxed mb-8">
            Suchna Rakshak keeps every RTI as a citizen-owned, tamper-evident
            trail — question, evidence, deadlines, response and appeal — visible
            to the citizen who filed it and the officer who answers it.
          </p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-md">
            {[
              ["Ask", "Application Doctor checks the request before you file"],
              ["Track", "Every hop logged against the statutory clock"],
              ["Preserve", "A hash-chained record you can carry offline"],
              ["Act", "Missed deadlines become drafted appeals"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12.5px] font-semibold text-ink">{k}</dt>
                <dd className="text-[12px] text-ink-3 leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Right: auth */}
        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            {gate === "choose" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="card-title">Sign in</h2>
                  <p className="text-[13px] text-ink-3 mt-0.5">
                    Choose how you're using Suchna Rakshak.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setGate("citizen-phone")}
                    className="card card-hover text-left p-4 flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                      person
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-ink">
                        Citizen
                      </span>
                      <span className="block text-[12.5px] text-ink-3">
                        Create and protect your own information requests.
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-ink-3 ml-auto text-[18px]">
                      arrow_forward
                    </span>
                  </button>

                  <button
                    onClick={() => setGate("gov")}
                    className="card card-hover text-left p-4 flex items-start gap-3"
                  >
                    <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                      account_balance
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-ink">
                        Government / Public Authority
                      </span>
                      <span className="block text-[12.5px] text-ink-3">
                        Review, respond to and manage requests.
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-ink-3 ml-auto text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                </div>

                <div className="inset p-3">
                  <p className="text-[12px] font-semibold text-ink-2 mb-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                    Just presenting? Load a demo workspace
                  </p>
                  <p className="text-[11.5px] text-ink-3 mb-2.5 leading-snug">
                    Seeds five linked cases for one citizen — the same records on
                    both sides. A normal sign-in stays empty until you create a
                    request.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => enterDemo("citizen")}
                      disabled={loadingDemo !== null}
                      className="btn btn-sm"
                    >
                      {loadingDemo === "citizen" ? "Loading…" : "Citizen demo"}
                    </button>
                    <button
                      onClick={() => enterDemo("gov")}
                      disabled={loadingDemo !== null}
                      className="btn btn-sm"
                    >
                      {loadingDemo === "gov" ? "Loading…" : "Government demo"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {gate === "citizen-phone" && (
              <div className="flex flex-col gap-4">
                <BackButton onClick={() => setGate("choose")} />
                <div>
                  <h2 className="card-title">Secure access to your cases</h2>
                  <p className="text-[13px] text-ink-3 mt-0.5">
                    Enter your phone number to continue.{" "}
                    <span lang="hi">अपना मोबाइल नंबर दर्ज करें।</span>
                  </p>
                </div>
                <form className="flex flex-col gap-3" onSubmit={handlePhoneSubmit}>
                  <div>
                    <label className="field-label" htmlFor="phone">
                      Mobile number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-line-2 bg-panel-2 text-[13px] text-ink-2">
                        +91
                      </span>
                      <input
                        id="phone"
                        inputMode="numeric"
                        placeholder="98765 43210"
                        className="field rounded-l-none"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                      />
                    </div>
                    <p className="meta mt-1">
                      Demo login — no OTP is sent. Try {DEMO_CITIZEN.phone}.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={phone.length !== 10}
                    className="btn btn-primary w-full"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {gate === "citizen-otp" && (
              <div className="flex flex-col gap-4">
                <BackButton onClick={() => setGate("citizen-phone")} />
                <div>
                  <h2 className="card-title">Verify your number</h2>
                  <p className="text-[13px] text-ink-3 mt-0.5">
                    Enter the 6-digit code for{" "}
                    <span className="font-medium text-ink-2">+91 {phone}</span>.
                  </p>
                </div>
                <div className="flex gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      className="w-full h-12 text-center text-[18px] font-semibold rounded-md border border-line-2 bg-panel outline-none focus:border-primary focus:ring-2 focus:ring-primary-wash"
                      maxLength={1}
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>
                {error && <p className="text-[12.5px] text-danger">{error}</p>}
                <button
                  onClick={verifyCitizen}
                  className="btn btn-primary w-full"
                >
                  Verify &amp; continue
                </button>
                <p className="meta text-center">Demo code: {DEMO_OTP}</p>
              </div>
            )}

            {gate === "gov" && (
              <div className="flex flex-col gap-4">
                <BackButton onClick={() => setGate("choose")} />
                <div>
                  <h2 className="card-title">Official sign-in</h2>
                  <p className="text-[13px] text-ink-3 mt-0.5">
                    Demo credential — no production identity infrastructure is
                    wired for this build.
                  </p>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-wash text-primary-strong grid place-items-center text-[15px] font-semibold shrink-0">
                    {DEMO_OFFICIAL.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink truncate">
                      {DEMO_OFFICIAL.name}
                    </p>
                    <p className="text-[12px] text-ink-3 truncate">
                      {DEMO_OFFICIAL.title} · {DEMO_OFFICIAL.authority}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    startGovSession();
                    navigate("/gov");
                  }}
                  className="btn btn-primary w-full"
                >
                  Continue as {DEMO_OFFICIAL.name.split(" ")[0]}
                </button>
                <p className="meta">
                  A fresh official account has an empty queue. Use the government
                  demo from the previous screen to load live cases.
                </p>
              </div>
            )}

            <p className="meta text-center mt-6 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Your case data stays in this browser.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-start text-[12.5px] text-ink-3 hover:text-ink flex items-center gap-1"
    >
      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
      Back
    </button>
  );
}
