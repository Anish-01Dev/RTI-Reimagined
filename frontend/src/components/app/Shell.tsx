import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearWorkspace,
  listNotifications,
  markNotificationRead,
  subscribe,
  unreadCount,
} from "@/domain/store";
import { endSession, getSession } from "@/lib/demoIdentity";
import type { Notification } from "@/domain/types";
import { formatDateTime } from "@/lib/format";
import { GlobalSearch } from "@/components/app/GlobalSearch";

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  badge?: number;
  badgeTone?: "danger" | "warn" | "neutral";
}

interface ShellProps {
  variant: "citizen" | "gov";
  brand: string;
  nav: NavItem[];
  footerNav: NavItem[];
  searchPlaceholder: string;
  searchBase: string;
  contextLabel?: string;
}

export function Shell({
  variant,
  brand,
  nav,
  footerNav,
  searchPlaceholder,
  searchBase,
  contextLabel,
}: ShellProps) {
  const dark = variant === "gov";
  const session = getSession();
  const navigate = useNavigate();

  if (!session) return null;

  const shell = dark
    ? "bg-gov-bg text-gov-ink"
    : "bg-canvas text-ink";
  const aside = dark
    ? "bg-gov-panel border-gov-line"
    : "bg-panel border-line";
  const header = dark
    ? "bg-gov-bg/80 border-gov-line"
    : "bg-canvas/80 border-line";

  return (
    <div className={`min-h-screen flex ${shell}`}>
      <aside
        className={`w-sidebar shrink-0 border-r ${aside} flex flex-col fixed inset-y-0 left-0 z-30`}
      >
        <div
          className={`h-topbar flex items-center gap-2 px-4 border-b ${dark ? "border-gov-line" : "border-line"}`}
        >
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <span
              className={`grid place-items-center h-6 w-6 rounded ${dark ? "bg-white/10 text-white" : "bg-primary text-white"} text-[13px] font-bold shrink-0`}
            >
              सू
            </span>
            <span className="font-semibold text-[14.5px] tracking-tight truncate">
              {brand}
            </span>
          </NavLink>
          {variant === "gov" && (
            <span className="ml-auto text-[10px] uppercase tracking-widest text-gov-ink-3 border border-gov-line rounded px-1 py-0.5">
              Gov
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
          {nav.map((item) => (
            <NavRow key={item.to} item={item} dark={dark} />
          ))}
        </nav>

        <div
          className={`px-2 py-2 border-t ${dark ? "border-gov-line" : "border-line"} flex flex-col gap-0.5`}
        >
          {footerNav.map((item) => (
            <NavRow key={item.to} item={item} dark={dark} />
          ))}
        </div>

        <div
          className={`px-3 py-3 border-t ${dark ? "border-gov-line" : "border-line"} flex items-center gap-2.5`}
        >
          <div
            className={`h-8 w-8 rounded-full grid place-items-center text-[13px] font-semibold shrink-0 ${dark ? "bg-white/10 text-white" : "bg-primary-wash text-primary-strong"}`}
          >
            {session.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate">{session.name}</p>
            <p
              className={`text-[11.5px] truncate ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
            >
              {session.title ?? (variant === "gov" ? "Official" : "Citizen")}
            </p>
          </div>
          <button
            onClick={() => {
              endSession();
              navigate("/");
            }}
            title="Log out"
            className={`shrink-0 grid place-items-center h-7 w-7 rounded ${dark ? "text-gov-ink-3 hover:bg-white/10 hover:text-white" : "text-ink-3 hover:bg-panel-3 hover:text-ink"}`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-sidebar">
        <header
          className={`h-topbar shrink-0 border-b ${header} backdrop-blur sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6`}
        >
          <GlobalSearch
            placeholder={searchPlaceholder}
            basePath={searchBase}
            dark={dark}
          />
          <div className="ml-auto flex items-center gap-1.5">
            {contextLabel && (
              <span
                className={`hidden md:inline text-[12px] px-2 py-1 rounded ${dark ? "text-gov-ink-2 bg-white/5" : "text-ink-2 bg-panel-3"}`}
              >
                {contextLabel}
              </span>
            )}
            {session.demo && <DemoBadge dark={dark} />}
            <NotificationBell dark={dark} />
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavRow({ item, dark }: { item: NavItem; dark: boolean }) {
  const badgeCls =
    item.badgeTone === "danger"
      ? "bg-danger text-white"
      : item.badgeTone === "warn"
        ? dark
          ? "bg-amber-400/20 text-amber-300"
          : "bg-warn-wash text-warn"
        : dark
          ? "bg-white/10 text-gov-ink-2"
          : "bg-panel-3 text-ink-2";

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] font-medium transition-colors ${
          isActive
            ? dark
              ? "bg-white/10 text-white"
              : "bg-primary-wash text-primary-strong"
            : dark
              ? "text-gov-ink-2 hover:bg-white/5 hover:text-gov-ink"
              : "text-ink-2 hover:bg-panel-3 hover:text-ink"
        }`
      }
    >
      <span className="material-symbols-outlined text-[19px] shrink-0">
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className={`text-[10.5px] font-semibold rounded px-1 min-w-[16px] text-center tnum ${badgeCls}`}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function DemoBadge({ dark }: { dark: boolean }) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setConfirm((v) => !v)}
        className={`flex items-center gap-1.5 text-[11.5px] font-semibold rounded px-2 h-7 border ${
          dark
            ? "border-amber-400/30 text-amber-300 bg-amber-400/10"
            : "border-warn-line text-warn bg-warn-wash"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Demo workspace
      </button>
      {confirm && (
        <div
          className={`absolute right-0 mt-1.5 w-64 rounded-lg border shadow-raised p-3 text-[12.5px] z-40 ${
            dark
              ? "bg-gov-panel border-gov-line text-gov-ink-2"
              : "bg-panel border-line text-ink-2"
          }`}
        >
          <p className="mb-2">
            This session is showing the seeded demonstration workspace — five
            linked cases shared by both sides.
          </p>
          <button
            onClick={() => {
              clearWorkspace();
              endSession();
              navigate("/login");
            }}
            className="btn btn-sm w-full"
          >
            Exit &amp; clear demo data
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationBell({ dark }: { dark: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => {
      setItems(listNotifications().slice(0, 8));
      setUnread(unreadCount());
    };
    load();
    return subscribe(load);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative grid place-items-center h-8 w-8 rounded-md ${
          dark
            ? "text-gov-ink-2 hover:bg-white/10 hover:text-white"
            : "text-ink-2 hover:bg-panel-3 hover:text-ink"
        }`}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[20px]">
          notifications
        </span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger ring-2 ring-panel" />
        )}
      </button>
      {open && (
        <div
          className={`absolute right-0 mt-1.5 w-80 rounded-lg border shadow-raised overflow-hidden z-40 ${
            dark ? "bg-gov-panel border-gov-line" : "bg-panel border-line"
          }`}
        >
          <div
            className={`px-3 py-2 border-b flex items-center justify-between ${dark ? "border-gov-line" : "border-line"}`}
          >
            <span className="text-[12px] font-semibold uppercase tracking-wide">
              Notifications
            </span>
            <span
              className={`text-[11px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
            >
              {unread} unread
            </span>
          </div>
          {items.length === 0 ? (
            <p
              className={`px-3 py-6 text-center text-[12.5px] ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
            >
              Nothing yet. Deadlines, responses and appeal readiness land here.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      markNotificationRead(n.id);
                      setOpen(false);
                      navigate(
                        `${dark ? "/gov" : "/app"}/cases/${n.caseId}`,
                      );
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b flex gap-2 ${
                      dark
                        ? "border-gov-line hover:bg-white/5"
                        : "border-line hover:bg-panel-2"
                    } ${!n.read ? (dark ? "bg-white/[0.03]" : "bg-primary-wash/40") : ""}`}
                  >
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-primary"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] leading-snug">
                        {n.message}
                      </span>
                      <span
                        className={`block text-[11px] mt-0.5 ${dark ? "text-gov-ink-3" : "text-ink-3"}`}
                      >
                        {formatDateTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-workspace mx-auto px-4 md:px-6 py-6">{children}</div>
  );
}
