import type { ApplicationStatus } from "@/types";
import { statusToneClasses } from "@/lib/format";
import { statusKey, useI18n } from "@/lib/i18n";

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border font-status-label text-status-label uppercase tracking-wider ${statusToneClasses(status)}`}
    >
      {t(statusKey(status))}
    </span>
  );
}
