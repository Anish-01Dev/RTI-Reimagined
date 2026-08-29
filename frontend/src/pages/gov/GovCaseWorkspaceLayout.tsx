import { useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { GovCaseHeader } from "@/components/gov/GovCaseHeader";
import { addAudit, getCase } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { getSession } from "@/lib/demoIdentity";

const TABS = [
  { to: ".", label: "Overview", end: true },
  { to: "response", label: "Workflow" },
  { to: "documents", label: "Documents" },
  { to: "timeline", label: "Timeline" },
  { to: "legal", label: "Compliance" },
  { to: "audit", label: "Audit" },
];

export function GovCaseWorkspaceLayout() {
  const { id } = useParams<{ id: string }>();
  const record = useStore(() => (id ? getCase(id) : undefined));

  // Opening a case is itself an audited action.
  useEffect(() => {
    const s = getSession();
    if (record && s) addAudit(record.suchnaId, s.name, "Opened case");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (record === undefined) {
    return (
      <div className="max-w-workspace mx-auto px-6 py-16 text-center">
        <p className="text-[15px] font-semibold text-gov-ink mb-1">
          No case found
        </p>
        <Link to="/gov/cases" className="text-blue-400 text-[13px] hover:underline">
          Back to Case Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <GovCaseHeader record={record} tabs={TABS} />
      <div className="max-w-workspace mx-auto w-full px-4 md:px-6 py-6">
        <Outlet context={record} />
      </div>
    </div>
  );
}
