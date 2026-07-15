export type BannerStatus = "pending" | "active";

export type Banner = {
  id: string;
  alt: string;
  slug?: string;
  seo_title?: string;
  meta_description?: string;
  h1_heading?: string;
  image_url: string;
  storage_path: string;
  status: BannerStatus;
  created_at: string;
};

export type BannerSlide = {
  src: string;
  alt: string;
};
