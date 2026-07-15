import { buildAirlineSeo } from "@/lib/airline-meta";
import {
  findLocalAirlineByIata,
  insertLocalAirline,
  updateLocalAirline,
  deleteLocalAirline,
  readLocalAirlines,
} from "@/lib/airline-local";
import { buildAirportSeo } from "@/lib/airport-meta";
import {
  findLocalAirportByIata,
  insertLocalAirport,
  updateLocalAirport,
  deleteLocalAirport,
  readLocalAirports,
} from "@/lib/airport-local";
import { buildRouteSeo, routesMatchForDedup, buildRouteIdentityKey } from "@/lib/route-meta";
import { deleteLocalRoute, findLocalRouteBySlug, insertLocalRoute, readLocalRoutes, updateLocalRoute } from "@/lib/route-local";
import type { ParsedAirlineRow, ParsedAirportRow, ParsedRouteRow } from "@/lib/excel-import";
import { useLocalStorage } from "@/lib/storage-mode";
import type { SupabaseClient } from "@supabase/supabase-js";

async function safeLocalCleanup(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.warn("import local cleanup skipped:", error);
  }
}

export type ImportUpsertStats = {
  inserted: number;
  updated: number;
  errors: number;
};

export function dedupeByKey<T>(rows: T[], getKey: (row: T) => string): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = getKey(row).trim();
    if (!key) continue;
    map.set(key.toUpperCase(), row);
  }
  return Array.from(map.values());
}

export function dedupeRoutesBySlug(rows: ParsedRouteRow[]): ParsedRouteRow[] {
  const map = new Map<string, ParsedRouteRow>();
  for (const row of rows) {
    const key = buildRouteIdentityKey(row);
    if (key) map.set(key, row);
  }
  return Array.from(map.values());
}

type StoredRouteMatch = {
  id: string;
  slug: string;
  from_city: string;
  to_city: string;
  airline_name?: string | null;
  from_airport_code?: string | null;
  to_airport_code?: string | null;
};

type PrefetchedRoutes = {
  bySlug: Map<string, StoredRouteMatch[]>;
  byCityPair: Map<string, StoredRouteMatch[]>;
};

function cityPairKey(fromCity: string, toCity: string) {
  return `${fromCity.trim().toLowerCase()}→${toCity.trim().toLowerCase()}`;
}

async function prefetchImportedRoutes(supabase: SupabaseClient): Promise<PrefetchedRoutes> {
  const { data } = await supabase
    .from("routes")
    .select("id, slug, from_city, to_city, airline_name, from_airport_code, to_airport_code");

  const bySlug = new Map<string, StoredRouteMatch[]>();
  const byCityPair = new Map<string, StoredRouteMatch[]>();

  for (const record of (data || []) as StoredRouteMatch[]) {
    const slugList = bySlug.get(record.slug) || [];
    slugList.push(record);
    bySlug.set(record.slug, slugList);

    const pair = cityPairKey(record.from_city, record.to_city);
    const cityList = byCityPair.get(pair) || [];
    cityList.push(record);
    byCityPair.set(pair, cityList);
  }

  return { bySlug, byCityPair };
}

function findMatchingImportedRoutes(
  cache: PrefetchedRoutes,
  row: ParsedRouteRow,
  slug: string,
) {
  const unique = new Map<string, StoredRouteMatch>();
  for (const record of [
    ...(cache.bySlug.get(slug) || []),
    ...(cache.byCityPair.get(cityPairKey(row.from_city, row.to_city)) || []),
  ]) {
    unique.set(record.id, record);
  }

  return Array.from(unique.values()).filter((record) => routesMatchForDedup(record, row));
}

