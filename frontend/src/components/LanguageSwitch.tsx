import { useI18n } from "@/lib/i18n";

/** The bilingual toggle — deliberately a labeled two-way switch, not a
 * single icon button, so "change language" reads as its own feature
 * rather than a settings afterthought. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex items-center gap-xs">
      {!compact && (
        <span className="hidden sm:inline font-label-caps text-label-caps text-on-surface-variant">
          {t("langSwitchLabel")}
        </span>
      )}
      <div className="inline-flex rounded-full border border-outline-variant bg-surface-container-low p-[2px]">
        <button
          onClick={() => setLang("en")}
          className={`px-2.5 py-1 rounded-full font-status-label text-status-label transition-colors ${
            lang === "en"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang("hi")}
          lang="hi"
          className={`px-2.5 py-1 rounded-full font-status-label text-status-label transition-colors ${
            lang === "hi"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
}
