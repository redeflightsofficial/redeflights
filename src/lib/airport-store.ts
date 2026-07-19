import { readLocalAirports } from "@/lib/airport-local";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type { Airport } from "@/types/airport";

export async function getAirportBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("airports")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) return data as Airport;
    if (error) console.error("airport slug fetch error:", error);
  }

  const airports = await readLocalAirports();
  return airports.find((item) => item.slug === slug) ?? null;
}
