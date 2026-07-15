import { readLocalAirlines } from "@/lib/airline-local";
import { readLocalAirports } from "@/lib/airport-local";
import { readLocalBanners } from "@/lib/banner-local";
import { readLocalDestinations } from "@/lib/destination-local";
import { readLocalHotels } from "@/lib/hotel-local";
import { readLocalRoutes } from "@/lib/route-local";
import { createAdminClient, hasSupabaseConfig, logSupabaseError } from "@/lib/supabase-admin";
import { withQueryTimeout } from "@/lib/supabase-query";
import { readLocalVisas } from "@/lib/visa-local";
import type { ActivityType, RecentActivity } from "@/types/activity";
import type { Airline } from "@/types/airline";
import type { Airport } from "@/types/airport";
import type { Banner } from "@/types/banner";
import type { DestinationRecord } from "@/types/destination";
import type { Enquiry } from "@/types/enquiry";
import type { Hotel } from "@/types/hotel";
import type { Route } from "@/types/route";
import type { Visa } from "@/types/visa";

type Timestamped = { id: string; created_at: string };

async function loadFromTable<T extends Timestamped>(
  table: string,
  columns: string,
  label: string,
): Promise<T[]> {
  if (!hasSupabaseConfig()) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await withQueryTimeout(
      supabase.from(table).select(columns).order("created_at", { ascending: false }).limit(30),
      5000,
      `${label} activity`,
    );

    if (error) {
      logSupabaseError(`${label} activity error:`, error);
      return [];
    }

    return (data ?? []) as unknown as T[];
  } catch (error) {
    logSupabaseError(`${label} activity error:`, error);
    return [];
  }
}

function mergeById<T extends Timestamped>(remote: T[], local: T[]) {
  const seen = new Set(remote.map((item) => item.id));
  const merged = [...remote];

  for (const item of local) {
    if (!seen.has(item.id)) merged.push(item);
  }

  return merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function toActivity(
  type: ActivityType,
  id: string,
  title: string,
  subtitle: string,
  href: string,
  created_at: string,
  status?: string,
): RecentActivity {
  return {
    id: `${type}:${id}`,
    type,
    title,
    subtitle,
    href,
    created_at,
    status,
  };
}

export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const [
    enquiries,
    remoteRoutes,
    localRoutes,
    remoteAirlines,
    localAirlines,
    remoteAirports,
    localAirports,
    remoteDestinations,
    localDestinations,
    remoteHotels,
    localHotels,
    remoteVisas,
    localVisas,
    remoteBanners,
    localBanners,
  ] = await Promise.all([
    loadFromTable<Pick<Enquiry, "id" | "name" | "service" | "email" | "status" | "created_at">>(
      "enquiries",
      "id,name,service,email,status,created_at",
      "enquiries",
    ),
    loadFromTable<Route>(
      "routes",
      "id,from_city,to_city,status,created_at",
      "routes",
    ),
    readLocalRoutes(),
    loadFromTable<Airline>("airlines", "id,name,iata_code,status,created_at", "airlines"),
    readLocalAirlines(),
    loadFromTable<Airport>(
      "airports",
      "id,name,city,iata_code,status,created_at",
      "airports",
    ),
    readLocalAirports(),
    loadFromTable<DestinationRecord>(
      "destinations",
      "id,title,country,status,created_at",
      "destinations",
    ),
    readLocalDestinations(),
    loadFromTable<Hotel>("hotels", "id,name,location,status,created_at", "hotels"),
    readLocalHotels(),
    loadFromTable<Visa>("visas", "id,country,visa_type,status,created_at", "visas"),
    readLocalVisas(),
    loadFromTable<Banner>("banners", "id,alt,status,created_at", "banners"),
    readLocalBanners(),
  ]);

  const routes = mergeById(remoteRoutes, localRoutes);
  const airlines = mergeById(remoteAirlines, localAirlines);
  const airports = mergeById(remoteAirports, localAirports);
  const destinations = mergeById(remoteDestinations, localDestinations);
  const hotels = mergeById(remoteHotels, localHotels);
  const visas = mergeById(remoteVisas, localVisas);
  const banners = mergeById(remoteBanners, localBanners);

  const activities: RecentActivity[] = [
    ...enquiries.map((item) =>
      toActivity(
        "enquiry",
        item.id,
        `New enquiry from ${item.name}`,
        item.service || item.email,
        "/dashboard/enquiries",
        item.created_at,
        item.status,
      ),
    ),
    ...routes.map((item) =>
      toActivity(
        "route",
        item.id,
        `Route added: ${item.from_city} → ${item.to_city}`,
        "Flight route",
        "/dashboard/flights",
        item.created_at,
        item.status,
      ),
    ),
    ...airlines.map((item) =>
      toActivity(
        "airline",
        item.id,
        `Airline added: ${item.name}`,
        item.iata_code ? `Code ${item.iata_code}` : "Airline master",
        "/dashboard/airlines",
        item.created_at,
        item.status,
      ),
    ),
    ...airports.map((item) =>
      toActivity(
        "airport",
        item.id,
        `Airport added: ${item.city}`,
        `${item.name} (${item.iata_code})`,
        "/dashboard/airports",
        item.created_at,
        item.status,
      ),
    ),
    ...destinations.map((item) =>
      toActivity(
        "destination",
        item.id,
        `Destination added: ${item.title}`,
        item.country,
        "/dashboard/destinations",
        item.created_at,
        item.status,
      ),
    ),
    ...hotels.map((item) =>
      toActivity(
        "hotel",
        item.id,
        `Hotel added: ${item.name}`,
        item.location,
        "/dashboard/hotels",
        item.created_at,
        item.status,
      ),
    ),
    ...visas.map((item) =>
      toActivity(
        "visa",
        item.id,
        `Visa added: ${item.country}`,
        item.visa_type || "Visa service",
        "/dashboard/visa",
        item.created_at,
        item.status,
      ),
    ),
    ...banners.map((item) =>
      toActivity(
        "banner",
        item.id,
        "Banner uploaded",
        item.alt || "Homepage banner",
        "/dashboard/banner-images",
        item.created_at,
        item.status,
      ),
    ),
  ];

  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
