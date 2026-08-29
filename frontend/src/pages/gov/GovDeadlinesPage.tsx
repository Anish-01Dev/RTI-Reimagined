import { GovCaseTable, GovMetrics, GovPage, GovSection } from "@/components/gov/GovUI";
import { getAllCases } from "@/domain/store";
import { bucket } from "@/domain/selectors";
import { daysRemainingFor } from "@/domain/actionEngine";
import { useStore } from "@/hooks/useStore";

export function GovDeadlinesPage() {
  const cases = useStore(getAllCases);
  const b = bucket(cases);

  const withClock = cases
    .filter((c) => c.responseDueAt && c.status !== "CLOSED" && c.status !== "RESPONSE_RELEASED")
    .sort((a, c) => (daysRemainingFor(a) ?? 9999) - (daysRemainingFor(c) ?? 9999));

  const overdue = withClock.filter((c) => (daysRemainingFor(c) ?? 0) < 0);
  const thisWeek = withClock.filter((c) => {
    const r = daysRemainingFor(c);
    return r !== null && r >= 0 && r <= 5;
  });
  const later = withClock.filter((c) => (daysRemainingFor(c) ?? 0) > 5);

  return (
    <GovPage
      title="Deadlines"
      eyebrow="Statutory clock"
      subtitle="Section 7(1) response windows across every open request, most urgent first."
    >
      <GovMetrics
        items={[
          { label: "Overdue", value: overdue.length, tone: overdue.length ? "danger" : undefined },
          { label: "Due within 5 days", value: thisWeek.length, tone: thisWeek.length ? "warn" : undefined },
          { label: "Later", value: later.length },
          { label: "Appeals pending", value: b.appeals.length, tone: b.appeals.length ? "warn" : undefined },
        ]}
      />

      <div className="flex flex-col gap-6 mt-6">
        <GovSection title="Overdue — appeal eligible">
          <GovCaseTable
            cases={overdue}
            columns={["id", "subject", "authority", "department", "deadline", "activity"]}
            empty="No overdue requests."
          />
        </GovSection>
        <GovSection title="Due this week">
          <GovCaseTable
            cases={thisWeek}
            columns={["id", "subject", "department", "stage", "deadline"]}
            empty="Nothing due within five days."
          />
        </GovSection>
        <GovSection title="Later">
          <GovCaseTable
            cases={later}
            columns={["id", "subject", "department", "stage", "deadline"]}
            empty="No further requests on the clock."
          />
        </GovSection>
      </div>
    </GovPage>
  );
}
