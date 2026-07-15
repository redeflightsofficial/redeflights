import { buildAirlineSeo } from "@/lib/airline-meta";
import { findLocalAirlineByIata, insertLocalAirline } from "@/lib/airline-local";
import { buildAirportSeo } from "@/lib/airport-meta";
import { findLocalAirportByIata, insertLocalAirport } from "@/lib/airport-local";
import { resolveAirlineIata } from "@/lib/route-meta";
import { createAdminClient } from "@/lib/supabase-admin";

export async function upsertLinkedEntities(
  input: {
    airline_name?: string;
    airline_iata_code?: string | null;
    from_airport_code?: string | null;
    to_airport_code?: string | null;
    from_city: string;
    to_city: string;
  },
  siteOrigin: string,
) {
  const supabase = createAdminClient();

  if (input.airline_name?.trim()) {
    const code = resolveAirlineIata(input.airline_name, input.airline_iata_code ?? undefined);
    if (code) {
      const seo = buildAirlineSeo(input.airline_name, code, "", siteOrigin);
      const payload = {
        name: input.airline_name.trim(),
        iata_code: code,
        slug: seo.slug,
        seo_title: seo.seo_title,
        meta_description: seo.meta_description,
        h1_heading: seo.h1_heading,
        page_url: seo.page_url,
        status: "active" as const,
      };
      const existing = await findLocalAirlineByIata(code);
      if (!existing) {
        await insertLocalAirline(payload);
        const { error } = await supabase.from("airlines").insert(payload);
        if (error) console.error("airline supabase insert error:", error);
      }
    }
  }

  const airportPairs = [
    { code: input.from_airport_code, city: input.from_city },
    { code: input.to_airport_code, city: input.to_city },
  ];

  for (const pair of airportPairs) {
    const code = pair.code?.trim().toUpperCase();
    if (!code || code.length !== 3) continue;
    const seo = buildAirportSeo(`${pair.city} Airport`, code, pair.city, "", siteOrigin);
    const payload = {
      name: `${pair.city} Airport`,
      iata_code: code,
      city: pair.city,
      slug: seo.slug,
      seo_title: seo.seo_title,
      meta_description: seo.meta_description,
      h1_heading: seo.h1_heading,
      page_url: seo.page_url,
      status: "active" as const,
    };
    const existing = await findLocalAirportByIata(code);
    if (!existing) {
      await insertLocalAirport(payload);
      const { error } = await supabase.from("airports").insert(payload);
      if (error) console.error("airport supabase insert error:", error);
    }
  }
}
