import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type AirlineSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
};

export function buildAirlineSlug(name: string, iataCode = "") {
  const base = sanitizeSlug(name) || "airline";
  const code = sanitizeSlug(iataCode);
  return code ? `${base}-${code}` : base;
}

export function buildAirlinePageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/airlines/${slug}` : `/airlines/${slug}`;
}

export function buildAirlineSeo(
  name: string,
  iataCode = "",
  country = "",
  siteOrigin = getSiteOrigin(),
): AirlineSeoMeta {
  const cleanName = name.trim() || "Airline";
  const code = iataCode.trim().toUpperCase();
  const slug = buildAirlineSlug(cleanName, code);
  const codeSuffix = code ? ` (${code})` : "";
  const countrySuffix = country.trim() ? ` in ${country.trim()}` : "";

  return {
    slug,
    seo_title: `${cleanName}${codeSuffix} Flights | Book with REDE FLIGHTS`,
    h1_heading: `${cleanName} Flights`,
    meta_description: `Book ${cleanName} flights${countrySuffix} at the best fares with REDE FLIGHTS. Compare deals and enquire now.`,
    page_url: buildAirlinePageUrl(slug, siteOrigin),
  };
}
