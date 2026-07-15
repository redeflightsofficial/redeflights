import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { deleteLocalHotel, findLocalHotelBySlug, getLocalHotel, updateLocalHotel } from "@/lib/hotel-local";
import type { Hotel } from "@/types/hotel";
import { withQueryTimeout } from "@/lib/supabase-query";

function withHotelDefaults(hotel: Partial<Hotel> & Pick<Hotel, "id" | "name" | "location" | "slug">): Hotel {
  return {
    stars: 0,
    rating: null,
    reviews: null,
    amenities: [],
    description: null,
    image_url: null,
    seo_title: "",
    meta_description: "",
    h1_heading: "",
    page_url: "",
    og_title: "",
    og_description: "",
    seo_keywords: "",
    status: "active",
    created_at: new Date().toISOString(),
    ...hotel,
  };
}

export async function getHotelBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await withQueryTimeout(
        supabase.from("hotels").select("*").eq("slug", slug).maybeSingle(),
        5000,
        "hotel slug fetch",
      );

      if (!error && data) return data as Hotel;
      if (error) logSupabaseError("hotel slug fetch error:", error);
    } catch (error) {
      logSupabaseError("hotel slug fetch error:", error);
    }
  }

  return findLocalHotelBySlug(slug);
}

export async function getHotelById(id: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await withQueryTimeout(
        supabase.from("hotels").select("*").eq("id", id).maybeSingle(),
        5000,
        "hotel fetch",
      );

      if (!error && data) return data as Hotel;
      if (error) logSupabaseError("hotel fetch error:", error);
    } catch (error) {
      logSupabaseError("hotel fetch error:", error);
    }
  }

  return getLocalHotel(id);
}

export async function saveHotelById(
  id: string,
  patch: Partial<Omit<Hotel, "id" | "created_at">>,
) {
  const existing = await getHotelById(id);
  if (!existing) return null;

  const merged = withHotelDefaults({ ...existing, ...patch, id });

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("hotels")
      .upsert(merged, { onConflict: "id" })
      .select("*")
      .single();

    if (!error && data) {
      try {
        await deleteLocalHotel(id);
      } catch (localError) {
        console.error("hotel local cleanup error:", localError);
      }
      return data as Hotel;
    }

    console.error("hotel supabase upsert error:", error);
    return null;
  }

  try {
    return await updateLocalHotel(id, patch);
  } catch (localError) {
    console.error("hotel local update error:", localError);
    return null;
  }
}

export async function removeHotelById(id: string) {
  const existing = await getHotelById(id);
  if (!existing) return null;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("hotels").delete().eq("id", id);
    if (error) console.error("hotel supabase delete error:", error);
  }

  try {
    await deleteLocalHotel(id);
  } catch (localError) {
    console.error("hotel local delete error:", localError);
  }

  return existing;
}
