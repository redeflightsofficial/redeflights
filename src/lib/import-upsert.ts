import { buildAirlineSeo } from "@/lib/airline-meta";
import { findLocalAirlineByIata, insertLocalAirline, updateLocalAirline, deleteLocalAirline } from "@/lib/airline-local";
import { buildAirportSeo } from "@/lib/airport-meta";
import { findLocalAirportByIata, insertLocalAirport, updateLocalAirport, deleteLocalAirport } from "@/lib/airport-local";
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

async function findMatchingImportedRoutes(
  supabase: SupabaseClient,
  row: ParsedRouteRow,
  slug: string,
) {
  const { data: bySlug } = await supabase
    .from("routes")
    .select("id, slug, from_city, to_city, airline_name, from_airport_code, to_airport_code")
    .eq("slug", slug);

  const { data: byCities } = await supabase
    .from("routes")
    .select("id, slug, from_city, to_city, airline_name, from_airport_code, to_airport_code")
    .ilike("from_city", row.from_city.trim())
    .ilike("to_city", row.to_city.trim());

  const unique = new Map<string, StoredRouteMatch>();
  for (const record of [...(bySlug || []), ...(byCities || [])]) {
    unique.set(record.id, record as StoredRouteMatch);
  }

  return Array.from(unique.values()).filter((record) => routesMatchForDedup(record, row));
}

function bumpStats(stats: ImportUpsertStats, result: "inserted" | "updated" | "error") {
  if (result === "inserted") stats.inserted += 1;
  else if (result === "updated") stats.updated += 1;
  else stats.errors += 1;
}

export async function upsertImportedAirline(
  supabase: SupabaseClient,
  row: ParsedAirlineRow,
  siteOrigin: string,
): Promise<"inserted" | "updated" | "error"> {
  const iataCode = row.iata_code.trim().toUpperCase();
  const { data: existing } = await supabase
    .from("airlines")
    .select("id, country")
    .eq("iata_code", iataCode)
    .maybeSingle();

  const localExisting = await findLocalAirlineByIata(iataCode);
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
): Promise<"inserted" | "updated" | "error"> {
  const iataCode = row.iata_code.trim().toUpperCase();
  const { data: existing } = await supabase
    .from("airports")
    .select("id, country")
    .eq("iata_code", iataCode)
    .maybeSingle();

  const localExisting = await findLocalAirportByIata(iataCode);
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

  const { data: existing } = await supabase
    .from("routes")
    .select("id")
    .eq("slug", seo.slug)
    .maybeSingle();

  const matches = await findMatchingImportedRoutes(supabase, row, seo.slug);
  const primary = matches[0] ?? (existing ? { id: existing.id } : null);

  if (primary?.id) {
    const { error } = await supabase.from("routes").update(payload).eq("id", primary.id);
    if (!error) {
      for (const duplicate of matches.slice(1)) {
        await supabase.from("routes").delete().eq("id", duplicate.id);
        await safeLocalCleanup(() => deleteLocalRoute(duplicate.id));
      }
      const localDuplicate = await findLocalRouteBySlug(seo.slug);
      if (localDuplicate && localDuplicate.id !== primary.id) {
        await safeLocalCleanup(() => deleteLocalRoute(localDuplicate.id));
      }
      return "updated";
    }
  } else {
    const { error } = await supabase.from("routes").insert(payload);
    if (!error) {
      const localDuplicate = await findLocalRouteBySlug(seo.slug);
      if (localDuplicate) await safeLocalCleanup(() => deleteLocalRoute(localDuplicate.id));
      return "inserted";
    }
  }

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

  if (useLocalStorage()) {
    try {
      await insertLocalRoute(payload);
      return "inserted";
    } catch {
      return "error";
    }
  }

  return "error";
}

export async function upsertImportedAirlines(
  supabase: SupabaseClient,
  rows: ParsedAirlineRow[],
  siteOrigin: string,
): Promise<ImportUpsertStats> {
  const stats: ImportUpsertStats = { inserted: 0, updated: 0, errors: 0 };
  const deduped = dedupeByKey(rows, (row) => row.iata_code);

  for (const row of deduped) {
    const result = await upsertImportedAirline(supabase, row, siteOrigin);
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

  for (const row of deduped) {
    const result = await upsertImportedAirport(supabase, row, siteOrigin);
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

  for (const row of deduped) {
    const result = await upsertImportedRoute(supabase, row, siteOrigin);
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
