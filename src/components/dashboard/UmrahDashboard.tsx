"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildUmrahSeo } from "@/lib/umrah-meta";
import type { EntityStatus } from "@/types/airline";
import type { UmrahPackage } from "@/types/umrah";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
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

export function UmrahDashboard() {
  const [packages, setPackages] = useState<UmrahPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<UmrahPackage | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [packageCode, setPackageCode] = useState("");
  const [title, setTitle] = useState("");
  const [departureCity, setDepartureCity] = useState("Dubai");
  const [destination, setDestination] = useState("Makkah & Madinah");
  const [hotelCategory, setHotelCategory] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [nights, setNights] = useState("5");
  const [airline, setAirline] = useState("Any");
  const [priceAed, setPriceAed] = useState("");
  const [visaIncluded, setVisaIncluded] = useState(true);
  const [transferIncluded, setTransferIncluded] = useState(true);
  const [focusKeyword, setFocusKeyword] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [h2Heading, setH2Heading] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [faqsText, setFaqsText] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/umrah", { credentials: "same-origin" });
      const result = (await response.json()) as { packages?: UmrahPackage[]; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to load Umrah packages.");
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

  const seoPreview = useMemo(() => {
    if (!title.trim()) return null;
    return buildUmrahSeo(title, departureCity, nights, focusKeyword, siteOrigin);
  }, [title, departureCity, nights, focusKeyword]);

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

  function resetForm(closeForm = true) {
    setPackageCode("");
    setTitle("");
    setDepartureCity("Dubai");
    setDestination("Makkah & Madinah");
    setHotelCategory("");
    setHotelName("");
    setNights("5");
    setAirline("Any");
    setPriceAed("");
    setVisaIncluded(true);
    setTransferIncluded(true);
    setFocusKeyword("");
    setShortDescription("");
    setLongDescription("");
    setH2Heading("");
    setImageUrl("");
    setImageAlt("");
    setFaqsText("");
    setEditing(null);
    if (closeForm) setFormOpen(false);
  }

  function openForm() {
    resetForm(false);
    setFormOpen(true);
  }

  function fillForm(pkg: UmrahPackage) {
    setPackageCode(pkg.package_code || "");
    setTitle(pkg.title);
    setDepartureCity(pkg.departure_city || "Dubai");
    setDestination(pkg.destination || "Makkah & Madinah");
    setHotelCategory(pkg.hotel_category || "");
    setHotelName(pkg.hotel_name || "");
    setNights(String(pkg.nights || ""));
    setAirline(pkg.airline || "Any");
    setPriceAed(pkg.price_aed || "");
    setVisaIncluded(Boolean(pkg.visa_included));
    setTransferIncluded(Boolean(pkg.transfer_included));
    setFocusKeyword(pkg.focus_keyword || "");
    setShortDescription(pkg.short_description || "");
    setLongDescription(pkg.long_description || "");
    setH2Heading(pkg.h2_heading || "");
    setImageUrl(pkg.image_url || "");
    setImageAlt(pkg.image_alt || "");
    setFaqsText((pkg.faqs || []).join("\n"));
    setEditing(pkg);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      package_code: packageCode,
      title,
      departure_city: departureCity,
      destination,
      hotel_category: hotelCategory,
      hotel_name: hotelName,
      nights: Number(nights || 0),
      airline,
      price_aed: priceAed,
      visa_included: visaIncluded,
      transfer_included: transferIncluded,
      focus_keyword: focusKeyword,
      short_description: shortDescription,
      long_description: longDescription,
      h2_heading: h2Heading,
      image_url: imageUrl,
      image_alt: imageAlt,
      faqs: faqsText,
      slug: seoPreview?.slug,
      seo_title: seoPreview?.seo_title,
      meta_description: seoPreview?.meta_description,
      h1_heading: seoPreview?.h1_heading,
      og_title: seoPreview?.og_title,
      og_description: seoPreview?.og_description,
      seo_keywords: seoPreview?.seo_keywords,
    };

    try {
      const response = await fetch(editing ? `/api/umrah/${editing.id}` : "/api/umrah", {
        method: editing ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        package?: UmrahPackage;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.package) {
        setError(result.error || "Unable to save Umrah package.");
        return;
      }

      setPackages((current) =>
        editing
          ? current.map((item) => (item.id === result.package!.id ? result.package! : item))
          : [result.package!, ...current],
      );
      setMessage(result.message || "Umrah package saved with auto SEO.");
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(pkg: UmrahPackage) {
    const nextStatus: EntityStatus = pkg.status === "active" ? "pending" : "active";
    setUpdatingId(pkg.id);
    try {
      const response = await fetch("/api/umrah", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pkg.id, status: nextStatus }),
      });
      const result = (await response.json()) as { package?: UmrahPackage; error?: string };
      if (!response.ok || !result.package) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setPackages((current) =>
        current.map((row) => (row.id === pkg.id ? result.package! : row)),
      );
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deletePackage(pkg: UmrahPackage) {
    if (!confirm(`Delete ${pkg.title}?`)) return;
    setUpdatingId(pkg.id);
    try {
      const response = await fetch(`/api/umrah/${pkg.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete.");
        return;
      }
      setPackages((current) => current.filter((row) => row.id !== pkg.id));
      if (editing?.id === pkg.id) resetForm();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Umrah Packages" breadcrumb="Home / Dashboard / Umrah">
      <div className={`transition-all duration-300 ${formOpen ? "pointer-events-none scale-[0.98] opacity-60" : ""}`}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Umrah Packages</p>
            <p className="text-base font-bold leading-none text-[#0b2f57]">{packages.length}</p>
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
                <p className="text-[11px] font-semibold text-[#0b2f57]">Add Umrah</p>
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
                  {key === "all" ? "All Packages" : key === "pending" ? "Pending" : "Active"}
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
          ) : filteredPackages.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No Umrah packages yet. Add from the button above.
            </p>
          ) : (
            <>
              <div className="dash-table-wrap">
                <table className="dash-table w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#fafbfd]">
                      <th>Package</th>
                      <th>From</th>
                      <th>Nights</th>
                      <th>Price</th>
                      <th>H1 / URL</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPackages.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-slate-100">
                        <td className="font-semibold text-[#0b2f57]">
                          <p>{pkg.title}</p>
                          {pkg.package_code ? (
                            <p className="text-[10px] font-normal text-slate-400">{pkg.package_code}</p>
                          ) : null}
                        </td>
                        <td>{pkg.departure_city || "-"}</td>
                        <td>{pkg.nights || "-"}</td>
                        <td>{pkg.price_aed ? `AED ${pkg.price_aed}` : "-"}</td>
                        <td className="max-w-[220px] text-[11px] text-slate-600">
                          {pkg.status === "active" && pkg.slug ? (
                            <Link
                              href={`/umrah/${pkg.slug}`}
                              target="_blank"
                              className="font-semibold text-[#0b2f57] hover:text-[#e30613]"
                            >
                              {pkg.h1_heading}
                            </Link>
                          ) : (
                            pkg.h1_heading || "-"
                          )}
                          {pkg.page_url ? (
                            <p className="mt-0.5 break-all text-[10px] text-slate-400">{pkg.page_url}</p>
                          ) : null}
                        </td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(pkg.status)}`}>
                            {pkg.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-slate-500">{formatDate(pkg.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => fillForm(pkg)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]">
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === pkg.id}
                              onClick={() => toggleStatus(pkg)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                            >
                              {updatingId === pkg.id ? (
                                <LoaderCircle size={13} className="animate-spin" />
                              ) : pkg.status === "active" ? (
                                <Clock3 size={13} />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === pkg.id}
                              onClick={() => deletePackage(pkg)}
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
            aria-label="Close add umrah panel"
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={() => resetForm()}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#0b2f57]">
                  {editing ? "Edit Umrah Package" : "Add Umrah Package"}
                </p>
                <p className="text-[11px] text-slate-500">SEO fields auto-fill from package details</p>
              </div>
              <button type="button" onClick={() => resetForm()} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-[#e30613]">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Package ID
                    <input value={packageCode} onChange={(e) => setPackageCode(e.target.value)} placeholder="UMR05" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nights
                    <input value={nights} onChange={(e) => setNights(e.target.value)} type="number" min="1" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Package Name
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="5 Nights Economy Umrah Package" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Departure City
                    <input value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="Dubai" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Destination
                    <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Makkah & Madinah" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Hotel Category
                    <input value={hotelCategory} onChange={(e) => setHotelCategory(e.target.value)} placeholder="3 Star" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Hotel Name
                    <input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="TBD" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Airline
                    <input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Any" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Price (AED)
                    <input value={priceAed} onChange={(e) => setPriceAed(e.target.value)} placeholder="2499" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                  </label>
                </div>
                <div className="flex gap-4 text-sm font-semibold text-slate-700">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={visaIncluded} onChange={(e) => setVisaIncluded(e.target.checked)} />
                    Visa Included
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={transferIncluded} onChange={(e) => setTransferIncluded(e.target.checked)} />
                    Transfer Included
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Focus Keyword
                  <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} placeholder="Umrah Package from Dubai" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  H2
                  <input value={h2Heading} onChange={(e) => setH2Heading(e.target.value)} placeholder="Affordable Umrah from Dubai" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Short Description
                  <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Long Description
                  <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={3} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Image URL
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Image ALT Text
                  <input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Pilgrims in Makkah" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  FAQs <span className="font-normal text-slate-400">(one per line)</span>
                  <textarea value={faqsText} onChange={(e) => setFaqsText(e.target.value)} rows={4} placeholder={"What's included? Hotel, visa assistance and transfers.\nCan families book? Yes."} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#e30613]/40" />
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
                  {editing ? "Update" : "Add Umrah"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