function bumpStats(stats: ImportUpsertStats, result: "inserted" | "updated" | "error") {
  if (result === "inserted") stats.inserted += 1;
  else if (result === "updated") stats.updated += 1;
  else stats.errors += 1;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function upsertImportedAirline(
  supabase: SupabaseClient,
  row: ParsedAirlineRow,
  siteOrigin: string,
  existingByCode?: Map<string, { id: string; country: string | null }>,
  localByCode?: Map<string, Awaited<ReturnType<typeof findLocalAirlineByIata>>>,
): Promise<"inserted" | "updated" | "error"> {
  const iataCode = row.iata_code.trim().toUpperCase();
  let existing = existingByCode?.get(iataCode);

  if (!existing && !existingByCode) {
    const { data } = await supabase
      .from("airlines")
      .select("id, country")
      .eq("iata_code", iataCode)
      .maybeSingle();
    existing = data ?? undefined;
  }

  const localExisting = localByCode
    ? localByCode.get(iataCode) || null
    : useLocalStorage()
      ? await findLocalAirlineByIata(iataCode)
      : null;
  const resolvedCountry =
    row.country?.trim() || existing?.country || localExisting?.country || "";
  const seo = buildAirlineSeo(row.name, iataCode, resolvedCountry, siteOrigin);
  const payload = {
    name: row.name.trim(),
    iata_code: iataCode,
    icao_code: row.icao_code?.trim().toUpperCase() || null,
    country: resolvedCountry || null,
    slug: seo.slug,
    seo_title: seo.seo_title,
    meta_description: seo.meta_description,
    h1_heading: seo.h1_heading,
    page_url: seo.page_url,
    status: "active" as const,
  };

  if (existing?.id) {
    const { error } = await supabase.from("airlines").update(payload).eq("id", existing.id);
    if (!error) {
      if (localExisting) await safeLocalCleanup(() => deleteLocalAirline(localExisting.id));
      return "updated";
    }
  } else {
    const { error } = await supabase.from("airlines").insert(payload);
    if (!error) {
      if (localExisting) await safeLocalCleanup(() => deleteLocalAirline(localExisting.id));
      return "inserted";
    }
  }

  if (localExisting) {
    try {
      await updateLocalAirline(localExisting.id, payload);
      return "updated";
    } catch {
      return "error";
    }
  }

  if (useLocalStorage()) {
    try {
      await insertLocalAirline(payload);
      return "inserted";
    } catch {
      return "error";
    }
  }

  return "error";
}

export async function upsertImportedAirport(
  supabase: SupabaseClient,
  row: ParsedAirportRow,
  siteOrigin: string,
  existingByCode?: Map<string, { id: string; country: string | null }>,
  localByCode?: Map<string, Awaited<ReturnType<typeof findLocalAirportByIata>>>,
): Promise<"inserted" | "updated" | "error"> {
  const iataCode = row.iata_code.trim().toUpperCase();
  let existing = existingByCode?.get(iataCode);

  if (!existing && !existingByCode) {
    const { data } = await supabase
      .from("airports")
      .select("id, country")
      .eq("iata_code", iataCode)
      .maybeSingle();
    existing = data ?? undefined;
  }

  const localExisting = localByCode
    ? localByCode.get(iataCode) || null
    : useLocalStorage()
      ? await findLocalAirportByIata(iataCode)
      : null;
  const resolvedCountry =
    row.country?.trim() || existing?.country || localExisting?.country || "";
  const seo = buildAirportSeo(row.name, iataCode, row.city, resolvedCountry, siteOrigin);
  const payload = {
    name: row.name.trim(),
    iata_code: iataCode,
    city: row.city.trim(),
    country: resolvedCountry || null,
    slug: seo.slug,
    seo_title: seo.seo_title,
    meta_description: seo.meta_description,
    h1_heading: seo.h1_heading,
    page_url: seo.page_url,
    status: "active" as const,
  };

  if (existing?.id) {
    const { error } = await supabase.from("airports").update(payload).eq("id", existing.id);
    if (!error) {
      if (localExisting) await safeLocalCleanup(() => deleteLocalAirport(localExisting.id));
      return "updated";
    }
  } else {
    const { error } = await supabase.from("airports").insert(payload);
    if (!error) {
      if (localExisting) await safeLocalCleanup(() => deleteLocalAirport(localExisting.id));
      return "inserted";
    }
  }

  if (localExisting) {
    try {
      await updateLocalAirport(localExisting.id, payload);
      return "updated";
    } catch {
      return "error";
    }
  }

  if (useLocalStorage()) {
    try {
      await insertLocalAirport(payload);
      return "inserted";
    } catch {
      return "error";
    }
  }

  return "error";
}

export async function upsertImportedRoute(
  supabase: SupabaseClient,
  row: ParsedRouteRow,
  siteOrigin: string,
  routeCache?: PrefetchedRoutes,
): Promise<"inserted" | "updated" | "error"> {
  const seo = buildRouteSeo(
    row.from_city,
    row.to_city,
    siteOrigin,
    row.airline_name || "",
    row.from_airport_code || "",
    row.to_airport_code || "",
  );
  const payload = {
    from_city: row.from_city,
    to_city: row.to_city,
    from_airport_code: row.from_airport_code || null,
    to_airport_code: row.to_airport_code || null,
    airline_name: row.airline_name || null,
    slug: seo.slug,
    og_title: seo.og_title,
    og_description: seo.og_description,
    seo_keywords: seo.seo_keywords,
    seo_title: seo.seo_title,
    meta_description: seo.meta_description,
    h1_heading: seo.h1_heading,
    page_url: seo.page_url,
    status: "active" as const,
  };

  const cache = routeCache || (await prefetchImportedRoutes(supabase));
  const matches = findMatchingImportedRoutes(cache, row, seo.slug);
  const primary = matches[0] ?? null;

  if (primary?.id) {
    const { error } = await supabase.from("routes").update(payload).eq("id", primary.id);
    if (!error) {
      for (const duplicate of matches.slice(1)) {
        await supabase.from("routes").delete().eq("id", duplicate.id);
        await safeLocalCleanup(() => deleteLocalRoute(duplicate.id));
        for (const list of [
          cache.bySlug.get(duplicate.slug),
          cache.byCityPair.get(cityPairKey(duplicate.from_city, duplicate.to_city)),
        ]) {
          if (!list) continue;
          const idx = list.findIndex((item) => item.id === duplicate.id);
          if (idx >= 0) list.splice(idx, 1);
        }
      }
      if (useLocalStorage()) {
        const localDuplicate = await findLocalRouteBySlug(seo.slug);
        if (localDuplicate && localDuplicate.id !== primary.id) {
          await safeLocalCleanup(() => deleteLocalRoute(localDuplicate.id));
        }
      }
      Object.assign(primary, payload);
      return "updated";
    }
  } else {
    const { data, error } = await supabase
      .from("routes")
      .insert(payload)
      .select("id, slug, from_city, to_city, airline_name, from_airport_code, to_airport_code")
      .single();
    if (!error && data) {
      if (useLocalStorage()) {
        const localDuplicate = await findLocalRouteBySlug(seo.slug);
        if (localDuplicate) await safeLocalCleanup(() => deleteLocalRoute(localDuplicate.id));
      }
      const stored = data as StoredRouteMatch;
      const slugList = cache.bySlug.get(stored.slug) || [];
      slugList.push(stored);
      cache.bySlug.set(stored.slug, slugList);
      const pair = cityPairKey(stored.from_city, stored.to_city);
      const cityList = cache.byCityPair.get(pair) || [];
      cityList.push(stored);
      cache.byCityPair.set(pair, cityList);
      return "inserted";
    }
  }

  if (!useLocalStorage()) return "error";

  const localRoutes = await readLocalRoutes();
  const localMatches = localRoutes.filter((record) => routesMatchForDedup(record, row));
  const localPrimary = localMatches[0];

  if (localPrimary) {
    try {
      await updateLocalRoute(localPrimary.id, payload);
      for (const duplicate of localMatches.slice(1)) {
        await safeLocalCleanup(() => deleteLocalRoute(duplicate.id));
      }
      return "updated";
    } catch {
      return "error";
    }
  }

  try {
    await insertLocalRoute(payload);
    return "inserted";
  } catch {
    return "error";
  }
}

export async function upsertImportedAirlines(
  supabase: SupabaseClient,
  rows: ParsedAirlineRow[],
  siteOrigin: string,
): Promise<ImportUpsertStats> {
  const stats: ImportUpsertStats = { inserted: 0, updated: 0, errors: 0 };
  const deduped = dedupeByKey(rows, (row) => row.iata_code);
  const codes = deduped.map((row) => row.iata_code.trim().toUpperCase()).filter(Boolean);

  const existingByCode = new Map<string, { id: string; country: string | null }>();
  for (const chunk of chunkArray(codes, 200)) {
    if (chunk.length === 0) continue;
    const { data } = await supabase.from("airlines").select("id, iata_code, country").in("iata_code", chunk);
    for (const item of data || []) {
      existingByCode.set(String(item.iata_code).toUpperCase(), {
        id: item.id,
        country: item.country ?? null,
      });
    }
  }

  const localByCode = new Map<string, NonNullable<Awaited<ReturnType<typeof findLocalAirlineByIata>>>>();
  if (useLocalStorage()) {
    for (const item of await readLocalAirlines()) {
      localByCode.set(item.iata_code.toUpperCase(), item);
    }
  }

  for (const row of deduped) {
    const result = await upsertImportedAirline(supabase, row, siteOrigin, existingByCode, localByCode);
    bumpStats(stats, result);
  }

  return stats;
}

export async function upsertImportedAirports(
  supabase: SupabaseClient,
  rows: ParsedAirportRow[],
  siteOrigin: string,
): Promise<ImportUpsertStats> {
  const stats: ImportUpsertStats = { inserted: 0, updated: 0, errors: 0 };
  const deduped = dedupeByKey(rows, (row) => row.iata_code);
  const codes = deduped.map((row) => row.iata_code.trim().toUpperCase()).filter(Boolean);

  const existingByCode = new Map<string, { id: string; country: string | null }>();
  for (const chunk of chunkArray(codes, 200)) {
    if (chunk.length === 0) continue;
    const { data } = await supabase.from("airports").select("id, iata_code, country").in("iata_code", chunk);
    for (const item of data || []) {
      existingByCode.set(String(item.iata_code).toUpperCase(), {
        id: item.id,
        country: item.country ?? null,
      });
    }
  }

  const localByCode = new Map<string, NonNullable<Awaited<ReturnType<typeof findLocalAirportByIata>>>>();
  if (useLocalStorage()) {
    for (const item of await readLocalAirports()) {
      localByCode.set(item.iata_code.toUpperCase(), item);
    }
  }

  for (const row of deduped) {
    const result = await upsertImportedAirport(supabase, row, siteOrigin, existingByCode, localByCode);
    bumpStats(stats, result);
  }

  return stats;
}

export async function upsertImportedRoutes(
  supabase: SupabaseClient,
  rows: ParsedRouteRow[],
  siteOrigin: string,
): Promise<ImportUpsertStats> {
  const stats: ImportUpsertStats = { inserted: 0, updated: 0, errors: 0 };
  const deduped = dedupeRoutesBySlug(rows);
  const routeCache = await prefetchImportedRoutes(supabase);

  for (const row of deduped) {
    const result = await upsertImportedRoute(supabase, row, siteOrigin, routeCache);
    bumpStats(stats, result);
  }

  return stats;
}

export function formatImportMessage(label: string, stats: ImportUpsertStats) {
  const parts: string[] = [];
  if (stats.inserted > 0) parts.push(`${stats.inserted} new`);
  if (stats.updated > 0) parts.push(`${stats.updated} updated`);
  if (parts.length === 0 && stats.errors === 0) return `No ${label} changes`;
  if (parts.length === 0) return `${label}: ${stats.errors} failed`;
  const suffix = stats.errors > 0 ? `, ${stats.errors} failed` : "";
  return `${label}: ${parts.join(", ")}${suffix}`;
}
