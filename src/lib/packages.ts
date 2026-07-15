import { normalizePackageTitle } from "@/lib/package-meta";
import type { TourPackage } from "@/types/tour-package";

export type DisplayPackage = {
  id: string;
  tag: string;
  title: string;
  route: string;
  duration: string;
  region: string;
  theme: string;
  includes: string[];
  image: string;
};

export function toDisplayPackage(pkg: TourPackage): DisplayPackage {
  return {
    id: pkg.id,
    tag: pkg.tag,
    title: normalizePackageTitle(pkg.title) || "Tour Package",
    route: pkg.route,
    duration: pkg.duration,
    region: pkg.region,
    theme: pkg.theme,
    includes: pkg.includes || [],
    image: pkg.image_url || "/background.png",
  };
}

export async function fetchPackagesFromApi(activeOnly = true): Promise<TourPackage[]> {
  try {
    const response = await fetch("/api/packages", { cache: "no-store" });
    const result = (await response.json()) as { packages?: TourPackage[] };
    if (!response.ok) return [];
    const packages = result.packages || [];
    return activeOnly ? packages.filter((item) => item.status === "active") : packages;
  } catch {
    return [];
  }
}
