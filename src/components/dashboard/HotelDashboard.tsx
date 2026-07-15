"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildHotelSeo } from "@/lib/hotel-meta";
import type { EntityStatus } from "@/types/airline";
import type { Hotel } from "@/types/hotel";
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

function amenitiesToText(amenities: string[]) {
  return amenities.join(", ");
}

function textToAmenities(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function HotelDashboard() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EntityStatus>("all");
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [stars, setStars] = useState("5");
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");
  const [amenities, setAmenities] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hotels", { credentials: "same-origin" });
      const result = (await response.json()) as { hotels?: Hotel[]; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to load hotels.");
        return;
      }
      setHotels(result.hotels || []);
    } catch {
      setError("Network error while loading hotels.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const seoPreview = useMemo(() => {
    if (!name.trim() || !location.trim()) return null;
    return buildHotelSeo(name, location, Number(stars || 0), siteOrigin);
  }, [name, location, stars]);

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

  const filteredHotels = useMemo(() => {
    if (filter === "all") return hotels;
    return hotels.filter((item) => item.status === filter);
  }, [hotels, filter]);

  const activeCount = useMemo(() => hotels.filter((item) => item.status === "active").length, [hotels]);

  function resetForm(closeForm = true) {
    setName("");
    setLocation("");
    setStars("5");
    setRating("");
    setReviews("");
    setAmenities("");
    setImageUrl("");
    setDescription("");
    setEditing(null);
    if (closeForm) setFormOpen(false);
  }

  function openForm() {
    resetForm(false);
    setFormOpen(true);
  }

  function fillForm(hotel: Hotel) {
    setName(hotel.name);
    setLocation(hotel.location);
    setStars(String(hotel.stars || 0));
    setRating(hotel.rating || "");
    setReviews(hotel.reviews || "");
    setAmenities(amenitiesToText(hotel.amenities || []));
    setImageUrl(hotel.image_url || "");
    setDescription(hotel.description || "");
    setEditing(hotel);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      name,
      location,
      stars,
      rating,
      reviews,
      amenities: textToAmenities(amenities),
      image_url: imageUrl,
      description,
      ...(editing?.status ? { status: editing.status } : {}),
    };

    try {
      const response = await fetch(editing ? `/api/hotels/${editing.id}` : "/api/hotels", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { hotel?: Hotel; error?: string; message?: string };

      if (!response.ok || !result.hotel) {
        setError(result.error || "Unable to save hotel.");
        return;
      }

      setHotels((current) =>
        editing
          ? current.map((item) => (item.id === result.hotel!.id ? result.hotel! : item))
          : [result.hotel!, ...current],
      );
      setMessage(result.message || "Hotel saved with auto SEO.");
      resetForm();
      await loadData();
    } catch {
      setError("Network error while saving hotel.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(hotel: Hotel) {
    const nextStatus: EntityStatus = hotel.status === "active" ? "pending" : "active";
    setUpdatingId(hotel.id);
    try {
      const response = await fetch("/api/hotels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: hotel.id, status: nextStatus }),
      });
      const result = (await response.json()) as { hotel?: Hotel; error?: string };
      if (!response.ok || !result.hotel) {
        setError(result.error || "Unable to update status.");
        return;
      }
      setHotels((current) => current.map((row) => (row.id === hotel.id ? result.hotel! : row)));
    } catch {
      setError("Network error while updating status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteHotel(hotel: Hotel) {
    if (!confirm(`Delete ${hotel.name}?`)) return;
    setUpdatingId(hotel.id);
    try {
      const response = await fetch(`/api/hotels/${hotel.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error || "Unable to delete hotel.");
        return;
      }
      setHotels((current) => current.filter((row) => row.id !== hotel.id));
      if (editing?.id === hotel.id) resetForm();
    } catch {
      setError("Network error while deleting hotel.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <DashboardShell title="Hotels" breadcrumb="Home / Dashboard / Hotels">
      <div className={`transition-all duration-300 ${formOpen ? "pointer-events-none scale-[0.98] opacity-60" : ""}`}>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-[#fff5f6] text-[#e30613]">
                <FileText size={13} />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Hotels</p>
                <p className="text-base font-bold leading-none text-[#0b2f57]">{hotels.length}</p>
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
                <p className="text-[11px] font-semibold text-[#0b2f57]">Add Hotel</p>
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
                  {key === "all" ? "All Hotels" : key === "pending" ? "Pending" : "Active"}
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
          ) : filteredHotels.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No hotels yet. Add manually from the button above.
            </p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#fafbfd]">
                    <th>Hotel</th>
                    <th>Location</th>
                    <th>Stars</th>
                    <th>H1</th>
                    <th>Meta</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHotels.map((hotel) => (
                    <tr key={hotel.id} className="border-b border-slate-100">
                      <td className="font-semibold text-[#0b2f57]">{hotel.name}</td>
                      <td>{hotel.location}</td>
                      <td>{hotel.stars || "-"}</td>
                      <td className="max-w-[190px] text-[11px] text-slate-600">
                        {hotel.status === "active" && hotel.slug ? (
                          <Link
                            href={`/hotels/${hotel.slug}`}
                            target="_blank"
                            className="font-semibold text-[#0b2f57] hover:text-[#e30613]"
                          >
                            {hotel.h1_heading}
                          </Link>
                        ) : (
                          hotel.h1_heading || "-"
                        )}
                      </td>
                      <td className="max-w-[220px] text-[11px] text-slate-500">
                        {hotel.meta_description.length > 72
                          ? `${hotel.meta_description.slice(0, 72)}...`
                          : hotel.meta_description}
                      </td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle(hotel.status)}`}>
                          {hotel.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">{formatDate(hotel.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => fillForm(hotel)} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#e30613]">
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === hotel.id}
                            onClick={() => toggleStatus(hotel)}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:text-[#166534]"
                          >
                            {updatingId === hotel.id ? (
                              <LoaderCircle size={13} className="animate-spin" />
                            ) : hotel.status === "active" ? (
                              <Clock3 size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === hotel.id}
                            onClick={() => deleteHotel(hotel)}
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
          )}
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label="Close add hotel panel"
            className="absolute inset-0 bg-[#0b2f57]/30 backdrop-blur-[1px]"
            onClick={() => resetForm()}
          />
          <aside className="relative z-10 flex h-full w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-[-8px_0_30px_rgba(11,47,87,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#0b2f57]">
                  {editing ? "Edit Hotel" : "Add Hotel"}
                </p>
                <p className="text-[11px] text-slate-500">Auto SEO, meta, H1 and keywords</p>
              </div>
              <button type="button" onClick={() => resetForm()} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-[#e30613]">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Hotel Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Grand Hyatt Bali"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Location
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="Bali, Indonesia"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Stars
                    <input
                      value={stars}
                      onChange={(e) => setStars(e.target.value)}
                      type="number"
                      min="0"
                      max="7"
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Rating
                    <input
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="4.8"
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Reviews
                    <input
                      value={reviews}
                      onChange={(e) => setReviews(e.target.value)}
                      placeholder="2.1k"
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Amenities
                  <input
                    value={amenities}
                    onChange={(e) => setAmenities(e.target.value)}
                    placeholder="Free Wi-Fi, Breakfast, Spa"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Image URL
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Short hotel description"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#e30613]/40"
                  />
                </label>

                {seoPreview ? (
                  <div className="rounded-lg border border-slate-200 bg-[#fafbfd] p-2.5 text-[10px] leading-relaxed text-slate-600">
                    <p className="font-bold text-[#e30613]">Auto SEO Preview</p>
                    <p className="mt-1 break-words"><span className="font-semibold text-[#0b2f57]">H1:</span> {seoPreview.h1_heading}</p>
                    <p className="mt-0.5 break-words"><span className="font-semibold text-[#0b2f57]">Title:</span> {seoPreview.seo_title}</p>
                    <p className="mt-0.5 break-words"><span className="font-semibold text-[#0b2f57]">Meta:</span> {seoPreview.meta_description}</p>
                    <p className="mt-0.5 break-words"><span className="font-semibold text-[#0b2f57]">Keywords:</span> {seoPreview.seo_keywords}</p>
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
                  {editing ? "Update" : "Add Hotel"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </DashboardShell>
  );
}
