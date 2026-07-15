import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import {
  deleteLocalDestination,
  findLocalDestinationBySlug,
  getLocalDestination,
  updateLocalDestination,
} from "@/lib/destination-local";
import type { DestinationRecord } from "@/types/destination";
import { withQueryTimeout } from "@/lib/supabase-query";

function withDestinationDefaults(
  destination: Partial<DestinationRecord> & Pick<DestinationRecord, "id" | "title" | "country" | "slug">,
): DestinationRecord {
  return {
    subtitle: "",
    region: "Asia",
    travel_styles: [],
    image_url: null,
    packages_count: 0,
    popular_score: 0,
    seo_title: "",
    meta_description: "",
    h1_heading: "",
    page_url: "",
    og_title: "",
    og_description: "",
    seo_keywords: "",
    status: "active",
    created_at: new Date().toISOString(),
    ...destination,
  };
}

export async function getDestinationBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await withQueryTimeout(
        supabase.from("destinations").select("*").eq("slug", slug).maybeSingle(),
        5000,
        "destination slug fetch",
      );

      if (!error && data) return data as DestinationRecord;
      if (error) logSupabaseError("destination slug fetch error:", error);
    } catch (error) {
      logSupabaseError("destination slug fetch error:", error);
    }
  }

  return findLocalDestinationBySlug(slug);
}

export async function getDestinationById(id: string) {
  if (hasSupabaseConfig()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await withQueryTimeout(
        supabase.from("destinations").select("*").eq("id", id).maybeSingle(),
        5000,
        "destination fetch",
      );

      if (!error && data) return data as DestinationRecord;
      if (error) logSupabaseError("destination fetch error:", error);
    } catch (error) {
      logSupabaseError("destination fetch error:", error);
    }
  }

  return getLocalDestination(id);
}

export async function saveDestinationById(
  id: string,
  patch: Partial<Omit<DestinationRecord, "id" | "created_at">>,
) {
  const existing = await getDestinationById(id);
  if (!existing) return null;

  const merged = withDestinationDefaults({ ...existing, ...patch, id });

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("destinations")
      .upsert(merged, { onConflict: "id" })
      .select("*")
      .single();

    if (!error && data) {
      try {
        await deleteLocalDestination(id);
      } catch (localError) {
        console.error("destination local cleanup error:", localError);
      }
      return data as DestinationRecord;
    }

    console.error("destination supabase upsert error:", error);
    return null;
  }

  try {
    return await updateLocalDestination(id, patch);
  } catch (localError) {
    console.error("destination local update error:", localError);
    return null;
  }
}

export async function removeDestinationById(id: string) {
  const existing = await getDestinationById(id);
  if (!existing) return null;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("destinations").delete().eq("id", id);
    if (error) logSupabaseError("destination supabase delete error:", error);
  }

  try {
    await deleteLocalDestination(id);
  } catch (localError) {
    console.error("destination local delete error:", localError);
  }

  return existing;
}
