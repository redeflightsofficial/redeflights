import { buildSeoFieldsFromSlug, getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type RouteSeoMeta = {
  slug: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
};

export function buildRouteSlug(
  fromCity: string,
  toCity: string,
  airlineName = "",
  fromAirportCode = "",
  toAirportCode = "",
) {
  const from = sanitizeSlug(fromCity) || "origin";
  const to = sanitizeSlug(toCity) || "destination";
  const base = `${from}-to-${to}`;
  const airline = sanitizeSlug(airlineName.trim());
  if (airline) return `${base}-${airline}`;

  const fromCode = sanitizeAirportIataCode(fromAirportCode);
  const toCode = sanitizeAirportIataCode(toAirportCode);
  if (fromCode && toCode) return `${base}-${fromCode.toLowerCase()}-${toCode.toLowerCase()}`;

  return base;
}

export type RouteIdentityFields = {
  from_city: string;
  to_city: string;
  airline_name?: string | null;
  from_airport_code?: string | null;
  to_airport_code?: string | null;
};

export function buildRouteIdentityKey(row: RouteIdentityFields) {
  const norm = (value?: string | null) => String(value || "").trim().toLowerCase();
  const normCode = (value?: string | null) => String(value || "").trim().toUpperCase();
  return [
    norm(row.from_city),
    norm(row.to_city),
    norm(row.airline_name),
    normCode(row.from_airport_code),
    normCode(row.to_airport_code),
  ].join("|");
}

export function routesMatchForDedup(left: RouteIdentityFields, right: RouteIdentityFields) {
  if (buildRouteIdentityKey(left) === buildRouteIdentityKey(right)) return true;

  const sameFromTo =
    left.from_city.trim().toLowerCase() === right.from_city.trim().toLowerCase() &&
    left.to_city.trim().toLowerCase() === right.to_city.trim().toLowerCase();
  if (!sameFromTo) return false;

  const hasMeta = (row: RouteIdentityFields) =>
    Boolean(
      String(row.airline_name || "").trim() ||
        String(row.from_airport_code || "").trim() ||
        String(row.to_airport_code || "").trim(),
    );

  const leftHasMeta = hasMeta(left);
  const rightHasMeta = hasMeta(right);

  if (!leftHasMeta && !rightHasMeta) return true;
  if (!leftHasMeta && rightHasMeta) return true;

  return false;
}

export function buildRoutePageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/flights/${slug}` : `/flights/${slug}`;
}

export function buildRouteOgTitle(fromCity: string, toCity: string) {
  const from = fromCity.trim();
  const to = toCity.trim();
  return `${from} to ${to} Flights | REDE FLIGHTS`;
}

export function buildRouteOgDescription(fromCity: string, toCity: string) {
  const from = fromCity.trim();
  const to = toCity.trim();
  return `Book cheap flights from ${from} to ${to} with REDE FLIGHTS. Compare fares and enquire now.`;
}

export function buildRouteSeoKeywords(fromCity: string, toCity: string, airlineName = "") {
  const from = fromCity.trim().toLowerCase();
  const to = toCity.trim().toLowerCase();
  const keywords = [
    `${from} to ${to} flights`,
    `cheap flights ${from}`,
    `${to} flights`,
    "book flights online",
    "rede flights",
  ];
  const airline = airlineName.trim().toLowerCase();
  if (airline) keywords.push(`${airline} flights`);
  return keywords.join(", ");
}

export function buildRouteSeo(
  fromCity: string,
  toCity: string,
  siteOrigin = getSiteOrigin(),
  airlineName = "",
  fromAirportCode = "",
  toAirportCode = "",
): RouteSeoMeta {
  const slug = buildRouteSlug(fromCity, toCity, airlineName, fromAirportCode, toAirportCode);
  const seo = buildSeoFieldsFromSlug(slug);
  const ogTitle = buildRouteOgTitle(fromCity, toCity);
  const ogDescription = buildRouteOgDescription(fromCity, toCity);
  const seoKeywords = buildRouteSeoKeywords(fromCity, toCity, airlineName);

  return {
    slug,
    og_title: ogTitle,
    og_description: ogDescription,
    seo_keywords: seoKeywords,
    seo_title: ogTitle,
    meta_description: ogDescription,
    h1_heading: seo.h1Heading,
    page_url: buildRoutePageUrl(slug, siteOrigin),
  };
}

export function guessAirlineCodeFromName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export function resolveAirlineIata(name: string, provided?: string | null) {
  const code = String(provided || "").trim().toUpperCase();
  if (/^[A-Z0-9]{2}$/.test(code)) return code;
  if (name.trim()) return guessAirlineCodeFromName(name);
  return "";
}

export function sanitizeAirportIataCode(value?: string | null) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}
