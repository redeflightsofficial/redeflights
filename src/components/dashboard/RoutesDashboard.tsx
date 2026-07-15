"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildRouteSeo } from "@/lib/route-meta";
import type { Airline, EntityStatus } from "@/types/airline";
import type { Airport } from "@/types/airport";
import type { Route } from "@/types/route";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileUp,
  LoaderCircle,
  MapPin,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Trash2,
  X,
} from "lucide-react";

const ROUTES_PER_PAGE = 5;

type DashboardVariant = "routes" | "flights";

type DashboardCopy = {
  title: string;
  breadcrumb: string;
  entity: string;
  entityPlural: string;
  addManual: string;
  addForm: string;
  editForm: string;
  submitAdd: string;
  allFilter: string;
  activeFilter: string;
  emptyAll: string;
  emptyActive: string;
  emptyPending: string;
  loadError: string;
  saveError: string;
  savedMessage: string;
  deleteConfirm: (from: string, to: string) => string;
  closePanel: string;
};

const COPY: Record<DashboardVariant, DashboardCopy> = {
  routes: {
    title: "Routes",
    breadcrumb: "Home / Dashboard / Routes",
    entity: "Route",
    entityPlural: "Routes",
    addManual: "Add Route",
    addForm: "Add Route",
    editForm: "Edit Route",
    submitAdd: "Add Route",
    allFilter: "All Routes",
    activeFilter: "Active Routes",
    emptyAll: "No routes yet. Upload Excel or add manually.",
    emptyActive: "No active routes yet.",
    emptyPending: "No pending routes.",
    loadError: "Unable to load routes.",
    saveError: "Unable to save route.",
    savedMessage: "Route saved. Airline & airports auto-linked.",
    deleteConfirm: (from, to) => `Delete route ${from} to ${to}?`,
    closePanel: "Close add route panel",
  },
  flights: {
    title: "Flights",
    breadcrumb: "Home / Dashboard / Flights",
    entity: "Flight",
    entityPlural: "Flights",
    addManual: "Add Flight",
    addForm: "Add Flight",
    editForm: "Edit Flight",
    submitAdd: "Add Flight",
    allFilter: "All Flights",
    activeFilter: "Active Flights",
    emptyAll: "No flights yet. Upload Excel or add manually.",
    emptyActive: "No active flights yet.",
    emptyPending: "No pending flights.",
    loadError: "Unable to load flights.",
    saveError: "Unable to save flight.",
    savedMessage: "Flight saved with auto SEO. Airline & airports auto-linked.",
    deleteConfirm: (from, to) => `Delete flight ${from} to ${to}?`,
    closePanel: "Close add flight panel",
  },
};

const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusStyle(status: EntityStatus) {
  return status === "active"
    ? "bg-[#ecfdf3] text-[#166534]"
    : "bg-[#fff7ed] text-[#c2410c]";
}

