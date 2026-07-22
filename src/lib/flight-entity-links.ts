import type { Airline } from "@/types/airline";
import type { Airport } from "@/types/airport";

export type FlightEntitySlugs = {
  airlineSlug?: string;
  fromAirportSlug?: string;
  toAirportSlug?: string;
};

export function buildIataSlugMap<T extends { iata_code: string; slug: string }>(items: T[]) {
  const map = new Map<string, string>();
  for (const item of items) {
    const code = item.iata_code?.trim().toUpperCase();
    if (code && item.slug) map.set(code, item.slug);
  }
  return map;
}

export function resolveFlightEntitySlugs(
  airlineCode: string,
  fromCode: string,
  toCode: string,
  airlines: Airline[],
  airports: Airport[],
): FlightEntitySlugs {
  const airlineMap = buildIataSlugMap(airlines);
  const airportMap = buildIataSlugMap(airports);

  return {
    airlineSlug: airlineMap.get(airlineCode.trim().toUpperCase()),
    fromAirportSlug: airportMap.get(fromCode.trim().toUpperCase()),
    toAirportSlug: airportMap.get(toCode.trim().toUpperCase()),
  };
}

export function airlineDetailHref(slug: string) {
  return `/airlines/${encodeURIComponent(slug)}`;
}

export function airportDetailHref(slug: string) {
  return `/airports/${encodeURIComponent(slug)}`;
}
