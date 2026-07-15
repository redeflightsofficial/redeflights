import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { EntityStatus } from "@/types/airline";
import type { Visa } from "@/types/visa";

const LOCAL_VISAS_PATH = path.join(process.cwd(), "data", "visas.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_VISAS_PATH), { recursive: true });
}

export async function readLocalVisas() {
  try {
    const raw = await readFile(LOCAL_VISAS_PATH, "utf8");
    return JSON.parse(raw) as Visa[];
  } catch {
    return [];
  }
}

async function writeLocalVisas(visas: Visa[]) {
  await ensureDataDir();
  await writeFile(LOCAL_VISAS_PATH, JSON.stringify(visas, null, 2), "utf8");
}

export async function insertLocalVisa(input: Omit<Visa, "id" | "created_at">) {
  const visas = await readLocalVisas();
  const visa: Visa = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  visas.unshift(visa);
  await writeLocalVisas(visas);
  return visa;
}

export async function updateLocalVisa(
  id: string,
  patch: Partial<Omit<Visa, "id" | "created_at">>,
) {
  const visas = await readLocalVisas();
  const index = visas.findIndex((item) => item.id === id);
  if (index === -1) return null;
  visas[index] = { ...visas[index], ...patch };
  await writeLocalVisas(visas);
  return visas[index];
}

export async function deleteLocalVisa(id: string) {
  const visas = await readLocalVisas();
  const target = visas.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalVisas(visas.filter((item) => item.id !== id));
  return target;
}

export async function getLocalVisa(id: string) {
  const visas = await readLocalVisas();
  return visas.find((item) => item.id === id) ?? null;
}

export async function findLocalVisaBySlug(slug: string) {
  const visas = await readLocalVisas();
  return visas.find((item) => item.slug === slug) ?? null;
}

export async function updateLocalVisaStatus(id: string, status: EntityStatus) {
  return updateLocalVisa(id, { status });
}
