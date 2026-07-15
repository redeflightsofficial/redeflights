import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type DestinationSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
};

export function buildDestinationSlug(title: string, country: string) {
  const titleSlug = sanitizeSlug(title) || "destination";
  const countrySlug = sanitizeSlug(country);
  return countrySlug ? `${titleSlug}-${countrySlug}` : titleSlug;
}

export function buildDestinationPageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/destinations/${slug}` : `/destinations/${slug}`;
}

export function buildDestinationSeo(
  title: string,
  country: string,
  siteOrigin = getSiteOrigin(),
): DestinationSeoMeta {
  const cleanTitle = title.trim() || "Destination";
  const cleanCountry = country.trim() || "Worldwide";
  const slug = buildDestinationSlug(cleanTitle, cleanCountry);

  const seo_title = `${cleanTitle} Travel Packages | Plan with REDE FLIGHTS`;
  const h1_heading = `Explore ${cleanTitle}`;
  const meta_description = `Plan your trip to ${cleanTitle} with REDE FLIGHTS. Get flights, hotels, visa guidance and curated travel support for ${cleanCountry}.`;
  const og_title = `${cleanTitle} | REDE FLIGHTS`;
  const og_description = `Discover ${cleanTitle} with REDE FLIGHTS travel experts.`;
  const seo_keywords = [
    `${cleanTitle.toLowerCase()} travel`,
    `${cleanCountry.toLowerCase()} packages`,
    `${cleanTitle.toLowerCase()} flights hotels`,
    "rede flights destinations",
  ].join(", ");

  return {
    slug,
    seo_title,
    meta_description,
    h1_heading,
    page_url: buildDestinationPageUrl(slug, siteOrigin),
    og_title,
    og_description,
    seo_keywords,
  };
}
