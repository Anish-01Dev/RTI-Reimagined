import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getSession } from "@/lib/demoIdentity";
import { LanguageSwitch } from "@/components/LanguageSwitch";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/why-suchna", label: "Why Suchna" },
  { to: "/unkillable-rti", label: "Citizen trail" },
  { to: "/legal", label: "RTI reference" },
];

export function TopNav({ minimal = false }: { minimal?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = getSession();

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-line">
      <div className="max-w-container-max mx-auto px-6 h-topbar flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center h-6 w-6 rounded bg-primary text-white text-[13px] font-bold">
            सू
          </span>
          <span className="font-semibold text-[14.5px] tracking-tight">
            {t("appName")}
          </span>
        </Link>

        {!minimal && (
          <nav className="hidden md:flex items-center gap-6">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[12.5px] font-medium text-ink-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <LanguageSwitch compact />
          {session ? (
            <button
              onClick={() => navigate(session.role === "CITIZEN" ? "/app" : "/gov")}
              className="btn btn-sm btn-primary"
            >
              Open workspace
            </button>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
