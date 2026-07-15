import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type HotelSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
};

export function buildHotelSlug(name: string, location: string) {
  const nameSlug = sanitizeSlug(name) || "hotel";
  const locationSlug = sanitizeSlug(location);
  return locationSlug ? `${nameSlug}-${locationSlug}` : nameSlug;
}

export function buildHotelPageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/hotels/${slug}` : `/hotels/${slug}`;
}

export function buildHotelSeo(
  name: string,
  location: string,
  stars = 0,
  siteOrigin = getSiteOrigin(),
): HotelSeoMeta {
  const cleanName = name.trim() || "Hotel";
  const cleanLocation = location.trim() || "Destination";
  const starLabel = stars > 0 ? `${stars} Star ` : "";
  const label = `${cleanName} ${cleanLocation}`;
  const slug = buildHotelSlug(cleanName, cleanLocation);

  const seo_title = `${cleanName} Hotel in ${cleanLocation} | Book with REDE FLIGHTS`;
  const h1_heading = `${cleanName} ${starLabel}Hotel in ${cleanLocation}`;
  const meta_description = `Book ${cleanName} in ${cleanLocation} with REDE FLIGHTS. Get trusted hotel support, verified stay options and quick travel assistance.`;
  const og_title = `${cleanName} Hotel | REDE FLIGHTS`;
  const og_description = `Explore ${cleanName} in ${cleanLocation} with REDE FLIGHTS hotel booking support.`;
  const seo_keywords = [
    `${cleanName.toLowerCase()} hotel`,
    `${cleanLocation.toLowerCase()} hotels`,
    `${cleanName.toLowerCase()} ${cleanLocation.toLowerCase()}`,
    `${starLabel.toLowerCase()}hotel booking`,
    "rede flights hotels",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    slug,
    seo_title,
    meta_description,
    h1_heading,
    page_url: buildHotelPageUrl(slug, siteOrigin),
    og_title,
    og_description,
    seo_keywords,
  };
}
