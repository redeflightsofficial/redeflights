"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildAirlineSeo } from "@/lib/airline-meta";
import { buildAirportSeo } from "@/lib/airport-meta";
import type { Airline, EntityStatus } from "@/types/airline";
import type { Airport } from "@/types/airport";
import {
  CheckCircle2,
  Clock3,
  FileUp,
  LoaderCircle,
  MapPinned,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Tab = "airlines" | "airports";
type AddType = "airline" | "airport";

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

export function FlightDataDashboard() {
  const [tab, setTab] = useState<Tab>("airlines");
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [addType, setAddType] = useState<AddType>("airline");
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [iataCode, setIataCode] = useState("");
  const [icaoCode, setIcaoCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [airlineRes, airportRes] = await Promise.all([
        fetch("/api/airlines"),
        fetch("/api/airports"),
      ]);
      const airlineJson = (await airlineRes.json()) as { airlines?: Airline[]; error?: string };
      const airportJson = (await airportRes.json()) as { airports?: Airport[]; error?: string };

      if (!airlineRes.ok || !airportRes.ok) {
        setError(airlineJson.error || airportJson.error || "Unable to load data.");
        return;
      }

      setAirlines(airlineJson.airlines || []);
      setAirports(airportJson.airports || []);
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items = tab === "airlines" ? airlines : airports;
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

  const seoPreview = useMemo(() => {
    if (!name.trim() || !iataCode.trim()) return null;
    if (addType === "airline") return buildAirlineSeo(name, iataCode, country, siteOrigin);
    if (!city.trim()) return null;
    return buildAirportSeo(name, iataCode, city, country, siteOrigin);
  }, [addType, name, iataCode, city, country]);

  function resetForm() {
    setName("");
    setIataCode("");
    setIcaoCode("");
    setCity("");
    setCountry("");
    setEditingAirline(null);
    setEditingAirport(null);
  }

  async function handleExcelImport(file: File | null) {
    if (!file || importing) return;
    setImporting(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/flight-data/import", { method: "POST", body: formData });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
        importedAirlines?: number;
        importedAirports?: number;
      };

      if (!response.ok) {
        setError(result.error || "Excel import failed.");
        return;
      }

      setMessage(
        result.message ||
          `Imported ${result.importedAirlines || 0} airlines and ${result.importedAirports || 0} airports.`,
      );
      await loadData();
    } catch {
      setError("Network error during Excel import.");
    } finally {
      setImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = "";
    }
  }

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const apiBase = addType === "airline" ? "/api/airlines" : "/api/airports";
    const editing = addType === "airline" ? editingAirline : editingAirport;
    const payload =
      addType === "airline"
        ? { name, iata_code: iataCode, icao_code: icaoCode, country }
        : { name, iata_code: iataCode, city, country };

    try {
      const response = await fetch(editing ? `${apiBase}/${editing.id}` : apiBase, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        airline?: Airline;
        airport?: Airport;
        error?: string;
        message?: string;
      };

      const saved = addType === "airline" ? result.airline : result.airport;
      if (!response.ok || !saved) {
        setError(result.error || "Unable to save.");
        return;
      }

      if (addType === "airline") {
        setAirlines((current) =>
          editing ? current.map((item) => (item.id === saved.id ? (saved as Airline) : item)) : [saved as Airline, ...current],
        );
        setTab("airlines");
      } else {
        setAirports((current) =>
          editing ? current.map((item) => (item.id === saved.id ? (saved as Airport) : item)) : [saved as Airport, ...current],
        );
        setTab("airports");
      }

      setMessage(result.message || "Saved with auto SEO and URL.");
      resetForm();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: Airline | Airport) {
    const apiBase = tab === "airlines" ? "/api/airlines" : "/api/airports";
    const nextStatus: EntityStatus = item.status === "active" ? "pending" : "active";
    setUpdatingId(item.id);
    try {
      const response = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const result = (await response.json()) as { airline?: Airline; airport?: Airport; error?: string };
      const updated = tab === "airlines" ? result.airline : result.airport;
      if (!response.ok || !updated) {
        setError(result.error || "Unable to update status.");
        return;
      }
      if (tab === "airlines") {
        setAirlines((current) => current.map((row) => (row.id === item.id ? (updated as Airline) : row)));
      } else {
        setAirports((current) => current.map((row) => (row.id === item.id ? (updated as Airport) : row)));
      }
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteItem(item: Airline | Airport) {
    if (!confirm(`Delete ${item.name}?`)) return;
    const apiBase = tab === "airlines" ? "/api/airlines" : "/api/airports";
    setUpdatingId(item.id);
    try {
      const response = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete.");
        return;
      }
      if (tab === "airlines") {
        setAirlines((current) => current.filter((row) => row.id !== item.id));
      } else {
        setAirports((current) => current.filter((row) => row.id !== item.id));
      }
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  function startEdit(item: Airline | Airport) {
    setName(item.name);
    setIataCode(item.iata_code);
    setCountry(item.country || "");
    if (tab === "airlines") {
      setAddType("airline");
      setEditingAirline(item as Airline);
      setEditingAirport(null);
      setIcaoCode((item as Airline).icao_code || "");
      setCity("");
    } else {
      setAddType("airport");
      setEditingAirport(item as Airport);
      setEditingAirline(null);
      setCity((item as Airport).city);
      setIcaoCode("");
    }
  }

  return (
    <DashboardShell title="Airlines & Airports" breadcrumb="Home / Dashboard / Airlines & Airports">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="dash-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Airlines</p>
          <p className="text-lg font-bold text-[#0b2f57]">{airlines.length}</p>
        </div>
        <div className="dash-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Airports</p>
          <p className="text-lg font-bold text-[#0b2f57]">{airports.length}</p>
        </div>
        <div className="dash-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="text-lg font-bold text-[#c2410c]">{stats.pending}</p>
        </div>
        <div className="dash-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active</p>
          <p className="text-lg font-bold text-[#166534]">{stats.active}</p>
        </div>
      </div>

      {message ? (
        <p className="mb-3 rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#166534]">{message}</p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-[#fff5f6] px-3 py-2 text-sm font-medium text-[#e30613]">{error}</p>
      ) : null}

      <div className="dash-card mb-3 overflow-hidden">
        <div className="border-b border-slate-200 bg-[#fafbfd] px-3 py-2">
          <p className="text-xs font-bold text-[#0b2f57]">
            <FileUp size={13} className="mr-1 inline text-[#e30613]" />
            Excel Upload — auto import airlines & airports
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Supports Country / From Country / To Country columns with cities, airlines and IATA codes.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-[#fafbfd]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fff5f6] text-[#e30613]">
            {importing ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0b2f57]">
              {importing ? "Importing..." : "Choose Excel file (.xlsx, .xls, .csv)"}
            </p>
            <p className="text-[11px] text-slate-500">File select hote hi data auto import ho jayega</p>
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
      </div>

      <div className="dash-card mb-3 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setAddType("airline"); resetForm(); }}
            className={`flex-1 px-3 py-2 text-xs font-bold ${addType === "airline" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}
          >
            <Plane size={13} className="mr-1 inline" /> Add Airline
          </button>
          <button
            type="button"
            onClick={() => { setAddType("airport"); resetForm(); }}
            className={`flex-1 px-3 py-2 text-xs font-bold ${addType === "airport" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}
          >
            <MapPinned size={13} className="mr-1 inline" /> Add Airport
          </button>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40" />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              IATA Code
              <input value={iataCode} onChange={(e) => setIataCode(e.target.value.toUpperCase())} required className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40" />
            </label>
            {addType === "airline" ? (
              <label className="block text-xs font-semibold text-slate-600">
                ICAO Code
                <input value={icaoCode} onChange={(e) => setIcaoCode(e.target.value.toUpperCase())} className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40" />
              </label>
            ) : (
              <label className="block text-xs font-semibold text-slate-600">
                City
                <input value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40" />
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-600">
              Country
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#e30613]/40" />
            </label>
          </div>

          {seoPreview ? (
            <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-2.5 text-[11px] text-slate-600">
              <p className="font-bold text-[#e30613]">Auto SEO</p>
              <p className="mt-1 break-all"><span className="font-semibold text-[#0b2f57]">URL:</span> {seoPreview.page_url}</p>
              <p className="mt-0.5"><span className="font-semibold text-[#0b2f57]">Title:</span> {seoPreview.seo_title}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            {(editingAirline || editingAirport) ? (
              <button type="button" onClick={resetForm} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <X size={13} className="mr-1 inline" /> Cancel
              </button>
            ) : null}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70">
              {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
              {(editingAirline || editingAirport) ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>

      <div className="dash-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <div className="flex gap-1">
            <button type="button" onClick={() => setTab("airlines")} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${tab === "airlines" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}>
              Airlines ({airlines.length})
            </button>
            <button type="button" onClick={() => setTab("airports")} className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${tab === "airports" ? "bg-[#fff5f6] text-[#e30613]" : "text-slate-500"}`}>
              Airports ({airports.length})
            </button>
            {(["all", "pending", "active"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-md px-2.5 py-1 text-[11px] font-bold capitalize ${filter === key ? "bg-slate-100 text-[#0b2f57]" : "text-slate-500"}`}>
                {key}
              </button>
            ))}
          </div>
          <button type="button" onClick={loadData} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <LoaderCircle size={16} className="animate-spin text-[#e30613]" /> Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">No {tab} found. Upload Excel or add manually.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 bg-[#fafbfd]">
                  <th>Name</th>
                  <th>Code</th>
                  {tab === "airports" ? <th>City</th> : null}
                  <th>Country</th>
                  <th>Page URL</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="font-semibold text-[#0b2f57]">{item.name}</td>
                    <td>{item.iata_code}</td>
                    {tab === "airports" ? <td>{(item as Airport).city}</td> : null}
                    <td>{item.country || "-"}</td>
                    <td className="max-w-[220px] break-all text-[11px] text-slate-500">{item.page_url}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(item.status)}`}>{item.status}</span></td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(item.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => startEdit(item)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]"><Pencil size={13} /></button>
                        <button type="button" disabled={updatingId === item.id} onClick={() => toggleStatus(item)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]">
                          {updatingId === item.id ? <LoaderCircle size={13} className="animate-spin" /> : item.status === "active" ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
                        </button>
                        <button type="button" disabled={updatingId === item.id} onClick={() => deleteItem(item)} className="rounded-md border border-[#fecdd3] bg-[#fff5f6] p-1.5 text-[#e30613]"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
