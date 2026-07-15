export type BannerMeta = {
  storageFileName: string;
  slug: string;
  alt: string;
  seoTitle: string;
  metaDescription: string;
  h1Heading: string;
  imageUrl: string;
};

export type BannerUrlOptions = {
  siteOrigin?: string;
};

export function getSiteOrigin(fallbackOrigin = "") {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || fallbackOrigin;
}

export function extractBannerFileName(value: string) {
  const clean = value.split("?")[0].trim();
  if (!clean) return "";
  if (clean.includes("/")) return clean.split("/").pop() || clean;
  return clean;
}

export function buildDirectBannerImageUrl(
  storageFileName: string,
  options: BannerUrlOptions = {},
) {
  const fileName = extractBannerFileName(storageFileName);
  const siteOrigin = options.siteOrigin?.replace(/\/$/, "");
  return siteOrigin ? `${siteOrigin}/${fileName}` : `/${fileName}`;
}

export function ensureDirectImageUrl(imageUrl: string, options: BannerUrlOptions = {}) {
  if (!imageUrl) return imageUrl;

  const trimmed = imageUrl.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    if (/\.supabase\.co\/storage\/v1\/object\/public\//i.test(trimmed)) {
      return trimmed;
    }

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed);
    if (!isLocalhost) return trimmed;

    const fileName = extractBannerFileName(trimmed);
    return buildDirectBannerImageUrl(fileName, options);
  }

  const fileName = extractBannerFileName(trimmed);
  return buildDirectBannerImageUrl(fileName, options);
}

export function sanitizeBannerBaseName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getBannerFileExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) return "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}

export function buildSeoBannerFileName(fileName: string) {
  const base = sanitizeBannerBaseName(fileName) || "banner";
  const ext = getBannerFileExtension(fileName);
  return `${base}.${ext}`;
}

export function generateSlugFromFileName(fileName: string) {
  const base = sanitizeBannerBaseName(fileName) || "banner";
  if (base.includes("-to-")) return base;

  const hyphenIndex = base.indexOf("-");
  if (hyphenIndex > 0 && hyphenIndex < base.length - 1) {
    return `${base.slice(0, hyphenIndex)}-to-${base.slice(hyphenIndex + 1)}`;
  }

  return base;
}

function titleCaseWords(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseRouteFromSlug(slug: string) {
  const parts = slug.split("-to-");
  if (parts.length < 2) return null;

  return {
    from: titleCaseWords(parts[0]),
    to: titleCaseWords(parts.slice(1).join("-")),
  };
}

export function generateSeoTitleFromSlug(slug: string) {
  const route = parseRouteFromSlug(slug);
  if (route) return `${route.from} to ${route.to} Flights | REDE FLIGHTS`;
  return `${titleCaseWords(slug)} | REDE FLIGHTS`;
}

export function generateH1FromSlug(slug: string) {
  const route = parseRouteFromSlug(slug);
  if (route) return `${route.from} to ${route.to} Flights`;
  return `${titleCaseWords(slug)} Flights`;
}

export function generateMetaDescriptionFromSlug(slug: string) {
  const route = parseRouteFromSlug(slug);
  if (route) {
    return `Book cheap flights from ${route.from} to ${route.to} with REDE FLIGHTS.`;
  }
  return `Book cheap flights with REDE FLIGHTS. Explore ${titleCaseWords(slug)} deals today.`;
}

export function generateAltFromSlug(slug: string) {
  return generateSeoTitleFromSlug(slug);
}

export function buildSeoFieldsFromSlug(slug: string) {
  return {
    slug,
    seoTitle: generateSeoTitleFromSlug(slug),
    metaDescription: generateMetaDescriptionFromSlug(slug),
    h1Heading: generateH1FromSlug(slug),
    alt: generateAltFromSlug(slug),
  };
}

export function buildBannerMetaFromFileName(
  fileName: string,
  options: BannerUrlOptions = {},
): BannerMeta {
  const storageFileName = buildSeoBannerFileName(fileName);
  const slug = generateSlugFromFileName(storageFileName);
  const seo = buildSeoFieldsFromSlug(slug);

  return {
    storageFileName,
    slug,
    alt: seo.alt,
    seoTitle: seo.seoTitle,
    metaDescription: seo.metaDescription,
    h1Heading: seo.h1Heading,
    imageUrl: buildDirectBannerImageUrl(storageFileName, options),
  };
}

export function resolveUniqueBannerFileName(fileName: string, existingNames: string[]) {
  const seoName = buildSeoBannerFileName(fileName);
  const taken = new Set(existingNames.map((item) => item.toLowerCase()));

  if (!taken.has(seoName.toLowerCase())) return seoName;

  const base = sanitizeBannerBaseName(fileName) || "banner";
  const ext = getBannerFileExtension(fileName);
  let counter = 2;

  while (taken.has(`${base}-${counter}.${ext}`.toLowerCase())) {
    counter += 1;
  }

  return `${base}-${counter}.${ext}`;
}

export function getBannerSeoFields(
  banner: {
    slug?: string;
    storage_path: string;
    alt?: string;
    seo_title?: string;
    meta_description?: string;
    h1_heading?: string;
    image_url?: string;
  },
  options: BannerUrlOptions = {},
) {
  const slug = banner.slug || generateSlugFromFileName(banner.storage_path);
  const generated = buildSeoFieldsFromSlug(slug);

  return {
    slug,
    seoTitle: banner.seo_title || generated.seoTitle,
    metaDescription: banner.meta_description || generated.metaDescription,
    h1Heading: banner.h1_heading || generated.h1Heading,
    alt: banner.alt || generated.alt,
    imageUrl: banner.image_url
      ? ensureDirectImageUrl(banner.image_url, options)
      : buildDirectBannerImageUrl(banner.storage_path, options),
  };
}
