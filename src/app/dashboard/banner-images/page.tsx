"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  buildBannerMetaFromFileName,
  getBannerSeoFields,
  type BannerMeta,
  type BannerUrlOptions,
} from "@/lib/banner-meta";

const bannerUrlOptions: BannerUrlOptions = {
  siteOrigin:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : ""),
};
import type { Banner, BannerStatus } from "@/types/banner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImagePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const BANNERS_PER_PAGE = 3;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusStyle(status: BannerStatus) {
  return status === "active"
    ? "bg-[#ecfdf3] text-[#166534]"
    : "bg-[#fff7ed] text-[#c2410c]";
}

export default function BannerImagesPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | BannerStatus>("all");
  const [page, setPage] = useState(0);
  const [autoMeta, setAutoMeta] = useState<BannerMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setUploadFile(nextFile: File | null) {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);

    if (nextFile) {
      const meta = buildBannerMetaFromFileName(nextFile.name, bannerUrlOptions);
      setAutoMeta(meta);
      setAlt(meta.alt);
    } else {
      setAutoMeta(null);
      setAlt("");
    }
  }

  function setEditUploadFile(nextFile: File | null) {
    setEditFile(nextFile);
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function loadBanners() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/banners");
      const result = (await response.json()) as {
        banners?: Banner[];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Unable to load banners.");
        setBanners([]);
        return;
      }

      setBanners(result.banners || []);
    } catch {
      setError("Network error while loading banners.");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  const stats = useMemo(
    () => ({
      total: banners.length,
      pending: banners.filter((item) => item.status === "pending").length,
      active: banners.filter((item) => item.status === "active").length,
    }),
    [banners],
  );

  const filteredBanners = useMemo(() => {
    if (filter === "all") return banners;
    return banners.filter((item) => item.status === filter);
  }, [banners, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredBanners.length / BANNERS_PER_PAGE));

  const paginatedBanners = useMemo(() => {
    const start = page * BANNERS_PER_PAGE;
    return filteredBanners.slice(start, start + BANNERS_PER_PAGE);
  }, [filteredBanners, page]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  useEffect(() => {
    if (!editingBanner) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditModal();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingBanner]);

  const filterTabs: { key: "all" | BannerStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "active", label: "Active", count: stats.active },
  ];

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Please choose a banner image to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", alt);

      const response = await fetch("/api/banners", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        banner?: Banner;
      };

      if (!response.ok || !result.banner) {
        setError(result.error || "Unable to upload banner.");
        return;
      }

      setBanners((current) => [result.banner!, ...current]);
      setMessage(result.message || "Banner uploaded successfully.");
      setUploadFile(null);
      setAutoMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Network error while uploading banner.");
    } finally {
      setUploading(false);
    }
  }

  function openEditModal(banner: Banner) {
    setEditingBanner(banner);
    setEditAlt(banner.alt);
    setEditUploadFile(null);
    setError(null);
  }

  function closeEditModal() {
    setEditingBanner(null);
    setEditAlt("");
    setEditUploadFile(null);
  }

  async function handleEditSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editingBanner) return;

    setUpdatingId(editingBanner.id);
    setError(null);
    setMessage(null);

    try {
      let response: Response;

      if (editFile) {
        const formData = new FormData();
        formData.append("alt", editAlt);
        formData.append("file", editFile);
        response = await fetch(`/api/banners/${editingBanner.id}`, {
          method: "PATCH",
          body: formData,
        });
      } else {
        response = await fetch(`/api/banners/${editingBanner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alt: editAlt }),
        });
      }

      const result = (await response.json()) as { banner?: Banner; error?: string };

      if (!response.ok || !result.banner) {
        setError(result.error || "Unable to update banner.");
        return;
      }

      setBanners((current) =>
        current.map((item) => (item.id === editingBanner.id ? result.banner! : item)),
      );
      setMessage("Banner updated successfully.");
      closeEditModal();
    } catch {
      setError("Network error while updating banner.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateStatus(id: string, status: BannerStatus) {
    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = (await response.json()) as { banner?: Banner; error?: string };

      if (!response.ok || !result.banner) {
        setError(result.error || "Unable to update banner status.");
        return;
      }

      setBanners((current) =>
        current.map((item) => (item.id === id ? result.banner! : item)),
      );
    } catch {
      setError("Network error while updating banner.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("Delete this banner permanently? Image will be removed completely.")) return;

    setUpdatingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Unable to delete banner.");
        return;
      }

      setBanners((current) => current.filter((item) => item.id !== id));
      setMessage("Banner and image deleted completely.");
    } catch {
      setError("Network error while deleting banner.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Banner Images" breadcrumb="Home / Dashboard / Banner Images">
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Banners", value: stats.total, tone: "text-[#0b2f57]" },
          { label: "Pending Banners", value: stats.pending, tone: "text-[#c2410c]" },
          { label: "Active Banners", value: stats.active, tone: "text-[#166534]" },
        ].map((item) => (
          <div key={item.label} className="dash-stat rounded-xl px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="dash-card mb-5 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">Upload Banner</p>
          <h2 className="mt-0.5 text-base font-bold text-[#0b2f57]">Add New Promo Banner</h2>
        </div>

        <form
          onSubmit={handleUpload}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-4 sm:p-5"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex shrink-0 flex-col overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-[#fafbfd] text-left transition hover:border-[#e30613]/40 sm:w-[200px]"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-white">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-slate-500">
                  <ImagePlus className="h-6 w-6 text-[#e30613]" />
                  <p className="text-xs font-semibold">Choose image</p>
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-[#0b2f57] group-hover:text-[#e30613]">
              Select Image
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
          />

          <div className="min-w-0 flex-1 space-y-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Alt Text</span>
              <input
                type="text"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
                placeholder="REDE I FLIGHTS Promotion"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0b2f57] outline-none focus:border-[#e30613]"
              />
            </label>
            <p className="text-xs text-slate-500">
              Name file like Excel: <strong>dubai-kochi.jpg</strong>. Image URL becomes{" "}
              <strong>yoursite.com/dubai-kochi.jpg</strong>
            </p>
            {autoMeta ? (
              <div className="rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs text-slate-600">
                <p>
                  <span className="font-bold text-[#0b2f57]">Image URL:</span>{" "}
                  <code className="break-all text-[#e30613]">{autoMeta.imageUrl}</code>
                </p>
                <p className="mt-1">
                  <span className="font-bold text-[#0b2f57]">Slug:</span>{" "}
                  <code>{autoMeta.slug}</code>
                </p>
                <p className="mt-2 border-t border-slate-200 pt-2">
                  <span className="font-bold text-[#0b2f57]">SEO Title:</span> {autoMeta.seoTitle}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-[#0b2f57]">Meta Description:</span>{" "}
                  {autoMeta.metaDescription}
                </p>
                <p className="mt-1">
                  <span className="font-bold text-[#0b2f57]">H1 Heading:</span> {autoMeta.h1Heading}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="btn-premium inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#e30613] px-5 text-sm font-semibold text-white hover:bg-[#c40010] disabled:opacity-70"
          >
            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
        </form>
      </div>

      <div className="dash-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">Banner List</p>
            <h2 className="mt-1 text-lg font-bold text-[#0b2f57]">Manage Banners</h2>
          </div>
          <button
            type="button"
            onClick={loadBanners}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b2f57] transition hover:border-[#e30613]/40"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {message ? (
          <p className="mx-5 mt-4 rounded-xl bg-[#ecfdf3] px-4 py-3 text-sm font-medium text-[#166534]">{message}</p>
        ) : null}
        {error ? (
          <p className="mx-5 mt-4 rounded-xl bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#e30613]">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === tab.key
                  ? "bg-[#e30613] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#e30613]" />
            Loading banners...
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#0b2f57]">
              <ImagePlus className="h-6 w-6" />
            </div>
            <p className="mt-4 text-lg font-bold text-[#0b2f57]">No banners found</p>
            <p className="mt-2 text-sm text-slate-500">
              {filter === "all"
                ? "Upload a banner using the form above."
                : `No ${filter} banners right now.`}
            </p>
          </div>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f8fafc]">
                    <th className="px-4 py-3 sm:px-5">Preview</th>
                    <th className="px-4 py-3 sm:px-5">Banner & SEO</th>
                    <th className="hidden px-4 py-3 md:table-cell sm:px-5">Image URL</th>
                    <th className="px-4 py-3 sm:px-5">Status</th>
                    <th className="px-4 py-3 sm:px-5">Uploaded</th>
                    <th className="px-4 py-3 sm:px-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBanners.map((item) => {
                    const seo = getBannerSeoFields(item, bannerUrlOptions);
                    return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 align-middle transition hover:bg-[#fafbfd]"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <div className="w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white sm:w-[140px]">
                          <div className="relative aspect-[16/9] w-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.alt}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-semibold text-[#0b2f57]">{seo.h1Heading}</p>
                        <p className="mt-1 text-xs text-slate-500">{seo.seoTitle}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{seo.metaDescription}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400 md:hidden">
                          {seo.imageUrl}
                        </p>
                      </td>
                      <td className="hidden max-w-[220px] px-4 py-3 md:table-cell sm:px-5">
                        <p className="truncate text-xs text-slate-500" title={seo.imageUrl}>
                          {seo.imageUrl}
                        </p>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyle(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500 sm:px-5">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => openEditModal(item)}
                            className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-[#0b2f57] hover:border-[#e30613]/40 disabled:opacity-60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          {item.status === "pending" ? (
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => updateStatus(item.id, "active")}
                              className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-[#166534] px-2.5 text-[11px] font-semibold text-white hover:bg-[#14532d] disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => updateStatus(item.id, "pending")}
                              className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-[#0b2f57] hover:border-[#c2410c]/40 disabled:opacity-60"
                            >
                              <Clock3 className="h-3.5 w-3.5" />
                              Pending
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => deleteBanner(item.id)}
                            className="inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg border border-[#fecdd3] bg-[#fff5f6] px-2.5 text-[11px] font-semibold text-[#e30613] hover:bg-[#ffe4e6] disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredBanners.length > BANNERS_PER_PAGE ? (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Showing {page * BANNERS_PER_PAGE + 1}–
                  {Math.min((page + 1) * BANNERS_PER_PAGE, filteredBanners.length)} of{" "}
                  {filteredBanners.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0b2f57] transition hover:border-[#e30613]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0b2f57] transition hover:border-[#e30613]/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {editingBanner ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label="Close edit banner panel"
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={closeEditModal}
          />
          <aside className="relative z-10 flex h-full w-full max-w-full flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)] animate-[slideInRight_0.25s_ease-out] sm:max-w-[400px]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">Edit Banner</p>
                <h3 className="text-base font-bold text-[#0b2f57] sm:text-lg">Update banner details</h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-[#e30613]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editPreviewUrl || editingBanner.image_url}
                      alt={editAlt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Alt Text</span>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(event) => setEditAlt(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#0b2f57] outline-none focus:border-[#e30613]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Replace Image (optional)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => setEditUploadFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0b2f57] file:mr-3 file:rounded-md file:border-0 file:bg-[#fff5f6] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#e30613]"
                  />
                </label>

                <div className="rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-xs text-slate-600">
                  <p className="font-bold text-[#0b2f57]">Auto SEO</p>
                  {(() => {
                    const seo = editFile
                      ? buildBannerMetaFromFileName(editFile.name, bannerUrlOptions)
                      : getBannerSeoFields(editingBanner, bannerUrlOptions);
                    return (
                      <>
                        <p className="mt-2">
                          <span className="font-semibold text-[#0b2f57]">SEO Title:</span> {seo.seoTitle}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-[#0b2f57]">Meta Description:</span>{" "}
                          {seo.metaDescription}
                        </p>
                        <p className="mt-1">
                          <span className="font-semibold text-[#0b2f57]">H1:</span> {seo.h1Heading}
                        </p>
                        <p className="mt-1 break-all">
                          <span className="font-semibold text-[#0b2f57]">Image URL:</span> {seo.imageUrl}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 p-4 sm:p-5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-[#0b2f57]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === editingBanner.id}
                  className="btn-premium inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#e30613] px-4 text-sm font-semibold text-white hover:bg-[#c40010] disabled:opacity-70"
                >
                  {updatingId === editingBanner.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
