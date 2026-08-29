import { Shell, type NavItem } from "@/components/app/Shell";
import { useStore } from "@/hooks/useStore";
import { getAllCases } from "@/domain/store";
import { bucket } from "@/domain/selectors";
import { getSession } from "@/lib/demoIdentity";

/** A dark operations console — a different product space, not the citizen
 * dashboard with an "Admin" label. Nav vocabulary, chrome and density are
 * built for an officer's workload. */
export function GovShell() {
  const session = getSession();
  const { overdue, dueSoon, appeals } = useStore(() => bucket(getAllCases()));
  const awaitingReview = useStore(
    () =>
      getAllCases().filter(
        (c) => c.govStage === "UNDER_REVIEW" || c.govStage === "INFO_LOCATED",
      ).length,
  );

  const nav: NavItem[] = [
    { to: "/gov", label: "Operations", icon: "space_dashboard", end: true },
    { to: "/gov/cases", label: "Case Queue", icon: "list_alt" },
    {
      to: "/gov/response",
      label: "Response Review",
      icon: "rate_review",
      badge: awaitingReview,
      badgeTone: "neutral",
    },
    {
      to: "/gov/deadlines",
      label: "Deadlines",
      icon: "timer",
      badge: overdue.length + dueSoon.length,
      badgeTone: overdue.length > 0 ? "danger" : "warn",
    },
    { to: "/gov/authorities", label: "Authorities", icon: "account_balance" },
    { to: "/gov/analytics", label: "Analytics", icon: "monitoring" },
    { to: "/gov/coverage", label: "Coverage", icon: "public" },
    {
      to: "/gov/appeals",
      label: "Appeals",
      icon: "gavel",
      badge: appeals.length,
      badgeTone: "warn",
    },
    { to: "/gov/audit", label: "Audit", icon: "history" },
  ];

  const footerNav: NavItem[] = [
    { to: "/gov/help", label: "Help", icon: "help" },
  ];

  return (
    <Shell
      variant="gov"
      brand="Suchna Rakshak"
      nav={nav}
      footerNav={footerNav}
      searchPlaceholder="Search cases, authorities, Suchna ID…"
      searchBase="/gov/cases"
      contextLabel={session?.authority}
    />
  );
}
