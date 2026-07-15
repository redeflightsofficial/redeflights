export type DashboardIconKey =
  | "layout"
  | "chart"
  | "map-pinned"
  | "plane"
  | "hotel"
  | "visa"
  | "insurance"
  | "route"
  | "file-up"
  | "image"
  | "search"
  | "file-text"
  | "package"
  | "settings";

export type DashboardNavItem = {
  key: string;
  label: string;
  href: string;
  icon: DashboardIconKey;
  description?: string;
};

export type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

export const dashboardNavSections: DashboardNavSection[] = [
  {
    title: "Overview",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: "layout",
        description: "Live overview of all modules",
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        key: "enquiries",
        label: "Enquiries",
        href: "/dashboard/enquiries",
        icon: "file-text",
        description: "Contact form leads and WhatsApp follow-ups",
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        key: "flights",
        label: "Flights",
        href: "/dashboard/flights",
        icon: "route",
        description: "Routes, deals and Excel import",
      },
      {
        key: "airlines",
        label: "Airlines",
        href: "/dashboard/airlines",
        icon: "plane",
        description: "Airline master records and SEO",
      },
      {
        key: "airports",
        label: "Airports",
        href: "/dashboard/airports",
        icon: "map-pinned",
        description: "Airport codes and city data",
      },
    ],
  },
  {
    title: "Products",
    items: [
      {
        key: "destinations",
        label: "Destinations",
        href: "/dashboard/destinations",
        icon: "search",
        description: "Manual destinations + auto aggregation",
      },
      {
        key: "hotels",
        label: "Hotels",
        href: "/dashboard/hotels",
        icon: "hotel",
        description: "Hotel listings with auto SEO pages",
      },
      {
        key: "visa",
        label: "Visa",
        href: "/dashboard/visa",
        icon: "visa",
        description: "Visa services and image uploads",
      },
      {
        key: "packages",
        label: "Tour Packages",
        href: "/dashboard/packages",
        icon: "package",
        description: "Holiday packages with image upload",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        key: "banner-images",
        label: "Banner Images",
        href: "/dashboard/banner-images",
        icon: "image",
        description: "Homepage carousel banners",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        key: "settings",
        label: "Settings",
        href: "/dashboard/settings",
        icon: "settings",
        description: "Admin account and system info",
      },
    ],
  },
];

export const dashboardNavItems = dashboardNavSections.flatMap((section) => section.items);

export const dashboardQuickActions = [
  { label: "View Enquiries", href: "/dashboard/enquiries", icon: "file-text" as const },
  { label: "Add Flight Route", href: "/dashboard/flights", icon: "route" as const },
  { label: "Add Destination", href: "/dashboard/destinations", icon: "search" as const },
  { label: "Add Hotel", href: "/dashboard/hotels", icon: "hotel" as const },
  { label: "Add Visa", href: "/dashboard/visa", icon: "visa" as const },
  { label: "Add Package", href: "/dashboard/packages", icon: "package" as const },
  { label: "Upload Banner", href: "/dashboard/banner-images", icon: "image" as const },
];
