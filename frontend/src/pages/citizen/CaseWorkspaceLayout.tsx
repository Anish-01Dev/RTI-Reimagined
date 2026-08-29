import { useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { CaseHeader } from "@/components/case/CaseHeader";
import { getCase } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { syncOfflineRecord } from "@/offline/citizenRecord";

const TABS = [
  { to: ".", label: "Overview", end: true },
  { to: "timeline", label: "Timeline" },
  { to: "evidence", label: "Documents" },
  { to: "trail", label: "Citizen Trail" },
  { to: "legal", label: "Legal & Appeals" },
  { to: "activity", label: "Activity" },
];

export function CaseWorkspaceLayout() {
  const { id } = useParams<{ id: string }>();
  const record = useStore(() => (id ? getCase(id) : undefined));

  // Keep the offline copy of this case fresh whenever the citizen looks at it.
  useEffect(() => {
    if (record) syncOfflineRecord(record);
  }, [record]);

  if (record === undefined) {
    return (
      <div className="max-w-workspace mx-auto px-6 py-16 text-center">
        <p className="card-title mb-1">No case found</p>
        <p className="text-[13px] text-ink-3 mb-4">
          There's no trail for this Suchna ID in this workspace.
        </p>
        <Link to="/app/cases" className="btn btn-primary">
          Back to My RTIs
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <CaseHeader record={record} tabs={TABS} />
      <div className="max-w-workspace mx-auto w-full px-4 md:px-6 py-6">
        <Outlet context={record} />
      </div>
    </div>
  );
}
