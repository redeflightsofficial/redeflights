import type { EntityStatus } from "@/types/airline";

export type Route = {
  id: string;
  from_city: string;
  to_city: string;
  from_airport_code?: string | null;
  to_airport_code?: string | null;
  airline_name?: string | null;
  airline_iata_code?: string | null;
  slug: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  status: EntityStatus;
  created_at: string;
};
