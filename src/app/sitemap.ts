import type { MetadataRoute } from "next";
import { readLocalHotels } from "@/lib/hotel-local";
import { readLocalRoutes } from "@/lib/route-local";
import { SITE_URL } from "@/lib/site-seo";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { readLocalVisas } from "@/lib/visa-local";

type SlugRow = { slug: string; created_at?: string };

async function loadActiveSlugs(table: "routes" | "hotels" | "visas"): Promise<SlugRow[]> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from(table)
        .select("slug, created_at")
        .eq("status", "active")
        .not("slug", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        logSupabaseError(`sitemap ${table} error:`, error);
      } else if (data?.length) {
        return (data as SlugRow[]).filter((row) => Boolean(row.slug?.trim()));
      }
    } catch (error) {
      logSupabaseError(`sitemap ${table} error:`, error);
    }
  }

  const localReaders = {
    routes: readLocalRoutes,
    hotels: readLocalHotels,
    visas: readLocalVisas,
  } as const;

  const local = await localReaders[table]();
  return local
    .filter((item) => item.status === "active" && Boolean(item.slug?.trim()))
    .map((item) => ({ slug: item.slug, created_at: item.created_at }));
}

function absoluteUrl(path: string) {
  const base = SITE_URL.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const [routes, hotels, visas] = await Promise.all([
    loadActiveSlugs("routes"),
    loadActiveSlugs("hotels"),
    loadActiveSlugs("visas"),
  ]);

  const flightEntries: MetadataRoute.Sitemap = routes.map((row) => ({
    url: absoluteUrl(`/flights/${row.slug}`),
    lastModified: row.created_at ? new Date(row.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const hotelEntries: MetadataRoute.Sitemap = hotels.map((row) => ({
    url: absoluteUrl(`/hotels/${row.slug}`),
    lastModified: row.created_at ? new Date(row.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const visaEntries: MetadataRoute.Sitemap = visas.map((row) => ({
    url: absoluteUrl(`/visa/${row.slug}`),
    lastModified: row.created_at ? new Date(row.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...flightEntries, ...hotelEntries, ...visaEntries];
}
