import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { deleteLocalVisa, findLocalVisaBySlug, getLocalVisa, updateLocalVisa } from "@/lib/visa-local";
import type { Visa } from "@/types/visa";

function withVisaDefaults(visa: Partial<Visa> & Pick<Visa, "id" | "country" | "slug">): Visa {
  return {
    processing_time: null,
    description: null,
    image_url: null,
    storage_path: null,
    seo_title: "",
    meta_description: "",
    h1_heading: "",
    page_url: "",
    og_title: "",
    og_description: "",
    seo_keywords: "",
    status: "active",
    created_at: new Date().toISOString(),
    ...visa,
  };
}

export async function getVisaBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("visas").select("*").eq("slug", slug).maybeSingle();

    if (!error && data) {
      return data as Visa;
    }

    if (error) {
      console.error("visa slug fetch error:", error);
    }
  }

  return findLocalVisaBySlug(slug);
}

export async function getVisaById(id: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("visas").select("*").eq("id", id).maybeSingle();

    if (!error && data) {
      return data as Visa;
    }

    if (error) {
      console.error("visa fetch error:", error);
    }
  }

  return getLocalVisa(id);
}

export async function saveVisaById(
  id: string,
  patch: Partial<Omit<Visa, "id" | "created_at">>,
) {
  const existing = await getVisaById(id);
  if (!existing) return null;

  const merged = withVisaDefaults({ ...existing, ...patch, id });

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("visas")
      .upsert(merged, { onConflict: "id" })
      .select("*")
      .single();

    if (!error && data) {
      try {
        await deleteLocalVisa(id);
      } catch (localError) {
        console.error("visa local cleanup error:", localError);
      }
      return data as Visa;
    }

    console.error("visa supabase upsert error:", error);
    return null;
  }

  try {
    return await updateLocalVisa(id, patch);
  } catch (localError) {
    console.error("visa local update error:", localError);
    return null;
  }
}

export async function removeVisaById(id: string) {
  const existing = await getVisaById(id);
  if (!existing) return null;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { error } = await supabase.from("visas").delete().eq("id", id);
    if (error) {
      console.error("visa supabase delete error:", error);
    }
  }

  try {
    await deleteLocalVisa(id);
  } catch (localError) {
    console.error("visa local delete error:", localError);
  }

  return existing;
}
