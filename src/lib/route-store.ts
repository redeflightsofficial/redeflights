import { useLocalStorage } from "@/lib/storage-mode";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import { deleteLocalRoute, findLocalRouteBySlug, getLocalRoute, updateLocalRoute } from "@/lib/route-local";
import type { Route } from "@/types/route";

function withRouteDefaults(route: Partial<Route> & Pick<Route, "id" | "from_city" | "to_city" | "slug">): Route {
  return {
    from_airport_code: null,
    to_airport_code: null,
    airline_name: null,
    airline_iata_code: null,
    og_title: "",
    og_description: "",
    seo_keywords: "",
    seo_title: "",
    meta_description: "",
    h1_heading: "",
    page_url: "",
    status: "active",
    created_at: new Date().toISOString(),
    ...route,
  };
}

export async function getRouteBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("routes").select("*").eq("slug", slug).maybeSingle();

    if (!error && data) {
      return data as Route;
    }

    if (error) {
      console.error("route slug fetch error:", error);
    }
  }

  return findLocalRouteBySlug(slug);
}

export async function getRouteById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("routes").select("*").eq("id", id).maybeSingle();

  if (!error && data) {
    return data as Route;
  }

  if (error) {
    console.error("route fetch error:", error);
  }

  return getLocalRoute(id);
}

export async function saveRouteById(
  id: string,
  patch: Partial<Omit<Route, "id" | "created_at">>,
) {
  const existing = await getRouteById(id);
  if (!existing) return null;

  const merged = withRouteDefaults({ ...existing, ...patch, id });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("routes")
    .upsert(merged, { onConflict: "id" })
    .select("*")
    .single();

  if (!error && data) {
    try {
      await deleteLocalRoute(id);
    } catch (localError) {
      console.error("route local cleanup error:", localError);
    }
    return data as Route;
  }

  console.error("route supabase upsert error:", error);

  if (useLocalStorage()) {
    try {
      return await updateLocalRoute(id, patch);
    } catch (localError) {
      console.error("route local update error:", localError);
      return null;
    }
  }

  return null;
}

export async function removeRouteById(id: string) {
  const existing = await getRouteById(id);
  if (!existing) return null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("routes").delete().eq("id", id);
  if (error) {
    console.error("route supabase delete error:", error);
  }

  try {
    await deleteLocalRoute(id);
  } catch (localError) {
    console.error("route local delete error:", localError);
  }

  return existing;
}
