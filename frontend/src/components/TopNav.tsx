import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { endSession, getSession } from "@/lib/demoIdentity";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export function TopNav({ minimal = false }: { minimal?: boolean }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = getSession();

  if (minimal) {
    return (
      <header className="bg-surface border-b border-outline-variant shadow-sm w-full py-4 px-lg md:px-3xl flex justify-between items-center h-16 shrink-0">
        <Link
          to="/"
          className="font-headline-md text-headline-md font-bold text-primary"
        >
          {t("appName")}
        </Link>
        <LanguageSwitch compact />
      </header>
    );
  }

  return (
    <header className="bg-surface docked full-width top-0 sticky z-50 border-b border-outline-variant shadow-sm">
      <div className="flex justify-between items-center w-full px-lg md:px-3xl max-w-container-max mx-auto h-16">
        <Link
          to="/"
          className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-sm"
        >
          {t("appName")}
        </Link>
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/how-it-works"
            className="text-on-surface-variant text-[11px] font-medium hover:text-primary transition-colors"
          >
            {t("navHowItWorks")}
          </Link>
          {session ? (
            <>
              <Link
                to="/app"
                className="text-on-surface-variant text-[11px] font-medium hover:text-primary transition-colors"
              >
                {t("navDashboard")}
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="text-on-surface-variant text-[11px] font-medium hover:text-primary transition-colors"
            >
              {t("navLogin")}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch compact />
          <button
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          {session ? (
            <button
              onClick={() => {
                endSession();
                navigate("/");
              }}
              className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-status-label font-semibold border border-outline-variant"
              title={`${session.name} — ${t("navLogout")}`}
            >
              {session.name.charAt(0)}
            </button>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-status-label text-status-label font-medium hover:bg-primary/90 transition-colors"
            >
              {t("navLogin")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}