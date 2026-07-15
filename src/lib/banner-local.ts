import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Banner, BannerStatus } from "@/types/banner";

const LOCAL_BANNERS_PATH = path.join(process.cwd(), "data", "banners.local.json");

export async function saveBannerLocally(
  fileBuffer: Buffer,
  storagePath: string,
  siteOrigin = "",
) {
  const publicDir = path.join(process.cwd(), "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, storagePath), fileBuffer);

  const origin = siteOrigin.replace(/\/$/, "");
  return origin ? `${origin}/${storagePath}` : `/${storagePath}`;
}

export async function removeBannerFile(storagePath: string, imageUrl: string) {
  const publicDir = path.join(process.cwd(), "public");
  const targets = new Set<string>();

  if (storagePath) {
    targets.add(path.join(publicDir, storagePath));
    targets.add(path.join(publicDir, "uploads", "banners", storagePath));
  }

  const fileName = imageUrl?.split("?")[0].split("/").pop();
  if (fileName) {
    targets.add(path.join(publicDir, fileName));
    targets.add(path.join(publicDir, "uploads", "banners", fileName));
  }

  if (imageUrl.startsWith("/uploads/banners/")) {
    targets.add(path.join(process.cwd(), "public", imageUrl));
  }

  for (const filePath of targets) {
    try {
      await unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
}

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_BANNERS_PATH), { recursive: true });
}

export async function readLocalBanners() {
  try {
    const raw = await readFile(LOCAL_BANNERS_PATH, "utf8");
    return JSON.parse(raw) as Banner[];
  } catch {
    return [];
  }
}

async function writeLocalBanners(banners: Banner[]) {
  await ensureDataDir();
  await writeFile(LOCAL_BANNERS_PATH, JSON.stringify(banners, null, 2), "utf8");
}

export async function insertLocalBanner(input: {
  alt: string;
  slug?: string;
  seo_title?: string;
  meta_description?: string;
  h1_heading?: string;
  image_url: string;
  storage_path: string;
  status?: BannerStatus;
}) {
  const banners = await readLocalBanners();
  const banner: Banner = {
    id: randomUUID(),
    alt: input.alt,
    slug: input.slug || "",
    seo_title: input.seo_title || "",
    meta_description: input.meta_description || "",
    h1_heading: input.h1_heading || "",
    image_url: input.image_url,
    storage_path: input.storage_path,
    status: input.status || "active",
    created_at: new Date().toISOString(),
  };
  banners.unshift(banner);
  await writeLocalBanners(banners);
  return banner;
}

export async function updateLocalBannerStatus(id: string, status: BannerStatus) {
  const banners = await readLocalBanners();
  const index = banners.findIndex((item) => item.id === id);
  if (index === -1) return null;
  banners[index] = { ...banners[index], status };
  await writeLocalBanners(banners);
  return banners[index];
}

export async function updateLocalBanner(
  id: string,
  patch: Partial<
    Pick<
      Banner,
      "alt" | "slug" | "seo_title" | "meta_description" | "h1_heading" | "image_url" | "storage_path" | "status"
    >
  >,
) {
  const banners = await readLocalBanners();
  const index = banners.findIndex((item) => item.id === id);
  if (index === -1) return null;
  banners[index] = { ...banners[index], ...patch };
  await writeLocalBanners(banners);
  return banners[index];
}

export async function getLocalBanner(id: string) {
  const banners = await readLocalBanners();
  return banners.find((item) => item.id === id) ?? null;
}

export async function deleteLocalBanner(id: string) {
  const banners = await readLocalBanners();
  const target = banners.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalBanners(banners.filter((item) => item.id !== id));
  return target;
}
