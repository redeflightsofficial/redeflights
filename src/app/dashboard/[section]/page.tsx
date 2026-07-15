import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardNavItems } from "@/components/dashboard/dashboard-nav";
import { FileText, Save, Sparkles, X } from "lucide-react";

const sectionMeta: Record<string, { title: string; category: string }> = {
  airports: { title: "Airports", category: "Master Data" },
  airlines: { title: "Airlines", category: "Master Data" },
  hotels: { title: "Hotels", category: "Products" },
  destinations: { title: "Destinations", category: "Products" },
  visa: { title: "Visa", category: "Products" },
  routes: { title: "Routes", category: "Operations" },
  "excel-import": { title: "Excel Import", category: "Operations" },
  "banner-images": { title: "Banner Images", category: "Content" },
  "seo-pages": { title: "SEO Pages", category: "Content" },
  blog: { title: "Blog", category: "Content" },
  settings: { title: "Settings", category: "System" },
};

export function generateStaticParams() {
  return dashboardNavItems
    .filter(
      (item) =>
        item.href !== "/dashboard" &&
        !["enquiries", "banner-images", "settings", "routes", "flights", "airlines", "airports", "destinations", "hotels", "visa"].includes(item.key),
    )
    .map((item) => ({ section: item.key }));
}

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const meta = sectionMeta[section];

  if (!meta) notFound();

  return (
    <DashboardShell
      title={meta.title}
      breadcrumb={`Home / Dashboard / ${meta.title}`}
    >
      <article className="dash-card p-2.5 sm:p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{meta.category}</p>
            <h2 className="flex items-center gap-1 text-sm font-bold text-[#0b2f57]">
              <Sparkles size={14} className="text-[#e30613]" />
              Manage {meta.title}
            </h2>
          </div>
          <button type="button" className="inline-flex items-center gap-1 rounded-md bg-[#e30613] px-2.5 py-1.5 text-[11px] font-bold text-white">
            <FileText size={13} />
            Add New
          </button>
        </div>

        <form className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Name</span>
            <input className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Code</span>
            <input className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Status</span>
            <select className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300">
              <option>Active</option>
              <option>Draft</option>
              <option>Inactive</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Category</span>
            <input className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-[11px] font-semibold text-slate-600">Description</span>
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300"
            />
          </label>
        </form>

        <div className="mt-2.5 flex justify-end gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
            <X size={13} />
            Cancel
          </button>
          <button type="button" className="inline-flex items-center gap-1 rounded-md bg-[#0b2f57] px-2.5 py-1.5 text-[11px] font-bold text-white">
            <Save size={13} />
            Save
          </button>
        </div>
      </article>
    </DashboardShell>
  );
}
