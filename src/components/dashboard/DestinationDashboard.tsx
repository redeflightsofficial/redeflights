"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildDestinationSeo } from "@/lib/destination-meta";
import type { EntityStatus } from "@/types/airline";
import type { DestinationRecord } from "@/types/destination";
import {
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

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

export function DestinationDashboard() {
  const [records, setRecords] = useState<DestinationRecord[]>([]);
  const [aggregatedCount, setAggregatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [editing, setEditing] = useState<DestinationRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [packagesCount, setPackagesCount] = useState("0");
  const [popularScore, setPopularScore] = useState("70");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/destinations", { credentials: "same-origin" });
      const result = (await response.json()) as {
        records?: DestinationRecord[];
        aggregatedCount?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error || "Unable to load destinations.");
        return;
      }
      setRecords(result.records || []);
      setAggregatedCount(result.aggregatedCount || 0);
    } catch {
      setError("Network error while loading destinations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seoPreview = useMemo(() => {
    if (!title.trim() || !country.trim()) return null;
    return buildDestinationSeo(title, country, siteOrigin);
  }, [title, country]);

  useEffect(() => {
    if (!formOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetForm();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [formOpen]);

  const filteredRecords = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((item) => item.status === filter);
  }, [records, filter]);

  const activeCount = useMemo(
    () => records.filter((item) => item.status === "active").length,
    [records],
  );

  function resetForm(closeForm = true) {
    setTitle("");
    setCountry("");
    setImageUrl("");
    setPackagesCount("0");
    setPopularScore("70");
    setEditing(null);
    if (closeForm) setFormOpen(false);
  }

  function openForm() {
    resetForm(false);
    setFormOpen(true);
  }

  function fillForm(record: DestinationRecord) {
    setTitle(record.title);
    setCountry(record.country);
    setImageUrl(record.image_url || "");
    setPackagesCount(String(record.packages_count || 0));
    setPopularScore(String(record.popular_score || 0));
    setEditing(record);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      title,
      country,
      travel_styles: [],
      image_url: imageUrl,
      packages_count: packagesCount,
      popular_score: popularScore,
      ...(editing?.status ? { status: editing.status } : {}),
    };

    try {
      const response = await fetch(
        editing ? `/api/destinations/${editing.id}` : "/api/destinations",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        destination?: DestinationRecord;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.destination) {
        setError(result.error || "Unable to save destination.");
        return;
      }

      setRecords((current) =>
        editing
          ? current.map((item) => (item.id === result.destination!.id ? result.destination! : item))
          : [result.destination!, ...current],
      );
      setMessage(result.message || "Destination saved with auto SEO.");
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving destination.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(record: DestinationRecord) {
    const nextStatus: EntityStatus = record.status === "active" ? "pending" : "active";
    setUpdatingId(record.id);
    try {
      const response = await fetch("/api/destinations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, status: nextStatus }),
      });
      const result = (await response.json()) as { destination?: DestinationRecord; error?: string };
      if (!response.ok || !result.destination) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setRecords((current) =>
        current.map((row) => (row.id === record.id ? result.destination! : row)),
      );
      await loadData();
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRecord(record: DestinationRecord) {
    if (!confirm(`Delete ${record.title}?`)) return;
    setUpdatingId(record.id);
    try {
      const response = await fetch(`/api/destinations/${record.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete destination.");
        return;
      }
      setRecords((current) => current.filter((row) => row.id !== record.id));
      if (editing?.id === record.id) resetForm();
      await loadData();
    } catch {
      setError("Network error while deleting destination.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Destinations" breadcrumb="Home / Dashboard / Destinations">
      <div className={`transition-all duration-300 ${formOpen ? "pointer-events-none scale-[0.98] opacity-60" : ""}`}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Manual</p>
            <p className="text-base font-bold leading-none text-[#0b2f57]">{records.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Active</p>
            <p className="text-base font-bold leading-none text-[#166534]">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">All Sources</p>
            <p className="text-base font-bold leading-none text-[#0b2f57]">{aggregatedCount}</p>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="rounded-lg border border-[#fecdd3] bg-[#fff5f6] px-2.5 py-2 text-left shadow-sm transition hover:border-[#e30613]/40"
          >
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-[#e30613]">
                <Plus size={13} />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#e30613]">Manual</p>
                <p className="text-[11px] font-semibold text-[#0b2f57]">Add Destination</p>
              </div>
            </div>
          </button>
        </div>

        <p className="mb-3 rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs text-slate-600">
          Dropdowns auto-include destinations from hotels, visa, flights and airports. Add manual destinations here for featured content and SEO.
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
              {(["all", "pending", "active"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    filter === key
                      ? key === "active"
                        ? "bg-[#ecfdf3] text-[#166534] ring-1 ring-[#86efac]"
                        : key === "pending"
                          ? "bg-[#fff7ed] text-[#c2410c] ring-1 ring-[#fdba74]"
                          : "bg-[#0b2f57] text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {key === "all" ? "All" : key === "pending" ? "Pending" : "Active"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin text-[#e30613]" /> Loading...
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No manual destinations yet. Aggregated destinations still appear from hotels, visa and flights.
            </p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#fafbfd]">
                    <th>Destination</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="font-semibold text-[#0b2f57]">{record.title}</td>
                      <td>{record.country}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="text-[11px] text-slate-500">{formatDate(record.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fillForm(record)}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#0b2f57]"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(record)}
                            disabled={updatingId === record.id}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                          >
                            {record.status === "active" ? <Clock3 size={13} /> : <CheckCircle2 size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRecord(record)}
                            disabled={updatingId === record.id}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]"
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
          )}
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#042448]/45 p-3 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#0b2f57]">
                <FileText size={15} className="text-[#e30613]" />
                {editing ? "Edit Destination" : "Add Destination"}
              </h3>
              <button type="button" onClick={() => resetForm()} className="rounded-md p-1 text-slate-500 hover:text-[#e30613]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-600">Destination</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Bali, Indonesia"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]"
                    required
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-600">Country</span>
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="Indonesia"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]"
                    required
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-600">Image URL</span>
                  <input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Packages Count</span>
                  <input
                    value={packagesCount}
                    onChange={(event) => setPackagesCount(event.target.value)}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Popular Score</span>
                  <input
                    value={popularScore}
                    onChange={(event) => setPopularScore(event.target.value)}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-[#e30613]"
                  />
                </label>
              </div>

              {seoPreview ? (
                <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-3 text-xs text-slate-600">
                  <p className="font-bold text-[#0b2f57]">SEO Preview</p>
                  <p className="mt-1 font-semibold text-[#e30613]">{seoPreview.seo_title}</p>
                  <p className="mt-1">{seoPreview.meta_description}</p>
                  <p className="mt-1 break-all text-[11px] text-slate-500">{seoPreview.page_url}</p>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-2 text-xs font-bold text-white disabled:opacity-70"
                >
                  {saving ? <LoaderCircle size={13} className="animate-spin" /> : null}
                  {editing ? "Update Destination" : "Save Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
