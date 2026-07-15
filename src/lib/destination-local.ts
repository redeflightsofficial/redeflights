import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { EntityStatus } from "@/types/airline";
import type { DestinationRecord } from "@/types/destination";

const LOCAL_DESTINATIONS_PATH = path.join(process.cwd(), "data", "destinations.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_DESTINATIONS_PATH), { recursive: true });
}

export async function readLocalDestinations() {
  try {
    const raw = await readFile(LOCAL_DESTINATIONS_PATH, "utf8");
    return JSON.parse(raw) as DestinationRecord[];
  } catch {
    return [];
  }
}

async function writeLocalDestinations(destinations: DestinationRecord[]) {
  await ensureDataDir();
  await writeFile(LOCAL_DESTINATIONS_PATH, JSON.stringify(destinations, null, 2), "utf8");
}

export async function insertLocalDestination(input: Omit<DestinationRecord, "id" | "created_at">) {
  const destinations = await readLocalDestinations();
  const destination: DestinationRecord = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  destinations.unshift(destination);
  await writeLocalDestinations(destinations);
  return destination;
}

export async function updateLocalDestination(
  id: string,
  patch: Partial<Omit<DestinationRecord, "id" | "created_at">>,
) {
  const destinations = await readLocalDestinations();
  const index = destinations.findIndex((item) => item.id === id);
  if (index === -1) return null;
  destinations[index] = { ...destinations[index], ...patch };
  await writeLocalDestinations(destinations);
  return destinations[index];
}

export async function deleteLocalDestination(id: string) {
  const destinations = await readLocalDestinations();
  const target = destinations.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalDestinations(destinations.filter((item) => item.id !== id));
  return target;
}

export async function getLocalDestination(id: string) {
  const destinations = await readLocalDestinations();
  return destinations.find((item) => item.id === id) ?? null;
}

export async function findLocalDestinationBySlug(slug: string) {
  const destinations = await readLocalDestinations();
  return destinations.find((item) => item.slug === slug) ?? null;
}

export async function updateLocalDestinationStatus(id: string, status: EntityStatus) {
  return updateLocalDestination(id, { status });
}
