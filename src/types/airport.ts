import type { EntityStatus } from "@/types/airline";

export type Airport = {
  id: string;
  name: string;
  iata_code: string;
  city: string;
  country?: string | null;
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  status: EntityStatus;
  created_at: string;
};
