"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { includesToText, normalizePackageTitle, parseIncludesInput } from "@/lib/package-meta";
import type { EntityStatus } from "@/types/airline";
import type { TourPackage } from "@/types/tour-package";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const ITEMS_PER_PAGE = 5;
const regionOptions = ["Europe", "Asia", "Middle East", "Africa", "Americas"];
const themeOptions = ["Family", "Honeymoon", "Adventure", "Beach", "Luxury"];
const tagOptions = ["Best Seller", "Popular", "Trending", "Hot Deal", "Luxury", "Family"];

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

export function PackageDashboard() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<TourPackage | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Popular");
  const [route, setRoute] = useState("");
  const [duration, setDuration] = useState("");
  const [region, setRegion] = useState("Asia");
  const [theme, setTheme] = useState("Family");
  const [includes, setIncludes] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/packages", { credentials: "same-origin" });
      const result = (await response.json()) as { packages?: TourPackage[]; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to load tour packages.");
        return;
      }
      setPackages(result.packages || []);
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const filteredPackages = useMemo(() => {
    if (filter === "all") return packages;
    return packages.filter((item) => item.status === filter);
  }, [packages, filter]);

  const pendingCount = useMemo(
    () => packages.filter((item) => item.status === "pending").length,
    [packages],
  );
  const activeCount = useMemo(
    () => packages.filter((item) => item.status === "active").length,
    [packages],
  );
  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / ITEMS_PER_PAGE));
  const paginatedPackages = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  function setUploadFile(nextFile: File | null) {
    setImageFile(nextFile);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  function resetForm(closeForm = true) {
    setTitle("");
    setTag("Popular");
    setRoute("");
    setDuration("");
    setRegion("Asia");
    setTheme("Family");
    setIncludes("");
    setSortOrder("0");
    setUploadFile(null);
    setEditing(null);
    if (closeForm) setFormOpen(false);
  }

  function openForm() {
    resetForm(false);
    setFormOpen(true);
  }

  function fillForm(tourPackage: TourPackage) {
    setTitle(normalizePackageTitle(tourPackage.title));
    setTag(tourPackage.tag);
    setRoute(tourPackage.route);
    setDuration(tourPackage.duration);
    setRegion(tourPackage.region);
    setTheme(tourPackage.theme);
    setIncludes(includesToText(tourPackage.includes || []));
    setSortOrder(String(tourPackage.sort_order || 0));
    setImageFile(null);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(tourPackage.image_url || null);
    setEditing(tourPackage);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const cleanTitle = normalizePackageTitle(title);
    if (!cleanTitle) {
      setError("Package title is required.");
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", cleanTitle);
    formData.append("tag", tag);
    formData.append("route", route);
    formData.append("duration", duration);
    formData.append("region", region);
    formData.append("theme", theme);
    formData.append("includes", includes);
    formData.append("sort_order", sortOrder);
    if (imageFile) formData.append("file", imageFile);

    try {
      const response = await fetch(editing ? `/api/packages/${editing.id}` : "/api/packages", {
        method: editing ? "PATCH" : "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = (await response.json()) as {
        package?: TourPackage;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.package) {
        setError(result.error || "Unable to save tour package.");
        return;
      }

      setPackages((current) =>
        editing
          ? current.map((item) => (item.id === result.package!.id ? result.package! : item))
          : [result.package!, ...current],
      );
      setMessage(result.message || "Tour package saved successfully.");
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(tourPackage: TourPackage) {
    const nextStatus: EntityStatus = tourPackage.status === "active" ? "pending" : "active";
    setUpdatingId(tourPackage.id);
    setError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tourPackage.id, status: nextStatus }),
      });
      const result = (await response.json()) as { package?: TourPackage; error?: string };
      if (!response.ok || !result.package) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setPackages((current) =>
        current.map((item) => (item.id === result.package!.id ? result.package! : item)),
      );
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(tourPackage: TourPackage) {
    if (!confirm(`Delete ${tourPackage.title}?`)) return;
    setUpdatingId(tourPackage.id);
    setError(null);
    try {
      const response = await fetch(`/api/packages/${tourPackage.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to delete package.");
        return;
      }
      setPackages((current) => current.filter((item) => item.id !== tourPackage.id));
      setMessage("Tour package deleted.");
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Tour Packages" breadcrumb="Products / Tour Packages">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-lg font-extrabold text-[#0b2f57]">{packages.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active</p>
            <p className="text-lg font-extrabold text-[#166534]">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pending</p>
            <p className="text-lg font-extrabold text-[#c2410c]">{pendingCount}</p>
          </div>
          <button
            type="button"
            onClick={openForm}
            className="rounded-lg border border-[#fecdd3] bg-[#fff5f6] px-2.5 py-2 text-left shadow-sm transition hover:border-[#e30613]/40"
          >
            <p className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e30613]">
              <Plus size={13} /> Add Package
            </p>
          </button>
        </div>

        {message ? (
          <p className="rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#166534]">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-[#fff5f6] px-3 py-2 text-sm font-medium text-[#e30613]">{error}</p>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {(["all", "active", "pending"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    filter === item
                      ? "bg-[#0b2f57] text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item === "all" ? "All" : item === "active" ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" /> Loading packages...
            </div>
          ) : paginatedPackages.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No tour packages yet. Add your first package.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Package</th>
                      <th className="px-3 py-2">Region</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Updated</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPackages.map((tourPackage) => (
                      <tr key={tourPackage.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {tourPackage.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tourPackage.image_url}
                                alt={tourPackage.title}
                                className="h-10 w-14 rounded object-cover"
                              />
                            ) : (
                              <div className="grid h-10 w-14 place-items-center rounded bg-slate-100 text-[10px] text-slate-400">
                                No img
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#0b2f57]">
                                {normalizePackageTitle(tourPackage.title)}
                              </p>
                              <p className="text-[10px] text-slate-500">{tourPackage.tag}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{tourPackage.region}</td>
                        <td className="px-3 py-2 text-slate-600">{tourPackage.duration}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(tourPackage.status)}`}>
                            {tourPackage.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(tourPackage.created_at)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => fillForm(tourPackage)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === tourPackage.id}
                              onClick={() => toggleStatus(tourPackage)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                            >
                              {updatingId === tourPackage.id ? (
                                <LoaderCircle size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === tourPackage.id}
                              onClick={() => handleDelete(tourPackage)}
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

              {filteredPackages.length > ITEMS_PER_PAGE ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
                  <p className="text-[11px] text-slate-500">
                    Showing {page * ITEMS_PER_PAGE + 1}–
                    {Math.min((page + 1) * ITEMS_PER_PAGE, filteredPackages.length)} of {filteredPackages.length}
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

      {formOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label="Close add package panel"
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={() => resetForm()}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#0b2f57]">
                  {editing ? "Edit Tour Package" : "Add Tour Package"}
                </p>
                <p className="text-[11px] text-slate-500">Saved directly to Supabase database</p>
              </div>
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-[#e30613]"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div>
                  <label htmlFor="package-title" className="block text-sm font-semibold text-slate-700">
                    Package Title
                  </label>
                  <input
                    id="package-title"
                    name="package-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Romantic Europe Getaway"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </div>

                <div>
                  <label htmlFor="package-tag" className="block text-sm font-semibold text-slate-700">
                    Badge Tag
                  </label>
                  <select
                    id="package-tag"
                    name="package-tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  >
                    {tagOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="package-route" className="block text-sm font-semibold text-slate-700">
                    Route / Cities
                  </label>
                  <input
                    id="package-route"
                    name="package-route"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    autoComplete="off"
                    placeholder="Paris · Switzerland · Italy"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </div>

                <div>
                  <label htmlFor="package-duration" className="block text-sm font-semibold text-slate-700">
                    Duration
                  </label>
                  <input
                    id="package-duration"
                    name="package-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    autoComplete="off"
                    placeholder="7 Days / 6 Nights"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="package-region" className="block text-sm font-semibold text-slate-700">
                      Region
                    </label>
                    <select
                      id="package-region"
                      name="package-region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                    >
                      {regionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="package-theme" className="block text-sm font-semibold text-slate-700">
                      Theme
                    </label>
                    <select
                      id="package-theme"
                      name="package-theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                    >
                      {themeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="package-includes" className="block text-sm font-semibold text-slate-700">
                    Includes
                  </label>
                  <input
                    id="package-includes"
                    name="package-includes"
                    value={includes}
                    onChange={(e) => setIncludes(e.target.value)}
                    autoComplete="off"
                    placeholder="Flight, Hotel, Meals, Sightseeing"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </div>

                <div>
                  <label htmlFor="package-sort-order" className="block text-sm font-semibold text-slate-700">
                    Sort Order
                  </label>
                  <input
                    id="package-sort-order"
                    name="package-sort-order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Package Image {editing ? "" : <span className="text-[#e30613]">*</span>}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group mt-1.5 flex w-full flex-col overflow-hidden rounded-md border-2 border-dashed border-slate-200 bg-[#fafbfd] text-left transition hover:border-[#e30613]/40"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-white">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="Package preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-slate-500">
                          <ImagePlus size={22} className="text-[#e30613]" />
                          <p className="text-xs font-semibold">Upload image</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG or WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-[#0b2f57] group-hover:text-[#e30613]">
                      {imagePreview ? "Change Image" : "Choose Image"}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!editing && !imageFile)}
                  className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
                >
                  {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                  {editing ? "Update Package" : "Add Package"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
