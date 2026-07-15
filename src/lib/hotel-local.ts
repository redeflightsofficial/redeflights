import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { EntityStatus } from "@/types/airline";
import type { Hotel } from "@/types/hotel";

const LOCAL_HOTELS_PATH = path.join(process.cwd(), "data", "hotels.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_HOTELS_PATH), { recursive: true });
}

export async function readLocalHotels() {
  try {
    const raw = await readFile(LOCAL_HOTELS_PATH, "utf8");
    return JSON.parse(raw) as Hotel[];
  } catch {
    return [];
  }
}

async function writeLocalHotels(hotels: Hotel[]) {
  await ensureDataDir();
  await writeFile(LOCAL_HOTELS_PATH, JSON.stringify(hotels, null, 2), "utf8");
}

export async function insertLocalHotel(input: Omit<Hotel, "id" | "created_at">) {
  const hotels = await readLocalHotels();
  const hotel: Hotel = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  hotels.unshift(hotel);
  await writeLocalHotels(hotels);
  return hotel;
}

export async function updateLocalHotel(
  id: string,
  patch: Partial<Omit<Hotel, "id" | "created_at">>,
) {
  const hotels = await readLocalHotels();
  const index = hotels.findIndex((item) => item.id === id);
  if (index === -1) return null;
  hotels[index] = { ...hotels[index], ...patch };
  await writeLocalHotels(hotels);
  return hotels[index];
}

export async function deleteLocalHotel(id: string) {
  const hotels = await readLocalHotels();
  const target = hotels.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalHotels(hotels.filter((item) => item.id !== id));
  return target;
}

export async function getLocalHotel(id: string) {
  const hotels = await readLocalHotels();
  return hotels.find((item) => item.id === id) ?? null;
}

export async function findLocalHotelBySlug(slug: string) {
  const hotels = await readLocalHotels();
  return hotels.find((item) => item.slug === slug) ?? null;
}

export async function updateLocalHotelStatus(id: string, status: EntityStatus) {
  return updateLocalHotel(id, { status });
}
