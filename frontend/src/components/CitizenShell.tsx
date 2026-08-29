import { Shell, type NavItem } from "@/components/app/Shell";
import { useStore } from "@/hooks/useStore";
import { bucket, citizenCases } from "@/domain/selectors";

export function CitizenShell() {
  const { dueSoon, overdue, appeals } = useStore(() => bucket(citizenCases()));
  const deadlineCount = dueSoon.length + overdue.length;

  const nav: NavItem[] = [
    { to: "/app", label: "Overview", icon: "dashboard", end: true },
    { to: "/app/cases", label: "My RTIs", icon: "folder_open" },
    { to: "/app/create", label: "Create RTI", icon: "add" },
    { to: "/app/doctor", label: "Application Doctor", icon: "stethoscope" },
    {
      to: "/app/deadlines",
      label: "Deadlines",
      icon: "schedule",
      badge: deadlineCount,
      badgeTone: overdue.length > 0 ? "danger" : "warn",
    },
    { to: "/app/trails", label: "Information Trails", icon: "verified_user" },
    { to: "/app/documents", label: "Documents", icon: "description" },
    {
      to: "/app/legal",
      label: "Appeals & Legal",
      icon: "gavel",
      badge: appeals.length,
      badgeTone: "warn",
    },
  ];

  const footerNav: NavItem[] = [
    { to: "/app/help", label: "Help", icon: "help" },
    { to: "/app/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <Shell
      variant="citizen"
      brand="Suchna Rakshak"
      nav={nav}
      footerNav={footerNav}
      searchPlaceholder="Search your requests…"
      searchBase="/app/cases"
    />
  );
}
