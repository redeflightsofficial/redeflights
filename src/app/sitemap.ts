import type { MetadataRoute } from "next";
import { readLocalBanners } from "@/lib/banner-local";
import { readLocalDestinations } from "@/lib/destination-local";
import { readLocalHotels } from "@/lib/hotel-local";
import { readLocalRoutes } from "@/lib/route-local";
import { SITE_URL } from "@/lib/site-seo";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { readLocalUmrahPackages } from "@/lib/umrah-local";
import { readLocalVisas } from "@/lib/visa-local";

export const revalidate = 3600;

type SitemapTable =
  | "routes"
  | "banners"
  | "destinations"
  | "hotels"
  | "tour_packages"
  | "visas"
  | "umrah_packages";
type SlugRow = { slug: string; created_at?: string | null };

const PAGE_SIZE = 1000;

function normalizeSlug(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function dedupeSlugRows(rows: SlugRow[]) {
  const unique = new Map<string, SlugRow>();

  for (const row of rows) {
    const slug = normalizeSlug(row.slug);
    if (!slug) continue;

    const existing = unique.get(slug);
    if (!existing || String(row.created_at || "") > String(existing.created_at || "")) {
      unique.set(slug, { ...row, slug });
    }
  }

  return Array.from(unique.values());
}

async function loadActiveSlugs(table: SitemapTable): Promise<SlugRow[]> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const rows: SlugRow[] = [];

      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from(table)
          .select("slug, created_at")
          .eq("status", "active")
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          logSupabaseError(`sitemap ${table} error:`, error);
          break;
        }

        const page = (data ?? []) as SlugRow[];
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
      }

      if (rows.length) return dedupeSlugRows(rows);
    } catch (error) {
      logSupabaseError(`sitemap ${table} error:`, error);
    }
  }

  const localReaders = {
    routes: readLocalRoutes,
    banners: readLocalBanners,
    destinations: readLocalDestinations,
    hotels: readLocalHotels,
    tour_packages: async () => [],
    visas: readLocalVisas,
    umrah_packages: readLocalUmrahPackages,
  } as const;

  const local = await localReaders[table]();
  return dedupeSlugRows(local
    .filter((item) => item.status === "active" && Boolean(item.slug?.trim()))
    .map((item) => ({ slug: String(item.slug || ""), created_at: item.created_at })));
}

function absoluteUrl(path: string) {
  const base = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function validLastModified(value: string | null | undefined) {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/flights"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/hotels"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/visa"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/packages"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/destinations"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/umrah"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const [routes, banners, destinations, hotels, tourPackages, visas, umrahPackages] =
    await Promise.all([
      loadActiveSlugs("routes"),
      loadActiveSlugs("banners"),
      loadActiveSlugs("destinations"),
      loadActiveSlugs("hotels"),
      loadActiveSlugs("tour_packages"),
      loadActiveSlugs("visas"),
      loadActiveSlugs("umrah_packages"),
    ]);

  const flightEntries: MetadataRoute.Sitemap = dedupeSlugRows([...routes, ...banners]).map((row) => ({
    url: absoluteUrl(`/flights/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const hotelEntries: MetadataRoute.Sitemap = hotels.map((row) => ({
    url: absoluteUrl(`/hotels/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const destinationEntries: MetadataRoute.Sitemap = destinations.map((row) => ({
    url: absoluteUrl(`/destinations/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const packageEntries: MetadataRoute.Sitemap = tourPackages.map((row) => ({
    url: absoluteUrl(`/packages/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const visaEntries: MetadataRoute.Sitemap = visas.map((row) => ({
    url: absoluteUrl(`/visa/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const umrahEntries: MetadataRoute.Sitemap = umrahPackages.map((row) => ({
    url: absoluteUrl(`/umrah/${encodeURIComponent(row.slug)}`),
    lastModified: validLastModified(row.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...flightEntries,
    ...destinationEntries,
    ...hotelEntries,
    ...packageEntries,
    ...visaEntries,
    ...umrahEntries,
  ];
}
