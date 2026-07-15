import type { EntityStatus } from "@/types/airline";

export type DestinationRegion =
  | "All Regions"
  | "Asia"
  | "Europe"
  | "Middle East"
  | "Americas";

export type DestinationTravelStyle =
  | "All Styles"
  | "Beach & Island"
  | "City Breaks"
  | "Adventure"
  | "Family Holidays";

export type DestinationSortBy = "popular" | "packages" | "name";

export type DestinationSourceTag = "manual" | "hotel" | "visa" | "flight";

export interface Destination {
  id: string;
  title: string;
  subtitle: string;
  country: string;
  packages: number;
  region: Exclude<DestinationRegion, "All Regions">;
  travelStyles: Exclude<DestinationTravelStyle, "All Styles">[];
  image: string;
  popularScore: number;
  sources?: DestinationSourceTag[];
}

export type DestinationRecord = {
  id: string;
  title: string;
  country: string;
  subtitle: string;
  region: Exclude<DestinationRegion, "All Regions">;
  travel_styles: Exclude<DestinationTravelStyle, "All Styles">[];
  image_url: string | null;
  packages_count: number;
  popular_score: number;
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

export type DestinationOption = {
  label: string;
  value: string;
  sources: DestinationSourceTag[];
  country?: string;
};

export interface DestinationSearchFilters {
  query: string;
  region: DestinationRegion;
  travelStyle: DestinationTravelStyle;
  travelMonth: string;
  travelers: string;
  sortBy: DestinationSortBy;
}

export const DEFAULT_DESTINATION_FILTERS: DestinationSearchFilters = {
  query: "",
  region: "All Regions",
  travelStyle: "All Styles",
  travelMonth: "",
  travelers: "2a",
  sortBy: "popular",
};

export const DESTINATION_REGION_VALUES = [
  "Asia",
  "Europe",
  "Middle East",
  "Americas",
] as const;

export const DESTINATION_TRAVEL_STYLE_VALUES = [
  "Beach & Island",
  "City Breaks",
  "Adventure",
  "Family Holidays",
] as const;
