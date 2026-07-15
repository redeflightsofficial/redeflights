"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildVisaSeo } from "@/lib/visa-meta";
import type { EntityStatus } from "@/types/airline";
import type { Visa } from "@/types/visa";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const ITEMS_PER_PAGE = 5;

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

export function VisaDashboard() {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Visa | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [country, setCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [processingTime, setProcessingTime] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/visas", { credentials: "same-origin" });
      const result = (await response.json()) as { visas?: Visa[]; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to load visa services.");
        return;
      }
      setVisas(result.visas || []);
    } catch {
      setError("Network error while loading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seoPreview = useMemo(() => {
    if (!country.trim()) return null;
    return buildVisaSeo(country, visaType, processingTime, siteOrigin);
  }, [country, visaType, processingTime]);

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

  const filteredVisas = useMemo(() => {
    if (filter === "all") return visas;
    return visas.filter((item) => item.status === filter);
  }, [visas, filter]);

  const pendingCount = useMemo(() => visas.filter((item) => item.status === "pending").length, [visas]);
  const activeCount = useMemo(() => visas.filter((item) => item.status === "active").length, [visas]);
  const totalPages = Math.max(1, Math.ceil(filteredVisas.length / ITEMS_PER_PAGE));
  const paginatedVisas = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredVisas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVisas, page]);

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
    setCountry("");
    setVisaType("");
    setProcessingTime("");
    setDescription("");
    setUploadFile(null);
    setEditing(null);
    if (closeForm) setFormOpen(false);
  }

  function openForm() {
    resetForm(false);
    setFormOpen(true);
  }

  function fillForm(visa: Visa) {
    setCountry(visa.country);
    setVisaType(visa.visa_type || "");
    setProcessingTime(visa.processing_time || "");
    setDescription(visa.description || "");
    setImageFile(null);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(visa.image_url || null);
    setEditing(visa);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("country", country);
    formData.append("visa_type", visaType);
    formData.append("processing_time", processingTime);
    formData.append("description", description);
    if (imageFile) formData.append("file", imageFile);

    try {
      const response = await fetch(editing ? `/api/visas/${editing.id}` : "/api/visas", {
        method: editing ? "PATCH" : "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        visa?: Visa;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.visa) {
        setError(result.error || "Unable to save visa service.");
        return;
      }

      setVisas((current) =>
        editing
          ? current.map((item) => (item.id === result.visa!.id ? result.visa! : item))
          : [result.visa!, ...current],
      );
      setMessage(result.message || "Visa service saved with auto SEO and image.");
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(visa: Visa) {
    const nextStatus: EntityStatus = visa.status === "active" ? "pending" : "active";
    setUpdatingId(visa.id);
    try {
      const response = await fetch("/api/visas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: visa.id, status: nextStatus }),
      });
      const result = (await response.json()) as { visa?: Visa; error?: string };
      if (!response.ok || !result.visa) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setVisas((current) => current.map((row) => (row.id === visa.id ? result.visa! : row)));
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteVisa(visa: Visa) {
    if (!confirm(`Delete ${visa.country}${visa.visa_type ? ` ${visa.visa_type}` : ""} visa service?`)) return;
    setUpdatingId(visa.id);
    try {
      const response = await fetch(`/api/visas/${visa.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete.");
        return;
      }
      setVisas((current) => current.filter((row) => row.id !== visa.id));
      if (editing?.id === visa.id) resetForm();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Visa Services" breadcrumb="Home / Dashboard / Visa">
      <div className={`transition-all duration-300 ${formOpen ? "pointer-events-none scale-[0.98] opacity-60" : ""}`}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#fff5f6] text-[#e30613]">
                <FileText size={13} />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Visa Services</p>
                <p className="text-base font-bold leading-none text-[#0b2f57]">{visas.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Active</p>
            <p className="text-base font-bold leading-none text-[#166534]">{activeCount}</p>
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
                <p className="text-[11px] font-semibold text-[#0b2f57]">Add Visa</p>
              </div>
            </div>
          </button>
        </div>

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
                  {key === "all" ? "All Visas" : key === "pending" ? "Pending" : "Active"}
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
          ) : filteredVisas.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No visa services yet. Add manually from the button above.
            </p>
          ) : (
            <>
              <div className="dash-table-wrap">
                <table className="dash-table w-full min-w-[960px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#fafbfd]">
                      <th>Country</th>
                      <th>Type</th>
                      <th>Processing</th>
                      <th>H1</th>
                      <th>Meta</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVisas.map((visa) => (
                      <tr key={visa.id} className="border-b border-slate-100">
                        <td className="font-semibold text-[#0b2f57]">{visa.country}</td>
                        <td>{visa.visa_type || "-"}</td>
                        <td className="text-[11px] text-slate-600">{visa.processing_time || "-"}</td>
                        <td className="max-w-[180px] text-[11px] text-slate-600">
                          {visa.status === "active" && visa.slug ? (
                            <Link
                              href={`/visa/${visa.slug}`}
                              target="_blank"
                              className="font-semibold text-[#0b2f57] hover:text-[#e30613]"
                            >
                              {visa.h1_heading}
                            </Link>
                          ) : (
                            visa.h1_heading || "-"
                          )}
                        </td>
                        <td className="max-w-[200px] text-[11px] text-slate-500">
                          {visa.meta_description.length > 72
                            ? `${visa.meta_description.slice(0, 72)}…`
                            : visa.meta_description}
                        </td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(visa.status)}`}>
                            {visa.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-slate-500">{formatDate(visa.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => fillForm(visa)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]">
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === visa.id}
                              onClick={() => toggleStatus(visa)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                            >
                              {updatingId === visa.id ? (
                                <LoaderCircle size={13} className="animate-spin" />
                              ) : visa.status === "active" ? (
                                <Clock3 size={13} />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === visa.id}
                              onClick={() => deleteVisa(visa)}
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

              {filteredVisas.length > ITEMS_PER_PAGE ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
                  <p className="text-[11px] text-slate-500">
                    Showing {page * ITEMS_PER_PAGE + 1}–
                    {Math.min((page + 1) * ITEMS_PER_PAGE, filteredVisas.length)} of {filteredVisas.length}
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
            aria-label="Close add visa panel"
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={() => resetForm()}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[400px] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#0b2f57]">
                  {editing ? "Edit Visa Service" : "Add Visa Service"}
                </p>
                <p className="text-[11px] text-slate-500">Auto SEO on save</p>
              </div>
              <button type="button" onClick={() => resetForm()} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-[#e30613]">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Country
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    placeholder="USA"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Visa Type <span className="font-normal text-slate-400">(optional)</span>
                  <input
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    placeholder="Tourist, Business, etc."
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Processing Time
                  <input
                    value={processingTime}
                    onChange={(e) => setProcessingTime(e.target.value)}
                    placeholder="7-10 working days"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Visa Image <span className="font-normal text-slate-400">(optional)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group mt-1.5 flex w-full flex-col overflow-hidden rounded-md border-2 border-dashed border-slate-200 bg-[#fafbfd] text-left transition hover:border-[#e30613]/40"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-white">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt="Visa preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-slate-500">
                          <ImagePlus size={22} className="text-[#e30613]" />
                          <p className="text-xs font-semibold">Choose image</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG or WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-[#0b2f57] group-hover:text-[#e30613]">
                      {imagePreview ? "Change Image" : "Upload Image"}
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
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Short service description"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>

                {seoPreview ? (
                  <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-2.5 text-[10px] leading-relaxed text-slate-600">
                    <p className="font-bold text-[#e30613]">Auto SEO Preview</p>
                    <p className="mt-1 break-words"><span className="font-semibold text-[#0b2f57]">H1:</span> {seoPreview.h1_heading}</p>
                    <p className="mt-0.5 break-words"><span className="font-semibold text-[#0b2f57]">Title:</span> {seoPreview.seo_title}</p>
                    <p className="mt-0.5 break-words"><span className="font-semibold text-[#0b2f57]">Meta:</span> {seoPreview.meta_description}</p>
                    <p className="mt-0.5 break-all"><span className="font-semibold text-[#0b2f57]">URL:</span> {seoPreview.page_url}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
                <button type="button" onClick={() => resetForm()} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-70"
                >
                  {saving ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
                  {editing ? "Update" : "Add Visa"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
