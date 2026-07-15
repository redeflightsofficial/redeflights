import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type AirportSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
};

export function buildAirportSlug(name: string, iataCode: string, city = "") {
  const cityPart = sanitizeSlug(city) || sanitizeSlug(name) || "airport";
  const code = sanitizeSlug(iataCode);
  return code ? `${cityPart}-${code}` : sanitizeSlug(name) || "airport";
}

export function buildAirportPageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/airports/${slug}` : `/airports/${slug}`;
}

export function buildAirportSeo(
  name: string,
  iataCode: string,
  city = "",
  country = "",
  siteOrigin = getSiteOrigin(),
): AirportSeoMeta {
  const cleanName = name.trim() || "Airport";
  const code = iataCode.trim().toUpperCase();
  const cityLabel = city.trim() || cleanName;
  const slug = buildAirportSlug(cleanName, code, cityLabel);
  const countrySuffix = country.trim() ? `, ${country.trim()}` : "";

  return {
    slug,
    seo_title: `${cityLabel} Airport (${code}) Flights | REDE FLIGHTS`,
    h1_heading: `${cityLabel} Airport (${code}) Flights`,
    meta_description: `Find cheap flights to and from ${cityLabel} Airport (${code})${countrySuffix} with REDE FLIGHTS.`,
    page_url: buildAirportPageUrl(slug, siteOrigin),
  };
}
