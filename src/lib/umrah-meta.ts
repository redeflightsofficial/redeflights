import { getSiteOrigin } from "@/lib/banner-meta";
import { sanitizeSlug } from "@/lib/slug-utils";

export type UmrahSeoMeta = {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
};

export function buildUmrahSlug(title: string, nights?: number | string, departureCity = "") {
  const fromTitle = sanitizeSlug(title);
  if (fromTitle) return fromTitle;

  const nightsPart = String(nights || "").trim();
  const cityPart = sanitizeSlug(departureCity);
  if (nightsPart && cityPart) return `umrah-package-from-${cityPart}-${nightsPart}-nights`;
  if (cityPart) return `umrah-package-from-${cityPart}`;
  return "umrah-package";
}

export function buildUmrahPageUrl(slug: string, siteOrigin = getSiteOrigin()) {
  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/umrah/${slug}` : `/umrah/${slug}`;
}

export function buildUmrahSeo(
  title: string,
  departureCity = "",
  nights: number | string = "",
  focusKeyword = "",
  siteOrigin = getSiteOrigin(),
): UmrahSeoMeta {
  const cleanTitle = title.trim() || "Umrah Package";
  const city = departureCity.trim() || "Dubai";
  const nightsLabel = String(nights || "").trim();
  const slug = buildUmrahSlug(cleanTitle, nightsLabel, city);
  const keyword = focusKeyword.trim() || `Umrah Package from ${city}`;
  const nightsPrefix = nightsLabel ? `${nightsLabel} Nights ` : "";

  const seo_title = `${nightsPrefix}Umrah Package from ${city} | REDE FLIGHTS`;
  const h1_heading = `${nightsPrefix}Umrah Package from ${city}`.trim();
  const meta_description = `Book a ${nightsPrefix.toLowerCase()}Umrah package from ${city} with visa assistance, hotel and transfers.`.replace(
    /\s+/g,
    " ",
  );
  const og_title = nightsLabel ? `${nightsLabel} Nights Umrah Package` : cleanTitle;
  const og_description = `Affordable Umrah from ${city}`;
  const seo_keywords = [
    keyword,
    `umrah from ${city.toLowerCase()}`,
    "umrah package",
    "makkah madinah",
    "rede flights umrah",
  ].join(", ");

  return {
    slug,
    seo_title,
    meta_description,
    h1_heading,
    page_url: buildUmrahPageUrl(slug, siteOrigin),
    og_title,
    og_description,
    seo_keywords,
  };
}

export function parseUmrahFaqs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseYesNo(value: unknown, fallback = false) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["yes", "true", "1", "y"].includes(raw);
}
