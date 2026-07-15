import { sanitizeSlug } from "@/lib/slug-utils";

export function buildPackageSlug(title: string) {
  return sanitizeSlug(title) || "tour-package";
}

export function resolveUniquePackageSlug(title: string, taken: Set<string>) {
  const base = buildPackageSlug(title);
  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

export function parseIncludesInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function includesToText(values: string[]) {
  return values.join(", ");
}

const PACKAGE_TITLE_NOISE = [
  "Add Tour Package",
  "Edit Tour Package",
  "Saved directly to Supabase database",
  "Package Title",
  "Badge Tag",
  "Route / Cities",
  "Package Image",
  "Choose Image",
  "Change Image",
  "Upload image",
];

export function normalizePackageTitle(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const embedded = trimmed.match(/Package Title\s+(.+?)(?:\s+Badge Tag\b|\s+Route\b|$)/i);
  if (embedded?.[1]) {
    return embedded[1].trim().slice(0, 120);
  }

  if (PACKAGE_TITLE_NOISE.some((noise) => trimmed.includes(noise))) {
    const cleaned = trimmed
      .replace(/^.*Package Title\s*/i, "")
      .split(/\s+Badge Tag\b/i)[0]
      ?.trim();
    if (cleaned && cleaned.length <= 120) return cleaned;
  }

  return trimmed.slice(0, 120);
}

export function validatePackageTitle(raw: string) {
  const title = normalizePackageTitle(raw);
  if (!title) return "Package title is required.";
  if (title.length > 120) return "Package title must be 120 characters or less.";
  if (PACKAGE_TITLE_NOISE.some((noise) => title.includes(noise))) {
    return "Enter only the package name in the title field.";
  }
  return null;
}
