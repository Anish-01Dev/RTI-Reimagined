import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-panel-2 mt-auto">
      <div className="max-w-container-max mx-auto px-6 py-8 flex flex-col md:flex-row justify-between gap-6">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="grid place-items-center h-5 w-5 rounded bg-primary text-white text-[11px] font-bold">
              सू
            </span>
            <span className="text-[13px] font-semibold tracking-tight">
              Suchna Rakshak
            </span>
          </div>
          <p className="text-[12px] text-ink-3 leading-snug">
            {t("footerTagline")}
          </p>
        </div>
        <nav className="flex gap-x-10 gap-y-2 flex-wrap text-[12.5px]">
          <Link to="/how-it-works" className="text-ink-3 hover:text-ink">
            How it works
          </Link>
          <Link to="/why-suchna" className="text-ink-3 hover:text-ink">
            Why Suchna Rakshak
          </Link>
          <Link to="/unkillable-rti" className="text-ink-3 hover:text-ink">
            The citizen trail
          </Link>
          <Link to="/legal" className="text-ink-3 hover:text-ink">
            RTI process reference
          </Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="max-w-container-max mx-auto px-6 py-3 text-[11px] text-ink-3">
          Built for citizens exercising the Right to Information Act, 2005.
          Independent of any government portal. Process guidance is not legal
          advice.
        </p>
      </div>
    </footer>
  );
}
