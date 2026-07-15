import type { Metadata } from "next";

export const SITE_BRAND = "Redeflights";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://redeflights.ae";

const defaultKeywords = [
  "Redeflights",
  "REDE I FLIGHTS",
  "flight booking UAE",
  "Ajman travel agency",
  "cheap flights from UAE",
  "hotel booking UAE",
  "visa services UAE",
  "tour packages UAE",
  "holiday packages",
  "travel agency Ajman",
].join(", ");

export function brandedTitle(page?: string) {
  if (!page?.trim()) return SITE_BRAND;
  const clean = page.replace(/\s*\|\s*(REDE I FLIGHTS|Redeflights)\s*$/i, "").trim();
  return `${clean} | ${SITE_BRAND}`;
}

function createPageMetadata(pageTitle: string, description: string, extraKeywords = ""): Metadata {
  const keywords = extraKeywords ? `${defaultKeywords}, ${extraKeywords}` : defaultKeywords;

  return {
    title: pageTitle,
    description,
    keywords,
    openGraph: {
      title: brandedTitle(pageTitle),
      description,
      type: "website",
      siteName: SITE_BRAND,
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle(pageTitle),
      description,
    },
  };
}

export const homeMetadata: Metadata = {
  title: {
    absolute: SITE_BRAND,
  },
  description:
    "Redeflights — your trusted travel partner in Ajman, UAE. Book flights, hotels, visa assistance and handpicked tour packages with expert support and transparent pricing.",
  keywords: defaultKeywords,
  openGraph: {
    title: SITE_BRAND,
    description:
      "Book flights, hotels, visa services and holiday packages from Ajman, UAE with Redeflights.",
    type: "website",
    url: SITE_URL,
    siteName: SITE_BRAND,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_BRAND,
    description:
      "Book flights, hotels, visa services and holiday packages from Ajman, UAE with Redeflights.",
  },
};

export const aboutMetadata = createPageMetadata(
  "About Us",
  "Learn about Redeflights — a UAE-based travel agency in Ajman offering flights, hotels, visa support and curated holiday packages worldwide.",
  "about Redeflights, Ajman travel company",
);

export const contactMetadata = createPageMetadata(
  "Contact Us",
  "Contact Redeflights in Ajman, UAE. Call, email or WhatsApp our travel experts for flights, hotels, visa and tour package enquiries.",
  "contact travel agency Ajman, Redeflights phone",
);

export const flightsMetadata = createPageMetadata(
  "Flights",
  "Search and book cheap flights from UAE to worldwide destinations. Compare fares, one-way and return trips with Redeflights expert support.",
  "Dubai flights, international flights, flight deals UAE",
);

export const hotelsMetadata = createPageMetadata(
  "Hotels",
  "Find and book hotels worldwide with Redeflights. Premium stays, family hotels and business accommodation with trusted booking support.",
  "hotel booking UAE, international hotels, stay booking",
);

export const packagesMetadata = createPageMetadata(
  "Tour Packages",
  "Explore handpicked tour packages — Europe, Asia, Middle East and more. Flights, hotels and sightseeing included with Redeflights.",
  "holiday packages UAE, Europe tour packages, family holidays",
);

export const destinationsMetadata = createPageMetadata(
  "Destinations",
  "Discover top travel destinations worldwide. Browse holidays by region, style and budget with Redeflights curated travel options.",
  "travel destinations, holiday destinations, world travel",
);

export const visaMetadata = createPageMetadata(
  "Visa Services",
  "Visa assistance for USA, UK, Schengen, Australia, New Zealand, Georgia and more. Tourist and business visas with document guidance from Redeflights, Ajman UAE.",
  "UAE visa services, Schengen visa, USA visa, UK visa, Australia visa",
);

export function dynamicPageMetadata(
  title: string,
  description: string,
  keywords?: string,
  pageUrl?: string,
): Metadata {
  return {
    title: { absolute: brandedTitle(title) },
    description,
    keywords: keywords || defaultKeywords,
    openGraph: {
      title: brandedTitle(title),
      description,
      type: "website",
      siteName: SITE_BRAND,
      url: pageUrl || SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle(title),
      description,
    },
  };
}
