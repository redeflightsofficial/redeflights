import { createAdminClient, hasSupabaseConfig, isIgnorableSupabaseError, logSupabaseError } from "@/lib/supabase-admin";
import {
  deleteLocalUmrahPackage,
  findLocalUmrahBySlug,
  getLocalUmrahPackage,
  updateLocalUmrahPackage,
} from "@/lib/umrah-local";
import type { UmrahPackage } from "@/types/umrah";

function withUmrahDefaults(
  pkg: Partial<UmrahPackage> & Pick<UmrahPackage, "id" | "title" | "slug">,
): UmrahPackage {
  return {
    package_code: "",
    departure_city: "",
    destination: "Makkah & Madinah",
    hotel_category: "",
    hotel_name: "",
    nights: 0,
    airline: "",
    price_aed: "",
    visa_included: false,
    transfer_included: false,
    focus_keyword: "",
    short_description: "",
    long_description: "",
    h2_heading: "",
    image_url: null,
    image_alt: "",
    faqs: [],
    schema_description: "",
    instagram_caption: "",
    instagram_hashtags: "",
    internal_links: "",
    seo_title: "",
    meta_description: "",
    h1_heading: "",
    page_url: "",
    og_title: "",
    og_description: "",
    seo_keywords: "",
    status: "active",
    created_at: new Date().toISOString(),
    ...pkg,
  };
}

export async function getUmrahBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("umrah_packages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) return data as UmrahPackage;
      if (error) logSupabaseError("umrah slug fetch error:", error);
    } catch (error) {
      logSupabaseError("umrah slug fetch error:", error);
    }
  }

  return findLocalUmrahBySlug(slug);
}

export async function getUmrahById(id: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("umrah_packages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) return data as UmrahPackage;
      if (error) logSupabaseError("umrah fetch error:", error);
    } catch (error) {
      logSupabaseError("umrah fetch error:", error);
    }
  }

  return getLocalUmrahPackage(id);
}

export async function saveUmrahById(
  id: string,
  patch: Partial<Omit<UmrahPackage, "id" | "created_at">>,
) {
  const existing = await getUmrahById(id);
  if (!existing) return null;

  const merged = withUmrahDefaults({ ...existing, ...patch, id });

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("umrah_packages")
        .upsert(merged, { onConflict: "id" })
        .select("*")
        .single();

      if (!error && data) {
        try {
          await deleteLocalUmrahPackage(id);
        } catch (localError) {
          console.error("umrah local cleanup error:", localError);
        }
        return data as UmrahPackage;
      }

      if (!isIgnorableSupabaseError(error)) {
        logSupabaseError("umrah supabase upsert error:", error);
      }
    } catch (error) {
      if (!isIgnorableSupabaseError(error)) {
        logSupabaseError("umrah supabase upsert error:", error);
      }
    }
  }

  try {
    return await updateLocalUmrahPackage(id, patch);
  } catch (localError) {
    console.error("umrah local update error:", localError);
    return null;
  }
}

export async function removeUmrahById(id: string) {
  const existing = await getUmrahById(id);
  if (!existing) return null;

  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("umrah_packages").delete().eq("id", id);
      if (error) logSupabaseError("umrah supabase delete error:", error);
    } catch (error) {
      logSupabaseError("umrah supabase delete error:", error);
    }
  }

  try {
    await deleteLocalUmrahPackage(id);
  } catch (localError) {
    console.error("umrah local delete error:", localError);
  }

  return existing;
}
