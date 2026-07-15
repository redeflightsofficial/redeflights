import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type VisaSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
};

export function buildVisaSlug(country: string, visaType: string) {
  const countrySlug = sanitizeSlug(country) || "destination";
  const typeSlug = sanitizeSlug(visaType);
  if (!typeSlug) return `${countrySlug}-visa`;
  return `${countrySlug}-${typeSlug}-visa`;
}

export function buildVisaPageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/visa/${slug}` : `/visa/${slug}`;
}

export function buildVisaSeo(
  country: string,
  visaType: string,
  processingTime = "",
  siteOrigin = getSiteOrigin(),
): VisaSeoMeta {
  const cleanCountry = country.trim() || "Destination";
  const cleanType = visaType.trim();
  const slug = buildVisaSlug(cleanCountry, cleanType);
  const label = cleanType ? `${cleanCountry} ${cleanType} Visa` : `${cleanCountry} Visa`;
  const processingSuffix = processingTime.trim() ? ` Processing in ${processingTime.trim()}.` : "";

  const seo_title = `${label} | Apply with REDE FLIGHTS`;
  const h1_heading = `${label} Services`;
  const meta_description = `Apply for ${label.toLowerCase()} with REDE FLIGHTS. Expert document guidance, high success rate and fast support.${processingSuffix}`;
  const og_title = `${label} | REDE FLIGHTS`;
  const og_description = `Get expert help for your ${label.toLowerCase()} application with REDE FLIGHTS.`;
  const seo_keywords = cleanType
    ? [
        `${cleanCountry.toLowerCase()} visa`,
        `${cleanType.toLowerCase()} visa`,
        `${cleanCountry.toLowerCase()} ${cleanType.toLowerCase()} visa application`,
        "visa services",
        "rede flights visa",
      ].join(", ")
    : [
        `${cleanCountry.toLowerCase()} visa`,
        `${cleanCountry.toLowerCase()} visa application`,
        "visa services",
        "rede flights visa",
      ].join(", ");

  return {
    slug,
    seo_title,
    meta_description,
    h1_heading,
    page_url: buildVisaPageUrl(slug, siteOrigin),
    og_title,
    og_description,
    seo_keywords,
  };
}
