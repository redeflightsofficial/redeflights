"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { buildEnquiryWhatsAppMessage } from "@/lib/enquiry";
import { WHATSAPP_URL } from "@/lib/contact";
import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { CheckCheck, Inbox, LoaderCircle, MessageCircle, RefreshCw, Trash2 } from "lucide-react";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusStyle(status: EnquiryStatus) {
  if (status === "new") return "bg-[#fff5f6] text-[#e30613]";
  if (status === "read") return "bg-[#eff6ff] text-[#2563eb]";
  return "bg-[#ecfdf3] text-[#166534]";
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | EnquiryStatus>("all");

  async function loadEnquiries() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/enquiries");
      const result = (await response.json()) as {
        enquiries?: Enquiry[];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Unable to load enquiries.");
        setEnquiries([]);
        return;
      }

      setEnquiries(result.enquiries || []);
    } catch {
      setError("Network error while loading enquiries.");
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnquiries();
  }, []);

  const stats = useMemo(
    () => ({
      total: enquiries.length,
      new: enquiries.filter((item) => item.status === "new").length,
      read: enquiries.filter((item) => item.status === "read").length,
      replied: enquiries.filter((item) => item.status === "replied").length,
    }),
    [enquiries],
  );

  const filteredEnquiries = useMemo(() => {
    if (filter === "all") return enquiries;
    return enquiries.filter((item) => item.status === filter);
  }, [enquiries, filter]);

  async function updateStatus(id: string, status: EnquiryStatus) {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = (await response.json()) as { enquiry?: Enquiry; error?: string };

      if (!response.ok || !result.enquiry) {
        setError(result.error || "Unable to update enquiry.");
        return;
      }

      setEnquiries((current) =>
        current.map((item) => (item.id === id ? result.enquiry! : item)),
      );
    } catch {
      setError("Network error while updating enquiry.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteEnquiry(id: string, name: string) {
    const confirmed = window.confirm(`Delete enquiry from ${name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/enquiries/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Unable to delete enquiry.");
        return;
      }

      setEnquiries((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Network error while deleting enquiry.");
    } finally {
      setDeletingId(null);
    }
  }

  const filterTabs: { key: "all" | EnquiryStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "new", label: "New", count: stats.new },
    { key: "read", label: "Read", count: stats.read },
    { key: "replied", label: "Replied", count: stats.replied },
  ];

  return (
    <DashboardShell title="Enquiries" breadcrumb="Home / Dashboard / Enquiries">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, tone: "text-[#0b2f57]" },
          { label: "New", value: stats.new, tone: "text-[#e30613]" },
          { label: "Read", value: stats.read, tone: "text-[#2563eb]" },
          { label: "Replied", value: stats.replied, tone: "text-[#166534]" },
        ].map((item) => (
          <div key={item.label} className="dash-stat">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="dash-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">
              Contact Enquiries
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#0b2f57] sm:text-xl">Customer Messages</h2>
          </div>
          <button
            type="button"
            onClick={loadEnquiries}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0b2f57] transition hover:border-[#e30613]/40"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
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
            Loading enquiries...
          </div>
        ) : error ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#e30613]">{error}</p>
            <button
              type="button"
              onClick={loadEnquiries}
              className="btn-premium mt-4 bg-[#e30613] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f5f9] text-[#0b2f57]">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-4 text-lg font-bold text-[#0b2f57]">No enquiries found</p>
            <p className="mt-2 text-sm text-slate-500">
              {filter === "all"
                ? "New Contact Us form submissions will appear here."
                : `No ${filter} enquiries right now.`}
            </p>
          </div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f8fafc]">
                  <th className="px-4 py-3 sm:px-5">Date</th>
                  <th className="px-4 py-3 sm:px-5">Customer</th>
                  <th className="hidden px-4 py-3 md:table-cell sm:px-5">Phone</th>
                  <th className="hidden px-4 py-3 lg:table-cell sm:px-5">Email</th>
                  <th className="px-4 py-3 sm:px-5">Service</th>
                  <th className="hidden px-4 py-3 sm:table-cell sm:px-5">Message</th>
                  <th className="px-4 py-3 sm:px-5">Status</th>
                  <th className="px-4 py-3 sm:px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((item) => {
                  const whatsappText = encodeURIComponent(
                    buildEnquiryWhatsAppMessage({
                      name: item.name,
                      phone: item.phone,
                      email: item.email,
                      service: item.service,
                      message: item.message,
                    }),
                  );
                  const whatsappUrl = `${WHATSAPP_URL}?text=${whatsappText}`;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 align-top transition hover:bg-[#fafbfd]"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500 sm:px-5">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <p className="font-semibold text-[#0b2f57]">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500 md:hidden">{item.phone}</p>
                        <a
                          href={`mailto:${item.email}`}
                          className="mt-0.5 block truncate text-xs text-[#e30613] hover:underline lg:hidden"
                        >
                          {item.email}
                        </a>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:hidden">
                          {item.message || "—"}
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-slate-600 md:table-cell sm:px-5">
                        <a href={`tel:${item.phone}`} className="hover:text-[#e30613]">
                          {item.phone}
                        </a>
                      </td>
                      <td className="hidden max-w-[180px] px-4 py-4 lg:table-cell sm:px-5">
                        <a
                          href={`mailto:${item.email}`}
                          className="block truncate text-[#e30613] hover:underline"
                        >
                          {item.email}
                        </a>
                      </td>
                      <td className="px-4 py-4 font-medium text-[#0b2f57] sm:px-5">
                        {item.service}
                      </td>
                      <td className="hidden max-w-[220px] px-4 py-4 text-slate-600 sm:table-cell sm:px-5">
                        <p className="line-clamp-2" title={item.message}>
                          {item.message || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusStyle(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex min-w-[130px] flex-col gap-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-[#e30613] px-3 text-[11px] font-semibold text-white hover:bg-[#c40010]"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>

                          {item.status === "new" ? (
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => updateStatus(item.id, "read")}
                              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-[#0b2f57] hover:border-[#e30613]/40 disabled:opacity-60"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Mark read
                            </button>
                          ) : item.status === "read" ? (
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => updateStatus(item.id, "replied")}
                              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-[#0b2f57] hover:border-[#166534]/40 disabled:opacity-60"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                              Mark replied
                            </button>
                          ) : null}

                          <button
                            type="button"
                            disabled={deletingId === item.id || updatingId === item.id}
                            onClick={() => deleteEnquiry(item.id, item.name)}
                            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[#fecdd3] bg-[#fff5f6] px-3 text-[11px] font-semibold text-[#e30613] hover:border-[#e30613]/40 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Test the public form:{" "}
        <Link href="/contact" className="font-semibold text-[#e30613] hover:underline">
          Open Contact Us page
        </Link>
      </p>
    </DashboardShell>
  );
}
