import { Link } from "react-router-dom";
import { PageContainer } from "@/components/app/Shell";
import { EmptyState, PageHeader } from "@/components/ui/Primitives";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/domain/store";
import { useStore } from "@/hooks/useStore";
import { formatDateTime } from "@/lib/format";

export function NotificationsPage() {
  const items = useStore(listNotifications);
  const unread = items.filter((n) => !n.read).length;

  if (items.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Notifications" eyebrow="Alerts" />
        <EmptyState icon="notifications" title="Nothing yet">
          Deadline warnings, new responses and appeal-readiness alerts land here
          as your cases progress.
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-reading">
        <PageHeader
          title="Notifications"
          eyebrow="Alerts"
          subtitle={`${unread} unread`}
          actions={
            unread > 0 ? (
              <button onClick={markAllNotificationsRead} className="btn btn-sm">
                Mark all read
              </button>
            ) : undefined
          }
        />
        <div className="card divide-y divide-line">
          {items.map((n) => (
            <Link
              key={n.id}
              to={`/app/cases/${n.caseId}`}
              onClick={() => markNotificationRead(n.id)}
              className={`flex items-start gap-3 p-3.5 hover:bg-panel-2 ${
                !n.read ? "bg-primary-wash/40" : ""
              }`}
            >
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`}
              />
              <div className="min-w-0">
                <p className="text-[13px] text-ink leading-snug">{n.message}</p>
                <p className="meta mt-1">
                  <span className="mono">{n.caseId}</span> ·{" "}
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
