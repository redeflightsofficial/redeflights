import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type { TourPackage } from "@/types/tour-package";

export async function getPackageById(id: string) {
  if (!hasSupabaseConfig()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tour_packages").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("package fetch error:", error);
    return null;
  }

  return (data as TourPackage | null) ?? null;
}

export async function savePackageById(
  id: string,
  patch: Partial<Omit<TourPackage, "id" | "created_at">>,
) {
  const existing = await getPackageById(id);
  if (!existing) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tour_packages")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("package update error:", error);
    return null;
  }

  return data as TourPackage;
}

export async function removePackageById(id: string) {
  const existing = await getPackageById(id);
  if (!existing) return null;

  const supabase = createAdminClient();
  const { error } = await supabase.from("tour_packages").delete().eq("id", id);

  if (error) {
    console.error("package delete error:", error);
    return null;
  }

  return existing;
}
