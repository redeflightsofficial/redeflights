import { readLocalBanners } from "@/lib/banner-local";
import { ensureDirectImageUrl, getBannerSeoFields, getSiteOrigin } from "@/lib/banner-meta";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type { Banner } from "@/types/banner";

export async function getBannerBySlug(slug: string) {
  let banner: Banner | null = null;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) banner = data as Banner;
    if (error) console.error("banner slug fetch error:", error);
  }

  if (!banner) {
    const localBanners = await readLocalBanners();
    banner = localBanners.find((item) => item.slug === slug) ?? null;
  }

  if (!banner) return null;

  const siteOrigin = getSiteOrigin();
  const seo = getBannerSeoFields(banner, { siteOrigin });
  return {
    ...banner,
    slug: seo.slug,
    image_url: ensureDirectImageUrl(banner.image_url, { siteOrigin }),
    page_url: seo.pageUrl,
  };
}
