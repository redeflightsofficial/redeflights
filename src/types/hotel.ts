import type { EntityStatus } from "@/types/airline";

export type Hotel = {
  id: string;
  name: string;
  location: string;
  stars: number;
  rating?: string | null;
  reviews?: string | null;
  amenities: string[];
  description?: string | null;
  image_url?: string | null;
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
