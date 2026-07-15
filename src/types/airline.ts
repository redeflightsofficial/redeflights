export type EntityStatus = "pending" | "active";

export type Airline = {
  id: string;
  name: string;
  iata_code: string;
  icao_code?: string | null;
  country?: string | null;
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  status: EntityStatus;
  created_at: string;
};
