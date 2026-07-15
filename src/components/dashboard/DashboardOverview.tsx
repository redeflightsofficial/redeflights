"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardQuickActions } from "@/components/dashboard/dashboard-nav";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  FileText,
  Hotel,
  Image,
  LoaderCircle,
  Package,
  RefreshCw,
  Route,
  Search,
  Sparkles,
} from "lucide-react";

type ModuleStats = {
  total: number;
  pending: number;
  active: number;
};

type DashboardSnapshot = {
  enquiries: { total: number; new: number };
  routes: ModuleStats;
  destinations: ModuleStats;
  hotels: ModuleStats;
  visas: ModuleStats;
  banners: ModuleStats;
};

const emptyStats: ModuleStats = { total: 0, pending: 0, active: 0 };

const initialSnapshot: DashboardSnapshot = {
  enquiries: { total: 0, new: 0 },
  routes: emptyStats,
  destinations: emptyStats,
  hotels: emptyStats,
  visas: emptyStats,
  banners: emptyStats,
};

const iconMap = {
  layout: BarChart3,
  route: Route,
  search: Search,
  hotel: Hotel,
  visa: BadgeCheck,
  image: Image,
  package: Package,
  "file-text": FileText,
} as const;

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  const data = (await response.json()) as T;
  return { ok: response.ok, data };
}

function StatCard({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "navy" | "red" | "green" | "amber";
}) {
  const toneClass =
    tone === "red"
      ? "dash-stat-red"
      : tone === "green"
        ? "dash-stat-green"
        : tone === "amber"
          ? "dash-stat-amber"
          : "";

  return (
    <article className={`dash-stat ${toneClass}`}>
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-value">{value}</p>
      {sub ? <p className="dash-stat-sub">{sub}</p> : null}
    </article>
  );
}

export function DashboardOverview() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [enquiriesRes, routesRes, destinationsRes, hotelsRes, visasRes, bannersRes] =
        await Promise.all([
          fetchJson<{ enquiries?: { status: string }[] }>("/api/enquiries"),
          fetchJson<{ stats?: ModuleStats }>("/api/routes"),
          fetchJson<{ stats?: ModuleStats }>("/api/destinations"),
          fetchJson<{ stats?: ModuleStats }>("/api/hotels"),
          fetchJson<{ stats?: ModuleStats }>("/api/visas"),
          fetchJson<{ stats?: ModuleStats }>("/api/banners"),
        ]);

      const enquiries = enquiriesRes.data.enquiries || [];

      setSnapshot({
        enquiries: {
          total: enquiries.length,
          new: enquiries.filter((item) => item.status === "new").length,
        },
        routes: routesRes.data.stats || emptyStats,
        destinations: destinationsRes.data.stats || emptyStats,
        hotels: hotelsRes.data.stats || emptyStats,
        visas: visasRes.data.stats || emptyStats,
        banners: bannersRes.data.stats || emptyStats,
      });
    } catch {
      setError("Unable to load dashboard overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const activeProducts = useMemo(
    () => snapshot.destinations.active + snapshot.hotels.active + snapshot.visas.active,
    [snapshot],
  );

  return (
    <DashboardShell title="Dashboard Overview" breadcrumb="Home / Dashboard">
      <div className="dash-page">
        <section className="dash-hero-card p-4 sm:p-5">
          <div className="dash-hero-inner flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="dash-eyebrow inline-flex items-center gap-1.5">
                <Sparkles size={13} />
                Admin Control Center
              </p>
              <h2 className="dash-hero-title">Welcome back to REDE FLIGHTS</h2>
              <p className="dash-hero-text">
                Manage enquiries, flights, destinations, hotels, visa services and banners from one
                admin workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSnapshot}
              disabled={loading}
              className="dash-btn-secondary"
            >
              {loading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Refresh Data
            </button>
          </div>
        </section>

        {error ? <p className="dash-error">{error}</p> : null}

        <div className="dash-stats-grid">
          <StatCard
            label="New Enquiries"
            value={loading ? "..." : snapshot.enquiries.new}
            sub={`${snapshot.enquiries.total} total leads`}
            tone={snapshot.enquiries.new > 0 ? "red" : "navy"}
          />
          <StatCard
            label="Active Routes"
            value={loading ? "..." : snapshot.routes.active}
            sub={`${snapshot.routes.total} routes in system`}
            tone="green"
          />
          <StatCard
            label="Live Products"
            value={loading ? "..." : activeProducts}
            sub="Destinations, hotels and visa"
            tone="green"
          />
          <StatCard
            label="Banner Images"
            value={loading ? "..." : snapshot.banners.total}
            sub="Homepage carousel assets"
            tone="navy"
          />
        </div>

        <section className="dash-card dash-card-flat p-4 sm:p-5">
          <p className="dash-eyebrow">Quick Actions</p>
          <h3 className="dash-card-title">Manage Faster</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardQuickActions.map((action) => {
              const Icon = iconMap[action.icon];
              return (
                <Link key={action.href} href={action.href} className="dash-action-link">
                  <span className="inline-flex items-center gap-2">
                    <Icon size={14} className="text-[#e30613]" />
                    {action.label}
                  </span>
                  <ArrowRight size={14} className="text-slate-400" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
