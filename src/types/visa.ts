import type { EntityStatus } from "@/types/airline";

export type Visa = {
  id: string;
  country: string;
  visa_type?: string | null;
  processing_time?: string | null;
  description?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  slug: string;
  seo_title: string;
  meta_description: string;
  h1_heading: string;
  page_url: string;
  og_title: string;
  og_description: string;
  seo_keywords: string;
  status: EntityStatus;
  created_at: string;
};
