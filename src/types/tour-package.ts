import type { EntityStatus } from "@/types/airline";

export type TourPackage = {
  id: string;
  title: string;
  tag: string;
  route: string;
  duration: string;
  region: string;
  theme: string;
  includes: string[];
  image_url: string | null;
  storage_path: string | null;
  slug: string;
  sort_order: number;
  status: EntityStatus;
  created_at: string;
};
