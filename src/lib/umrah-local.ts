import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { EntityStatus } from "@/types/airline";
import type { UmrahPackage } from "@/types/umrah";

const LOCAL_UMRAH_PATH = path.join(process.cwd(), "data", "umrah.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_UMRAH_PATH), { recursive: true });
}

export async function readLocalUmrahPackages() {
  try {
    const raw = await readFile(LOCAL_UMRAH_PATH, "utf8");
    return JSON.parse(raw) as UmrahPackage[];
  } catch {
    return [];
  }
}

async function writeLocalUmrahPackages(packages: UmrahPackage[]) {
  await ensureDataDir();
  await writeFile(LOCAL_UMRAH_PATH, JSON.stringify(packages, null, 2), "utf8");
}

export async function insertLocalUmrahPackage(input: Omit<UmrahPackage, "id" | "created_at">) {
  const packages = await readLocalUmrahPackages();
  const item: UmrahPackage = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  packages.unshift(item);
  await writeLocalUmrahPackages(packages);
  return item;
}

export async function updateLocalUmrahPackage(
  id: string,
  patch: Partial<Omit<UmrahPackage, "id" | "created_at">>,
) {
  const packages = await readLocalUmrahPackages();
  const index = packages.findIndex((item) => item.id === id);
  if (index === -1) return null;
  packages[index] = { ...packages[index], ...patch };
  await writeLocalUmrahPackages(packages);
  return packages[index];
}

export async function deleteLocalUmrahPackage(id: string) {
  const packages = await readLocalUmrahPackages();
  const target = packages.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalUmrahPackages(packages.filter((item) => item.id !== id));
  return target;
}

export async function getLocalUmrahPackage(id: string) {
  const packages = await readLocalUmrahPackages();
  return packages.find((item) => item.id === id) ?? null;
}

export async function findLocalUmrahBySlug(slug: string) {
  const packages = await readLocalUmrahPackages();
  return packages.find((item) => item.slug === slug) ?? null;
}

export async function updateLocalUmrahStatus(id: string, status: EntityStatus) {
  return updateLocalUmrahPackage(id, { status });
}
