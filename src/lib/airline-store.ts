import { readLocalAirlines } from "@/lib/airline-local";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";
import type { Airline } from "@/types/airline";

export async function getAirlineBySlug(slug: string) {
  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("airlines")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) return data as Airline;
    if (error) console.error("airline slug fetch error:", error);
  }

  const airlines = await readLocalAirlines();
  return airlines.find((item) => item.slug === slug) ?? null;
}

export async function getAirlineByIataCode(iataCode: string) {
  const code = iataCode.trim().toUpperCase();
  if (!code) return null;

  if (hasSupabaseConfig()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("airlines")
      .select("*")
      .eq("iata_code", code)
      .maybeSingle();

    if (!error && data) return data as Airline;
    if (error) console.error("airline iata fetch error:", error);
  }

  const airlines = await readLocalAirlines();
  return airlines.find((item) => item.iata_code.trim().toUpperCase() === code) ?? null;
}
