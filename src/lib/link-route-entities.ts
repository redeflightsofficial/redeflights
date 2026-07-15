import { buildAirlineSeo } from "@/lib/airline-meta";
import { findLocalAirlineByIata, insertLocalAirline, readDeletedAirlineCodes } from "@/lib/airline-local";
import { buildAirportSeo } from "@/lib/airport-meta";
import { insertLocalAirport, readDeletedAirportCodes } from "@/lib/airport-local";
import { resolveAirlineIata } from "@/lib/route-meta";
import { readLocalRoutes } from "@/lib/route-local";
import { createAdminClient } from "@/lib/supabase-admin";
import { useLocalStorage } from "@/lib/storage-mode";

export async function syncLocalAirlinesFromRoutes(siteOrigin: string) {
  if (!useLocalStorage()) return;

  const routes = await readLocalRoutes();
  const deletedCodes = new Set(await readDeletedAirlineCodes());
  const seen = new Set<string>();

  for (const route of routes) {
    const name = route.airline_name?.trim();
    if (!name) continue;

    const code = resolveAirlineIata(name, route.airline_iata_code || undefined);
    if (!code || seen.has(code) || deletedCodes.has(code)) continue;

    const existing = await findLocalAirlineByIata(code);
    if (existing) {
      seen.add(code);
      continue;
    }

    const seo = buildAirlineSeo(name, code, "", siteOrigin);
    await insertLocalAirline({
      name,
      iata_code: code,
      icao_code: null,
      country: null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: "active",
    });
    seen.add(code);
  }
}

async function airlineExists(iataCode: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("airlines")
    .select("id")
    .eq("iata_code", iataCode)
    .maybeSingle();
  return Boolean(data);
}

async function airportExists(iataCode: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("airports")
    .select("id")
    .eq("iata_code", iataCode)
    .maybeSingle();
  return Boolean(data);
}

export async function upsertLinkedEntities(
  input: {
    airline_name?: string | null;
    airline_iata_code?: string | null;
    from_airport_code?: string | null;
    to_airport_code?: string | null;
    from_city: string;
    to_city: string;
  },
  siteOrigin: string,
) {
  const deletedAirlineCodes = new Set((await readDeletedAirlineCodes()).map((code) => code.toUpperCase()));
  const deletedAirportCodes = new Set((await readDeletedAirportCodes()).map((code) => code.toUpperCase()));

  if (input.airline_name?.trim()) {
    const code = resolveAirlineIata(input.airline_name, input.airline_iata_code);
    if (code && !deletedAirlineCodes.has(code)) {
      const seo = buildAirlineSeo(input.airline_name, code, "", siteOrigin);
      const payload = {
        name: input.airline_name.trim(),
        iata_code: code,
        icao_code: null,
        country: null,
        slug: seo.slug,
        seo_title: seo.seo_title,
        meta_description: seo.meta_description,
        h1_heading: seo.h1_heading,
        page_url: seo.page_url,
        status: "active" as const,
      };

      if (useLocalStorage()) {
        const { findLocalAirlineByIata } = await import("@/lib/airline-local");
        const existing = await findLocalAirlineByIata(code);
        if (!existing) await insertLocalAirline(payload);
      } else {
        const exists = await airlineExists(code);
        if (!exists) {
          const supabase = createAdminClient();
          const { error } = await supabase.from("airlines").insert(payload);
          if (error) console.error("airline link insert error:", error);
        }
      }
    }
  }

  const airportPairs = [
    { code: input.from_airport_code, city: input.from_city },
    { code: input.to_airport_code, city: input.to_city },
  ];

  for (const pair of airportPairs) {
    const code = pair.code?.trim().toUpperCase();
    if (!code || code.length !== 3 || deletedAirportCodes.has(code)) continue;

    const seo = buildAirportSeo(`${pair.city} Airport`, code, pair.city, "", siteOrigin);
    const payload = {
      name: `${pair.city} Airport`,
      iata_code: code,
      city: pair.city,
      country: null,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: "active" as const,
    };

    if (useLocalStorage()) {
      const { findLocalAirportByIata } = await import("@/lib/airport-local");
      const existing = await findLocalAirportByIata(code);
      if (!existing) await insertLocalAirport(payload);
    } else {
      const exists = await airportExists(code);
      if (!exists) {
        const supabase = createAdminClient();
        const { error } = await supabase.from("airports").insert(payload);
        if (error) console.error("airport link insert error:", error);
      }
    }
  }
}
