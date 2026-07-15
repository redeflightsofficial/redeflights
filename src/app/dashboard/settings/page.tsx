"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardNavSections } from "@/components/dashboard/dashboard-nav";
import { LoaderCircle, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const result = (await response.json()) as { authenticated?: boolean; email?: string };
        if (response.ok && result.authenticated) {
          setEmail(result.email || "Admin");
        }
      } catch {
        setEmail(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  return (
    <DashboardShell title="Settings" breadcrumb="Home / Dashboard / Settings">
      <div className="dash-page">
        <section className="dash-hero-card p-4 sm:p-5">
          <div className="dash-hero-inner">
            <p className="dash-eyebrow">System</p>
            <h2 className="dash-hero-title">Dashboard Settings</h2>
            <p className="dash-hero-text">
              Manage your admin workspace, connected modules and backend API endpoints from one place.
            </p>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="dash-card dash-card-flat p-5">
            <p className="dash-eyebrow">Account</p>
            <h2 className="dash-card-title">Admin Session</h2>
            <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-[#f8fafc] to-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0b2f57] text-white shadow-[0_8px_20px_rgba(11,47,87,0.18)]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0b2f57]">
                    {loading ? "Checking session..." : email || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500">Secure OTP login enabled</p>
                </div>
              </div>
            </div>
          </section>

          <section className="dash-card dash-card-flat p-5">
            <p className="dash-eyebrow">Workspace</p>
            <h2 className="dash-card-title">Connected Modules</h2>
            <div className="mt-4 space-y-2">
              {dashboardNavSections
                .flatMap((section) => section.items)
                .filter((item) => item.key !== "dashboard" && item.key !== "settings")
                .map((item) => (
                  <Link key={item.href} href={item.href} className="dash-action-link">
                    <span>{item.label}</span>
                    <span className="max-w-[55%] truncate text-right text-[11px] font-medium text-slate-500">
                      {item.description}
                    </span>
                  </Link>
                ))}
            </div>
          </section>

          <section className="dash-card dash-card-flat p-5 lg:col-span-2">
            <p className="dash-eyebrow">Backend</p>
            <h2 className="dash-card-title">API Endpoints</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your dashboard is connected to all backend APIs: enquiries, banners, routes, airlines,
              airports, destinations, hotels and visa services.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "/api/enquiries",
                "/api/banners",
                "/api/routes",
                "/api/airlines",
                "/api/airports",
                "/api/destinations",
                "/api/hotels",
                "/api/visas",
              ].map((endpoint) => (
                <div
                  key={endpoint}
                  className="rounded-lg border border-slate-200 bg-gradient-to-br from-[#fafbfd] to-white px-3 py-2.5 text-xs font-semibold text-[#0b2f57]"
                >
                  {endpoint}
                </div>
              ))}
            </div>
            {loading ? (
              <p className="dash-loading-inline">
                <LoaderCircle size={14} className="animate-spin text-[#e30613]" />
                Verifying admin session...
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
