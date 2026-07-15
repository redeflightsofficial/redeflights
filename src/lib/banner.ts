import type { Banner, BannerSlide } from "@/types/banner";
import { resolveUniqueBannerFileName } from "@/lib/banner-meta";

export {
  buildBannerMetaFromFileName,
  buildDirectBannerImageUrl,
  buildSeoBannerFileName,
  buildSeoFieldsFromSlug,
  ensureDirectImageUrl,
  extractBannerFileName,
  generateAltFromSlug,
  generateH1FromSlug,
  generateMetaDescriptionFromSlug,
  generateSeoTitleFromSlug,
  generateSlugFromFileName,
  getBannerSeoFields,
  getSiteOrigin,
} from "@/lib/banner-meta";

export const BANNER_BUCKET = "banners";
export const BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const BANNER_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function bannersToSlides(banners: Banner[]): BannerSlide[] {
  return banners.map((banner) => ({
    src: banner.image_url,
    alt: banner.alt || "REDE I FLIGHTS Promotion",
  }));
}

export function getBannerPublicUrl(supabaseUrl: string, storagePath: string) {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BANNER_BUCKET}/${storagePath}`;
}

export function buildBannerStoragePath(fileName: string, existingNames: string[] = []) {
  return resolveUniqueBannerFileName(fileName, existingNames);
}
