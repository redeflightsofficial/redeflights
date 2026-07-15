"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, useState, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { dashboardNavSections } from "@/components/dashboard/dashboard-nav";
import type { DashboardIconKey } from "@/components/dashboard/dashboard-nav";
import {
  BadgeCheck,
  BarChart3,
  Hotel,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Route,
  Search,
  Settings,
  FileText,
  FileUp,
  Image,
  LoaderCircle,
  Package,
  X,
} from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function isValidSupabaseConfig(url?: string, key?: string) {
  if (!url || !key) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const iconByKey: Record<DashboardIconKey, typeof LayoutDashboard> = {
  layout: LayoutDashboard,
  chart: BarChart3,
  "map-pinned": MapPinned,
  plane: Plane,
  hotel: Hotel,
  visa: BadgeCheck,
  insurance: ShieldCheck,
  route: Route,
  "file-up": FileUp,
  image: Image,
  search: Search,
  "file-text": FileText,
  package: Package,
  settings: Settings,
};

export function DashboardShell({
  title,
  breadcrumb,
  children,
}: {
  title: string;
  breadcrumb?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isDesktop = useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia("(min-width: 1024px)");
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, isDesktop]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
      try {
        const client = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
        await client.auth.signOut();
      } catch (error) {
        console.warn("Supabase sign out skipped:", error);
      }
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Admin logout skipped:", error);
    }

    router.push("/login");
    router.refresh();
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <main className="dash-shell min-h-screen text-slate-800">
      <div
        className="grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-200 ease-out"
        style={{
          gridTemplateColumns: isDesktop ? `${sidebarWidth}px 1fr` : "1fr",
        }}
      >
        {menuOpen && !isDesktop ? (
          <button
            type="button"
            aria-label="Close sidebar"
            className="dash-sidebar-overlay fixed inset-0 z-40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          id="dashboard-sidebar"
          className={`dash-sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden transition-transform duration-200 ease-out lg:static ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } ${sidebarCollapsed ? "dash-sidebar-collapsed" : ""}`}
          style={{ width: sidebarWidth }}
        >
          <div className="dash-sidebar-glow pointer-events-none absolute inset-0" aria-hidden />

          <div className="dash-sidebar-brand relative shrink-0">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
              <div className="dash-sidebar-logo-badge shrink-0">
                <span className="text-[10px] font-black tracking-tight text-white">
                  <span className="text-[#ff6b76]">R</span>F
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold tracking-wide text-white">
                    REDE<span className="text-[#ff6b76]">FLIGHTS</span>
                  </p>
                  <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-100/60">
                    Admin
                  </p>
                </div>
              )}
            </div>

            {!isDesktop && (
              <button
                type="button"
                aria-label="Close menu"
                className="dash-sidebar-close-btn lg:hidden"
                onClick={() => setMenuOpen(false)}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <nav className="dash-sidebar-nav relative flex-1 overflow-y-auto px-2 py-1.5">
            <div className="space-y-3">
              {dashboardNavSections.map((section) => (
                <div key={section.title}>
                  {!sidebarCollapsed ? (
                    <p className="dash-nav-section-label px-1">{section.title}</p>
                  ) : null}
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const Icon = iconByKey[item.icon];

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            title={sidebarCollapsed ? item.label : item.description}
                            onClick={() => setMenuOpen(false)}
                            className={`dash-nav-link group ${active ? "dash-nav-link-active" : ""} ${
                              sidebarCollapsed ? "dash-nav-link-collapsed" : ""
                            }`}
                          >
                            <span className={`dash-nav-icon-wrap ${active ? "dash-nav-icon-wrap-active" : ""}`}>
                              <Icon size={13} className="shrink-0" />
                            </span>
                            {!sidebarCollapsed && (
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            )}
                            {sidebarCollapsed && (
                              <span className="dash-nav-tooltip" role="tooltip">
                                {item.label}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="relative shrink-0 border-t border-white/10 p-2">
            <button
              type="button"
              className={`dash-signout-btn ${sidebarCollapsed ? "dash-signout-btn-collapsed" : ""}`}
              onClick={handleSignOut}
              disabled={signingOut}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut size={14} />
              {!sidebarCollapsed && (
                <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
              )}
            </button>
          </div>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-col">
          <header className="dash-topbar sticky top-0 z-20">
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 sm:px-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  className="dash-menu-btn"
                  onClick={() => {
                    if (!isDesktop) {
                      setMenuOpen((prev) => !prev);
                      return;
                    }
                    setSidebarCollapsed((prev) => !prev);
                  }}
                  aria-expanded={isDesktop ? !sidebarCollapsed : menuOpen}
                  aria-controls="dashboard-sidebar"
                >
                  {!isDesktop ? (
                    menuOpen ? <X size={16} /> : <Menu size={16} />
                  ) : sidebarCollapsed ? (
                    <PanelLeftOpen size={16} />
                  ) : (
                    <PanelLeftClose size={16} />
                  )}
                  <span className="hidden sm:inline">
                    {!isDesktop
                      ? menuOpen
                        ? "Close"
                        : "Menu"
                      : sidebarCollapsed
                        ? "Expand"
                        : "Collapse"}
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-500">
                    {breadcrumb ?? "Home / Dashboard"}
                  </p>
                  <h1 className="truncate text-sm font-bold text-[#0b2f57] sm:text-base">{title}</h1>
                </div>
              </div>

              <div className="dash-header-chip shrink-0">
                <span className="dash-header-chip-dot" aria-hidden />
                Admin
              </div>
            </div>
          </header>

          <div className="dash-content flex-1">{children}</div>
        </section>
      </div>
    </main>
  );
}