export function RoutesDashboard({ variant = "routes" }: { variant?: DashboardVariant }) {
  const copy = COPY[variant];
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Route | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [airlineName, setAirlineName] = useState("");
  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routesRes, airlinesRes, airportsRes] = await Promise.all([
        fetch("/api/routes", { credentials: "same-origin" }),
        fetch("/api/airlines", { credentials: "same-origin" }),
        fetch("/api/airports", { credentials: "same-origin" }),
      ]);
      const routesJson = (await routesRes.json()) as { routes?: Route[]; error?: string };
      const airlinesJson = (await airlinesRes.json()) as { airlines?: Airline[]; stats?: { total: number } };
      const airportsJson = (await airportsRes.json()) as { airports?: Airport[] };

      if (!routesRes.ok) {
        setError(routesJson.error || copy.loadError);
        return;
      }

      setRoutes(routesJson.routes || []);
      setAirlines(airlinesJson.airlines || []);
      setAirports(airportsJson.airports || []);
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seoPreview = useMemo(() => {
    if (!fromCity.trim() || !toCity.trim()) return null;
    return buildRouteSeo(fromCity, toCity, siteOrigin, airlineName);
  }, [fromCity, toCity, airlineName]);

  useEffect(() => {
    if (!manualFormOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetForm();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [manualFormOpen]);

  const canGoNext = Boolean(fromCity.trim() && toCity.trim());

  const filteredRoutes = useMemo(() => {
    if (filter === "all") return routes;
    return routes.filter((item) => item.status === filter);
  }, [routes, filter]);

  const pendingCount = useMemo(() => routes.filter((r) => r.status === "pending").length, [routes]);
  const activeCount = useMemo(() => routes.filter((r) => r.status === "active").length, [routes]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE));

  const paginatedRoutes = useMemo(() => {
    const start = page * ROUTES_PER_PAGE;
    return filteredRoutes.slice(start, start + ROUTES_PER_PAGE);
  }, [filteredRoutes, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  function resetForm(closeForm = true) {
    setFromCity("");
    setToCity("");
    setAirlineName("");
    setFromAirport("");
    setToAirport("");
    setEditing(null);
    setFormStep(1);
    if (closeForm) setManualFormOpen(false);
  }

  function openManualForm() {
    resetForm(false);
    setManualFormOpen(true);
  }

  function fillForm(route: Route) {
    setFromCity(route.from_city);
    setToCity(route.to_city);
    setAirlineName(route.airline_name || "");
    setFromAirport(route.from_airport_code || "");
    setToAirport(route.to_airport_code || "");
    setEditing(route);
    setFormStep(1);
    setManualFormOpen(true);
  }

  async function handleExcelImport(file: File | null) {
    if (!file || importing) return;
    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/routes/import", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Excel import failed.");
        return;
      }

      setMessage(result.message || "Excel imported successfully.");
      await loadData();
    } catch {
      setError("Network error during Excel import.");
    } finally {
      setImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      from_city: fromCity,
      to_city: toCity,
      airline_name: airlineName,
      from_airport_code: fromAirport,
      to_airport_code: toAirport,
    };

    try {
      const response = await fetch(editing ? `/api/routes/${editing.id}` : "/api/routes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        route?: Route;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.route) {
        setError(result.error || copy.saveError);
        return;
      }

      setRoutes((current) =>
        editing
          ? current.map((item) => (item.id === result.route!.id ? result.route! : item))
          : [result.route!, ...current],
      );
      setMessage(result.message || copy.savedMessage);
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(route: Route) {
    const nextStatus: EntityStatus = route.status === "active" ? "pending" : "active";
    setUpdatingId(route.id);
    try {
      const response = await fetch("/api/routes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: route.id, status: nextStatus }),
      });
      const result = (await response.json()) as { route?: Route; error?: string };
      if (!response.ok || !result.route) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setRoutes((current) => current.map((row) => (row.id === route.id ? result.route! : row)));
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRoute(route: Route) {
    if (!confirm(copy.deleteConfirm(route.from_city, route.to_city))) return;
    setUpdatingId(route.id);
    try {
      const response = await fetch(`/api/routes/${route.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete.");
        return;
      }
      setRoutes((current) => current.filter((row) => row.id !== route.id));
      if (editing?.id === route.id) resetForm();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function clearAllData() {
    const total = routes.length + airlines.length + airports.length;
    if (total === 0) return;
    if (
      !confirm(
        "Clear all flights, airlines and airports? This will delete everything and cannot be undone.",
      )
    ) {
      return;
    }

    setClearingAll(true);
    setError(null);
    setMessage(null);
    try {
      const [routesRes, airlinesRes, airportsRes] = await Promise.all([
        fetch("/api/routes", { method: "DELETE", credentials: "same-origin" }),
        fetch("/api/airlines", { method: "DELETE", credentials: "same-origin" }),
        fetch("/api/airports", { method: "DELETE", credentials: "same-origin" }),
      ]);

      const routesJson = (await routesRes.json()) as { message?: string; error?: string };
      const airlinesJson = (await airlinesRes.json()) as { message?: string; error?: string };
      const airportsJson = (await airportsRes.json()) as { message?: string; error?: string };

      if (!routesRes.ok || !airlinesRes.ok || !airportsRes.ok) {
        setError(
          routesJson.error ||
            airlinesJson.error ||
            airportsJson.error ||
            "Unable to clear all data.",
        );
        return;
      }

      setRoutes([]);
      setAirlines([]);
      setAirports([]);
      setPage(0);
      resetForm();
      setMessage("All flights, airlines and airports cleared.");
    } catch {
      setError("Network error while clearing data.");
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <DashboardShell title={copy.title} breadcrumb={copy.breadcrumb}>
      <div className={`transition-all duration-300 ${manualFormOpen ? "pointer-events-none scale-[0.98] opacity-60" : ""}`}>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#fff5f6] text-[#e30613]">
              <RouteIcon size={13} />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{copy.entityPlural}</p>
              <p className="text-base font-bold leading-none text-[#0b2f57]">{routes.length}</p>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/airlines"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-[#e30613]/30 hover:bg-[#fafbfd]"
        >
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#eff6ff] text-[#0b2f57]">
              <Plane size={13} />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Airlines</p>
              <p className="text-base font-bold leading-none text-[#0b2f57]">{airlines.length}</p>
            </div>
          </div>
        </Link>
        <Link
          href="/dashboard/airports"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-[#e30613]/30 hover:bg-[#fafbfd]"
        >
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#ecfdf3] text-[#166534]">
              <Building2 size={13} />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Airports</p>
              <p className="text-base font-bold leading-none text-[#0b2f57]">{airports.length}</p>
            </div>
          </div>
        </Link>
        <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-[#e30613]/30 hover:bg-[#fafbfd]">
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#fff5f6] text-[#e30613]">
              {importing ? <LoaderCircle size={13} className="animate-spin" /> : <FileUp size={13} />}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Excel</p>
              <p className="truncate text-[11px] font-semibold text-[#0b2f57]">
                {importing ? "Importing..." : "Upload file"}
              </p>
            </div>
          </div>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={importing}
            onChange={(e) => handleExcelImport(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="button"
          onClick={openManualForm}
          className="rounded-lg border border-[#fecdd3] bg-[#fff5f6] px-2.5 py-2 text-left shadow-sm transition hover:border-[#e30613]/40"
        >
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-[#e30613]">
              <Plus size={13} />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-[#e30613]">Manual</p>
              <p className="text-[11px] font-semibold text-[#0b2f57]">{copy.addManual}</p>
            </div>
          </div>
        </button>
      </div>
      <p className="mb-3 text-[10px] text-slate-500">
        Excel columns: From, To, Airline Name, From IATA, To IATA, Country / From Country / To Country
      </p>

      {message ? (
        <p className="mb-3 rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#166534]">{message}</p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-[#fff5f6] px-3 py-2 text-sm font-medium text-[#e30613]">{error}</p>
      ) : null}

      <div className="dash-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[#fafbfd] px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                filter === "all"
                  ? "bg-[#0b2f57] text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              <MapPin size={11} />
              All {copy.entityPlural}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === "all" ? "bg-white/20" : "bg-slate-100"}`}>
                {routes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                filter === "pending"
                  ? "bg-[#fff7ed] text-[#c2410c] ring-1 ring-[#fdba74]"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              <Clock3 size={11} />
              Pending
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === "pending" ? "bg-[#ffedd5]" : "bg-slate-100"}`}>
                {pendingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                filter === "active"
                  ? "bg-[#ecfdf3] text-[#166534] ring-1 ring-[#86efac]"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              <CheckCircle2 size={11} />
              Active {copy.entityPlural}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === "active" ? "bg-[#dcfce7]" : "bg-slate-100"}`}>
                {activeCount}
              </span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={loadData} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              type="button"
              disabled={clearingAll || (routes.length === 0 && airlines.length === 0 && airports.length === 0)}
              onClick={clearAllData}
              className="inline-flex items-center gap-1 rounded-md border border-[#fecdd3] bg-[#fff5f6] px-2 py-1 text-[11px] font-semibold text-[#e30613] disabled:opacity-50"
            >
              {clearingAll ? <LoaderCircle size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <LoaderCircle size={16} className="animate-spin text-[#e30613]" /> Loading...
          </div>
        ) : filteredRoutes.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            {filter === "active" ? copy.emptyActive : filter === "pending" ? copy.emptyPending : copy.emptyAll}
          </p>
        ) : (
          <>
          <div className="dash-table-wrap">
            <table className="dash-table w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#fafbfd]">
                  <th>From</th>
                  <th>To</th>
                  <th>Airline</th>
                  <th>Airports</th>
                  <th>H1</th>
                  <th>Meta</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutes.map((route) => (
                  <tr key={route.id} className="border-b border-slate-100">
                    <td className="font-semibold text-[#0b2f57]">{route.from_city}</td>
                    <td className="font-semibold text-[#0b2f57]">{route.to_city}</td>
                    <td>{route.airline_name || "-"}</td>
                    <td className="text-[11px] text-slate-600">
                      {route.from_airport_code || "-"} → {route.to_airport_code || "-"}
                    </td>
                    <td className="max-w-[180px] text-[11px] text-slate-600">
                      {route.status === "active" && route.slug ? (
                        <Link
                          href={`/flights/${route.slug}`}
                          target="_blank"
                          className="font-semibold text-[#0b2f57] hover:text-[#e30613]"
                        >
                          {route.h1_heading || `${route.from_city} to ${route.to_city}`}
                        </Link>
                      ) : (
                        <span>{route.h1_heading || "-"}</span>
                      )}
                      {route.page_url ? (
                        <p className="mt-0.5 break-all text-[10px] text-slate-400">{route.page_url}</p>
                      ) : null}
                    </td>
                    <td className="max-w-[200px] text-[11px] text-slate-500">
                      {route.meta_description
                        ? route.meta_description.length > 72
                          ? `${route.meta_description.slice(0, 72)}…`
                          : route.meta_description
                        : "-"}
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(route.status)}`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(route.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => fillForm(route)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]"><Pencil size={13} /></button>
                        <button
                          type="button"
                          disabled={updatingId === route.id}
                          onClick={() => toggleStatus(route)}
                          title={route.status === "active" ? "Set pending" : "Set active"}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                        >
                          {updatingId === route.id ? <LoaderCircle size={13} className="animate-spin" /> : route.status === "active" ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
                        </button>
                        <button type="button" disabled={updatingId === route.id} onClick={() => deleteRoute(route)} className="rounded-md border border-[#fecdd3] bg-[#fff5f6] p-1.5 text-[#e30613]"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRoutes.length > ROUTES_PER_PAGE ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
              <p className="text-[11px] text-slate-500">
                Showing {page * ROUTES_PER_PAGE + 1}–
                {Math.min((page + 1) * ROUTES_PER_PAGE, filteredRoutes.length)} of {filteredRoutes.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="min-w-[3rem] text-center text-[11px] font-bold text-[#0b2f57]">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 disabled:opacity-40"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ) : null}
          </>
        )}
      </div>
      </div>

      {manualFormOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label={copy.closePanel}
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={() => resetForm()}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[380px] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)] animate-[slideInRight_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#0b2f57]">
                  {editing ? copy.editForm : copy.addForm}
                </p>
                <p className="text-[11px] text-slate-500">Step {formStep} of 2</p>
              </div>
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-[#e30613]"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {formStep === 1 ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">
                      From
                      <input
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        required
                        placeholder="Dubai"
                        className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">
                      To
                      <input
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        required
                        placeholder="Kochi"
                        className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]/40"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">
                      Airline Name
                      <input
                        value={airlineName}
                        onChange={(e) => setAirlineName(e.target.value)}
                        placeholder="Emirates"
                        className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]/40"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">Airline & airports auto-link honge</p>
                  </>
                ) : (
                  <>
                    <div className="rounded-md bg-[#fafbfd] px-2.5 py-2 text-[11px] text-slate-600">
                      <span className="font-semibold text-[#0b2f57]">{fromCity}</span>
                      {" → "}
                      <span className="font-semibold text-[#0b2f57]">{toCity}</span>
                      {airlineName ? ` · ${airlineName}` : ""}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-xs font-semibold text-slate-600">
                        From IATA
                        <input
                          value={fromAirport}
                          onChange={(e) => setFromAirport(e.target.value.toUpperCase())}
                          maxLength={3}
                          placeholder="DXB"
                          className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm uppercase outline-none focus:border-[#e30613]/40"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        To IATA
                        <input
                          value={toAirport}
                          onChange={(e) => setToAirport(e.target.value.toUpperCase())}
                          maxLength={3}
                          placeholder="COK"
                          className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm uppercase outline-none focus:border-[#e30613]/40"
                        />
                      </label>
                    </div>

                    {seoPreview ? (
                      <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-2.5 text-[10px] leading-relaxed text-slate-600">
                        <p className="font-bold text-[#e30613]">Auto SEO (generated on save)</p>
                        <p className="mt-1 break-words">
                          <span className="font-semibold text-[#0b2f57]">H1:</span> {seoPreview.h1_heading}
                        </p>
                        <p className="mt-0.5 break-words">
                          <span className="font-semibold text-[#0b2f57]">Title:</span> {seoPreview.seo_title}
                        </p>
                        <p className="mt-0.5 break-words">
                          <span className="font-semibold text-[#0b2f57]">Meta:</span> {seoPreview.meta_description}
                        </p>
                        <p className="mt-0.5 break-all">
                          <span className="font-semibold text-[#0b2f57]">URL:</span> {seoPreview.page_url}
                        </p>
                        <p className="mt-0.5 break-words">
                          <span className="font-semibold text-[#0b2f57]">Keywords:</span> {seoPreview.seo_keywords}
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
                {formStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                )}

                {formStep === 1 ? (
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => setFormStep(2)}
                    className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
                  >
                    {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                    {editing ? "Update" : copy.submitAdd}
                  </button>
                )}
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
