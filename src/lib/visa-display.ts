const DEFAULT_VISA_IMAGE =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=700&h=420&q=80";

const NEXT_IMAGE_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "images.trvl-media.com",
  "assets.hyatt.com",
  "rede-i-flights.vercel.app",
  "supabase.co",
];

function isBadPagePath(pathname: string) {
  const path = pathname.toLowerCase();
  return path === "/" || path === "/contact" || path.endsWith("/contact");
}

function isNextImageHost(hostname: string) {
  return NEXT_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function toVisaImageSrc(imageUrl: string) {
  const trimmed = String(imageUrl).trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith("/uploads/")) {
      return url.pathname;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export function isValidVisaImageUrl(value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return !isBadPagePath(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return !isBadPagePath(url.pathname);
  } catch {
    return false;
  }
}

export function canUseNextImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  try {
    const { hostname } = new URL(src);
    return isNextImageHost(hostname);
  } catch {
    return false;
  }
}

export function resolveVisaImageUrl(
  imageUrl: string | null | undefined,
  fallbackImage = DEFAULT_VISA_IMAGE,
) {
  return isValidVisaImageUrl(imageUrl)
    ? toVisaImageSrc(String(imageUrl).trim())
    : fallbackImage;
}

export function normalizeVisaImageUrl(value?: string | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  return isValidVisaImageUrl(trimmed) ? toVisaImageSrc(trimmed) : null;
}

export { DEFAULT_VISA_IMAGE };
