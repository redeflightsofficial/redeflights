"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildAirlineSeo } from "@/lib/airline-meta";
import { buildAirportSeo } from "@/lib/airport-meta";
import type { Airline, EntityStatus } from "@/types/airline";
import type { Airport } from "@/types/airport";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileUp,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type EntityKind = "airline" | "airport";

const ITEMS_PER_PAGE = 5;

type SeoPreview = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
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

function SeoPreviewCard({ seo }: { seo: SeoPreview | null }) {
  if (!seo) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-3 text-xs">
      <p className="font-bold uppercase tracking-wide text-[#e30613]">Auto SEO Preview</p>
      <div className="mt-2 space-y-1.5 text-slate-600">
        <p><span className="font-semibold text-[#0b2f57]">Slug:</span> {seo.slug}</p>
        <p><span className="font-semibold text-[#0b2f57]">Page URL:</span> {seo.page_url}</p>
        <p><span className="font-semibold text-[#0b2f57]">SEO Title:</span> {seo.seo_title}</p>
        <p><span className="font-semibold text-[#0b2f57]">Meta:</span> {seo.meta_description}</p>
        <p><span className="font-semibold text-[#0b2f57]">H1:</span> {seo.h1_heading}</p>
      </div>
    </div>
  );
}

export function MasterEntityDashboard({
  kind,
  title,
}: {
  kind: EntityKind;
  title: string;
}) {
  const apiBase = kind === "airline" ? "/api/airlines" : "/api/airports";
  const [items, setItems] = useState<(Airline | Airport)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<"manual" | "excel">("manual");
  const [editing, setEditing] = useState<Airline | Airport | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const seoPreview = useMemo<SeoPreview | null>(() => {
    if (!name.trim() || !iataCode.trim()) return null;
    if (kind === "airline") {
      return buildAirlineSeo(name, iataCode, country, siteOrigin);
    }
    if (!city.trim()) return null;
    return buildAirportSeo(name, iataCode, city, country, siteOrigin);
  }, [kind, name, iataCode, city, country]);

  function resetForm() {
    setName("");
    setIataCode("");
    setIcaoCode("");
    setCity("");
    setCountry("");
    setEditing(null);
  }

  function fillForm(item: Airline | Airport) {
    setName(item.name);
    setIataCode(item.iata_code);
    setCountry(item.country || "");
    if (kind === "airline") {
      setIcaoCode((item as Airline).icao_code || "");
      setCity("");
    } else {
      setCity((item as Airport).city);
      setIcaoCode("");
    }
  }

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiBase, { credentials: "same-origin" });
      const result = (await response.json()) as {
        airlines?: Airline[];
        airports?: Airport[];
        error?: string;
      };
      if (!response.ok) {
        setError(result.error || `Unable to load ${title.toLowerCase()}.`);
        setItems([]);
        return;
      }
      setItems(kind === "airline" ? result.airlines || [] : result.airports || []);
    } catch {
      setError(`Network error while loading ${title.toLowerCase()}.`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [apiBase, kind, title]);

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      active: items.filter((item) => item.status === "active").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload =
      kind === "airline"
        ? { name, iata_code: iataCode, icao_code: icaoCode, country }
        : { name, iata_code: iataCode, city, country };

    try {
      const response = await fetch(editing ? `${apiBase}/${editing.id}` : apiBase, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        airline?: Airline;
        airport?: Airport;
        error?: string;
        message?: string;
      };

      const saved = kind === "airline" ? result.airline : result.airport;
      if (!response.ok || !saved) {
        setError(result.error || `Unable to save ${title.toLowerCase()}.`);
        return;
      }

      setItems((current) => {
        if (editing) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });
      setMessage(result.message || `${title} saved with auto SEO.`);
      resetForm();
    } catch {
      setError(`Network error while saving ${title.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleExcelImport(file: File | null) {
    if (!file) return;
    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${apiBase}/import`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
        imported?: string[];
      };

      if (!response.ok) {
        setError(result.error || "Excel import failed.");
        return;
      }

      setMessage(result.message || "Excel imported successfully.");
      await loadItems();
      if (excelInputRef.current) excelInputRef.current.value = "";
    } catch {
      setError("Network error during Excel import.");
    } finally {
      setImporting(false);
    }
  }

  async function toggleStatus(item: Airline | Airport) {
    const nextStatus: EntityStatus = item.status === "active" ? "pending" : "active";
    setUpdatingId(item.id);
    try {
      const response = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const result = (await response.json()) as {
        airline?: Airline;
        airport?: Airport;
        error?: string;
      };
      const updated = kind === "airline" ? result.airline : result.airport;
      if (!response.ok || !updated) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)));
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteItem(item: Airline | Airport) {
    if (!confirm(`Delete ${item.name}?`)) return;
    setUpdatingId(item.id);
    try {
      const response = await fetch(`${apiBase}/${item.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete.");
        return;
      }
      setItems((current) => current.filter((row) => row.id !== item.id));
      if (editing?.id === item.id) resetForm();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function clearAllItems() {
    if (items.length === 0) return;
    const label = kind === "airline" ? "airlines" : "airports";
    if (!confirm(`Clear all ${label}? This will delete everything and cannot be undone.`)) return;

    setClearingAll(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(apiBase, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(result.error || `Unable to clear ${label}.`);
        return;
      }
      setItems([]);
      setPage(0);
      resetForm();
      setMessage(result.message || `All ${label} cleared.`);
    } catch {
      setError(`Network error while clearing ${label}.`);
    } finally {
      setClearingAll(false);
    }
  }

  const filterTabs: { key: "all" | EntityStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "active", label: "Active", count: stats.active },
  ];

  return (
    <DashboardShell title={title} breadcrumb={`Home / Dashboard / ${title}`}>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Active", value: stats.active },
        ].map((item) => (
          <div key={item.label} className="dash-stat">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="text-lg font-bold text-[#0b2f57]">{item.value}</p>
          </div>
        ))}
      </div>

      {message ? (
        <p className="mb-3 rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#166534]">{message}</p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-[#fff5f6] px-3 py-2 text-sm font-medium text-[#e30613]">{error}</p>
      ) : null}

      <div className="dash-card mb-3 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 px-3 py-2 text-xs font-bold ${mode === "manual" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}
          >
            <Plus size={13} className="mr-1 inline" />
            Manual Add
          </button>
          <button
            type="button"
            onClick={() => setMode("excel")}
            className={`flex-1 px-3 py-2 text-xs font-bold ${mode === "excel" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}
          >
            <FileUp size={13} className="mr-1 inline" />
            Excel Import
          </button>
        </div>

        <div className="p-3">
          {mode === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40"
                    placeholder={kind === "airline" ? "Emirates" : "Dubai International"}
                    required
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  IATA Code
                  <input
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40"
                    placeholder={kind === "airline" ? "EK" : "DXB"}
                    required
                  />
                </label>
                {kind === "airline" ? (
                  <label className="block text-xs font-semibold text-slate-600">
                    ICAO Code
                    <input
                      value={icaoCode}
                      onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40"
                      placeholder="UAE"
                    />
                  </label>
                ) : (
                  <label className="block text-xs font-semibold text-slate-600">
                    City
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40"
                      placeholder="Dubai"
                      required
                    />
                  </label>
                )}
                <label className="block text-xs font-semibold text-slate-600">
                  Country
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40"
                    placeholder="UAE"
                  />
                </label>
              </div>

              <SeoPreviewCard seo={seoPreview} />

              <div className="flex justify-end gap-2">
                {editing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    <X size={13} /> Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
                >
                  {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                  {editing ? "Update" : "Add"} {title.slice(0, -1)}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Upload Excel (.xlsx, .xls, .csv). Columns:{" "}
                {kind === "airline" ? "Name, IATA, Country" : "Name, IATA, City, Country"}.
                SEO title, meta, H1 and page URL auto-generate.
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-[#fafbfd] px-4 py-6 text-center hover:border-[#e30613]/40">
                <Upload size={20} className="text-[#e30613]" />
                <span className="mt-2 text-xs font-semibold text-[#0b2f57]">Choose Excel file</span>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleExcelImport(e.target.files?.[0] || null)}
                />
              </label>
              {importing ? (
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <LoaderCircle size={14} className="animate-spin text-[#e30613]" />
                  Importing rows...
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="dash-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                  filter === tab.key ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              type="button"
              disabled={clearingAll || items.length === 0}
              onClick={clearAllItems}
              className="inline-flex items-center gap-1 rounded-md border border-[#fecdd3] bg-[#fff5f6] px-2 py-1 text-[11px] font-semibold text-[#e30613] disabled:opacity-50"
            >
              {clearingAll ? <LoaderCircle size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <LoaderCircle size={16} className="animate-spin text-[#e30613]" />
            Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">No {title.toLowerCase()} found.</p>
        ) : (
          <>
          <div className="dash-table-wrap">
            <table className="dash-table w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#fafbfd]">
                  <th>Name</th>
                  <th>Code</th>
                  {kind === "airport" ? <th>City</th> : null}
                  <th>Country</th>
                  <th>SEO & URL</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="font-semibold text-[#0b2f57]">{item.name}</td>
                    <td>{item.iata_code}</td>
                    {kind === "airport" ? <td>{(item as Airport).city}</td> : null}
                    <td>{item.country || "-"}</td>
                    <td className="max-w-[260px]">
                      <p className="font-semibold text-[#0b2f57]">{item.seo_title}</p>
                      <p className="mt-0.5 break-all text-[11px] text-slate-500">{item.page_url}</p>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(item.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => {
                            setEditing(item);
                            fillForm(item);
                            setMode("manual");
                          }}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title={item.status === "active" ? "Set pending" : "Activate"}
                          disabled={updatingId === item.id}
                          onClick={() => toggleStatus(item)}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                        >
                          {updatingId === item.id ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : item.status === "active" ? (
                            <Clock3 size={13} />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={updatingId === item.id}
                          onClick={() => deleteItem(item)}
                          className="rounded-md border border-[#fecdd3] bg-[#fff5f6] p-1.5 text-[#e30613]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length > ITEMS_PER_PAGE ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-500">
                Showing {page * ITEMS_PER_PAGE + 1}–
                {Math.min((page + 1) * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
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
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
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
    </DashboardShell>
  );
}
