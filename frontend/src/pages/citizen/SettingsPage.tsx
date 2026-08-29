import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { PageHeader } from "@/components/ui/Primitives";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { clearWorkspace } from "@/domain/store";
import { citizenCases } from "@/domain/selectors";
import { loadDemoWorkspace } from "@/domain/seed";
import { hasDemoWorkspace } from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { endSession, getSession } from "@/lib/demoIdentity";
import { listOfflineRecords, useOnline } from "@/offline/citizenRecord";

export function SettingsPage() {
  const navigate = useNavigate();
  const session = getSession();
  const cases = useStore(citizenCases);
  const online = useOnline();
  const offlineCount = listOfflineRecords().length;
  const demo = hasDemoWorkspace();

  return (
    <PageContainer>
      <div className="max-w-reading flex flex-col gap-4">
        <PageHeader title="Settings" eyebrow="Workspace" />

        <Section title="Account">
          <Row label="Signed in as" value={session?.name ?? "—"} />
          <Row label="Role" value={session?.role === "CITIZEN" ? "Citizen" : "Official"} />
          <Row
            label="Session type"
            value={session?.demo ? "Demo workspace" : "Standard"}
          />
        </Section>

        <Section title="Language">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-2">Interface language</span>
            <LanguageSwitch compact />
          </div>
        </Section>

        <Section title="Offline records">
          <Row
            label="Connection"
            value={online ? "Online" : "Offline"}
          />
          <Row
            label="Cases with an offline copy"
            value={`${offlineCount} of ${cases.length}`}
          />
          <p className="meta">
            The citizen-held trail for every case you open is saved to this
            browser so it can be verified without a network.
          </p>
        </Section>

        <Section title="Demo data">
          <p className="text-[12.5px] text-ink-2 leading-relaxed mb-2.5">
            {demo
              ? "This browser currently holds the seeded demo workspace — five linked cases for Priya Sharma."
              : "No demo data is loaded. A standard sign-in stays empty until you create a request."}
          </p>
          <div className="flex gap-2 flex-wrap">
            {!demo && (
              <button
                onClick={async () => {
                  await loadDemoWorkspace();
                  navigate("/app");
                }}
                className="btn btn-sm"
              >
                Load demo workspace
              </button>
            )}
            <button
              onClick={() => {
                clearWorkspace();
                endSession();
                navigate("/login");
              }}
              className="btn btn-sm btn-danger"
            >
              Clear all workspace data
            </button>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <h2 className="section-label mb-3">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-ink-3">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
