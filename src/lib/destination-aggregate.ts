import { buildDestinationSeo } from "@/lib/destination-meta";
import { readLocalDestinations } from "@/lib/destination-local";
import { readLocalHotels } from "@/lib/hotel-local";
import { readLocalRoutes } from "@/lib/route-local";
import { readLocalVisas } from "@/lib/visa-local";
import { mergeWithLocalById } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import { sanitizeSlug } from "@/lib/slug-utils";
import type { Hotel } from "@/types/hotel";
import type { Route } from "@/types/route";
import type { Visa } from "@/types/visa";
import type {
  Destination,
  DestinationOption,
  DestinationRecord,
  DestinationSourceTag,
  DestinationTravelStyle,
} from "@/types/destination";

const FALLBACK_DESTINATION_IMAGE =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&h=540&q=85";

type AggregatedEntry = {
  key: string;
  label: string;
  country: string;
  sources: DestinationSourceTag[];
  manual?: DestinationRecord;
  hotelCount: number;
};

function normalizeKey(value: string) {
  return sanitizeSlug(value.trim().toLowerCase()) || value.trim().toLowerCase();
}

function guessCountry(label: string, fallback = "") {
  const parts = label.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) return parts[parts.length - 1];
  return fallback || label;
}

function addEntry(
  map: Map<string, AggregatedEntry>,
  label: string,
  source: DestinationSourceTag,
  country = "",
) {
  const cleanLabel = label.trim();
  if (!cleanLabel) return;

  const key = normalizeKey(cleanLabel);
  const existing = map.get(key);

  if (existing) {
    if (!existing.sources.includes(source)) existing.sources.push(source);
    if (!existing.country && country) existing.country = country;
    if (source === "hotel") existing.hotelCount += 1;
    return;
  }

  map.set(key, {
    key,
    label: cleanLabel,
    country: country || guessCountry(cleanLabel),
    sources: [source],
    hotelCount: source === "hotel" ? 1 : 0,
  });
}

async function loadFromTable<T extends { status: string; id: string }>(
  table: string,
  localReader: () => Promise<T[]>,
  activeOnly = true,
) {
  let items: T[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from(table).select("*").order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");

      const { data, error } = await withQueryTimeout(query, 5000, `${table} aggregate fetch`);
      items = (data ?? []) as T[];
      if (error) {
        logSupabaseError(`${table} aggregate fetch error:`, error);
        items = [];
      }
    } catch (error) {
      logSupabaseError(`${table} aggregate fetch error:`, error);
      items = [];
    }
  }

  const localItems = activeOnly
    ? (await localReader()).filter((item) => item.status === "active")
    : await localReader();

  return mergeWithLocalById(items, localItems);
}

export async function loadManagedDestinations(activeOnly = false) {
  let records: DestinationRecord[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("destinations").select("*").order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");

      const { data, error } = await withQueryTimeout(query, 5000, "destinations fetch");
      records = (data ?? []) as DestinationRecord[];
      if (error) {
        logSupabaseError("destinations fetch error:", error);
        records = [];
      }
    } catch (error) {
      logSupabaseError("destinations fetch error:", error);
      records = [];
    }
  }

  const localRecords = await readLocalDestinations();
  const filteredLocal = activeOnly
    ? localRecords.filter((item) => item.status === "active")
    : localRecords;

  records = mergeWithLocalById(records, filteredLocal);

  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return records;
}

export async function buildDestinationAggregate(options: { activeOnly?: boolean; includeAllProducts?: boolean } = {}) {
  const activeOnly = options.activeOnly ?? true;
  const includeAllProducts = options.includeAllProducts ?? false;
  const productActiveOnly = includeAllProducts ? false : activeOnly;

  const [managed, hotels, visas, routes] = await Promise.all([
    loadManagedDestinations(activeOnly),
    loadFromTable<Hotel>("hotels", readLocalHotels, productActiveOnly),
    loadFromTable<Visa>("visas", readLocalVisas, productActiveOnly),
    loadFromTable<Route>("routes", readLocalRoutes, productActiveOnly),
  ]);

  const map = new Map<string, AggregatedEntry>();

  for (const record of managed) {
    const key = normalizeKey(record.title);
    map.set(key, {
      key,
      label: record.title,
      country: record.country,
      sources: ["manual"],
      manual: record,
      hotelCount: 0,
    });
  }

  for (const hotel of hotels) {
    addEntry(map, hotel.location, "hotel", guessCountry(hotel.location));
  }

  for (const visa of visas) {
    addEntry(map, visa.country, "visa", visa.country);
  }

  for (const route of routes) {
    addEntry(map, route.to_city, "flight", guessCountry(route.to_city));
  }

  return {
    managed,
    entries: Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function buildDestinationOptions(entries: AggregatedEntry[]): DestinationOption[] {
  return entries.map((entry) => ({
    label: entry.hotelCount > 1 ? `${entry.label} (${entry.hotelCount} hotels)` : entry.label,
    value: entry.label,
    sources: entry.sources,
    country: entry.country,
  }));
}

export function buildSearchDestinations(entries: AggregatedEntry[]): Destination[] {
  return entries.map((entry) => {
    const manual = entry.manual;
    const sourceBoost = entry.sources.length * 8;

    return {
      id: manual?.id || entry.key,
      title: entry.label,
      subtitle: manual?.subtitle || `Explore ${entry.label}`,
      country: manual?.country || entry.country,
      packages: manual?.packages_count || entry.hotelCount || entry.sources.length,
      region: manual?.region || "Asia",
      travelStyles: (manual?.travel_styles || []) as Exclude<DestinationTravelStyle, "All Styles">[],
      image: manual?.image_url || FALLBACK_DESTINATION_IMAGE,
      popularScore: manual?.popular_score || 60 + sourceBoost,
      sources: entry.sources,
    };
  });
}

export function managedRecordsToDestinations(records: DestinationRecord[]): Destination[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
    subtitle: record.subtitle || `Explore ${record.title}`,
    country: record.country,
    packages: record.packages_count,
    region: record.region,
    travelStyles: record.travel_styles,
    image: record.image_url || FALLBACK_DESTINATION_IMAGE,
    popularScore: record.popular_score || 70,
    sources: ["manual"],
  }));
}

export function managedRecordsToOptions(records: DestinationRecord[]): DestinationOption[] {
  return records.map((record) => ({
    label: record.title,
    value: record.title,
    sources: ["manual"],
    country: record.country,
  }));
}

export function buildManagedDestinationPayload(
  input: {
    title: string;
    country: string;
    subtitle?: string;
    region?: Destination["region"];
    travel_styles?: DestinationRecord["travel_styles"];
    image_url?: string | null;
    packages_count?: number;
    popular_score?: number;
    status?: DestinationRecord["status"];
  },
  siteOrigin?: string,
) {
  const seo = buildDestinationSeo(input.title, input.country, siteOrigin);
  return {
    title: input.title.trim(),
    country: input.country.trim(),
    subtitle: String(input.subtitle || "").trim() || `Explore ${input.title.trim()}`,
    region: input.region || "Asia",
    travel_styles: input.travel_styles || [],
    image_url: input.image_url || null,
    packages_count: Number(input.packages_count || 0),
    popular_score: Number(input.popular_score || 0),
    slug: seo.slug,
    seo_title: seo.seo_title,
    meta_description: seo.meta_description,
    h1_heading: seo.h1_heading,
    page_url: seo.page_url,
    og_title: seo.og_title,
    og_description: seo.og_description,
    seo_keywords: seo.seo_keywords,
    status: input.status || ("active" as const),
  };
}
