import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full py-xl px-lg max-w-container-max mx-auto gap-md">
        <div className="font-label-caps text-label-caps font-bold uppercase tracking-widest flex items-center gap-2 text-secondary">
          <span className="material-symbols-outlined text-base">policy</span>
          <span>{t("footerTagline")}</span>
        </div>
        <nav className="flex gap-lg flex-wrap justify-center">
          <a
            className="text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Accessibility
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors"
            href="#"
          >
            Contact Us
          </a>
        </nav>
      </div>
    </footer>
  );
}
