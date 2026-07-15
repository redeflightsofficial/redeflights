import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Airport } from "@/types/airport";
import type { EntityStatus } from "@/types/airline";

const LOCAL_AIRPORTS_PATH = path.join(process.cwd(), "data", "airports.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_AIRPORTS_PATH), { recursive: true });
}

export async function readLocalAirports() {
  try {
    const raw = await readFile(LOCAL_AIRPORTS_PATH, "utf8");
    return JSON.parse(raw) as Airport[];
  } catch {
    return [];
  }
}

async function writeLocalAirports(airports: Airport[]) {
  await ensureDataDir();
  await writeFile(LOCAL_AIRPORTS_PATH, JSON.stringify(airports, null, 2), "utf8");
}

export async function insertLocalAirport(input: Omit<Airport, "id" | "created_at">) {
  const airports = await readLocalAirports();
  const airport: Airport = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  airports.unshift(airport);
  await writeLocalAirports(airports);
  return airport;
}

export async function updateLocalAirport(
  id: string,
  patch: Partial<Omit<Airport, "id" | "created_at">>,
) {
  const airports = await readLocalAirports();
  const index = airports.findIndex((item) => item.id === id);
  if (index === -1) return null;
  airports[index] = { ...airports[index], ...patch };
  await writeLocalAirports(airports);
  return airports[index];
}

export async function deleteLocalAirport(id: string) {
  const airports = await readLocalAirports();
  const target = airports.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalAirports(airports.filter((item) => item.id !== id));
  return target;
}

export async function readDeletedAirportCodes() {
  const deletedPath = path.join(process.cwd(), "data", "airports.deleted-iata.json");
  try {
    const raw = await readFile(deletedPath, "utf8");
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function writeDeletedAirportCodes(codes: string[]) {
  const deletedPath = path.join(process.cwd(), "data", "airports.deleted-iata.json");
  await ensureDataDir();
  await writeFile(deletedPath, JSON.stringify(codes, null, 2), "utf8");
}

export async function markAirportDeleted(iataCode: string) {
  const code = iataCode.trim().toUpperCase();
  if (!code) return;

  const codes = await readDeletedAirportCodes();
  if (codes.includes(code)) return;

  codes.push(code);
  await writeDeletedAirportCodes(codes);
}

export async function getLocalAirport(id: string) {
  const airports = await readLocalAirports();
  return airports.find((item) => item.id === id) ?? null;
}

export async function findLocalAirportByIata(iataCode: string) {
  const airports = await readLocalAirports();
  const code = iataCode.trim().toUpperCase();
  return airports.find((item) => item.iata_code.toUpperCase() === code) ?? null;
}

export async function insertLocalAirportsBatch(inputs: Omit<Airport, "id" | "created_at">[]) {
  if (inputs.length === 0) return [];
  const airports = await readLocalAirports();
  const created = inputs.map((input) => ({
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  }));
  airports.unshift(...created);
  await writeLocalAirports(airports);
  return created;
}

export async function updateLocalAirportStatus(id: string, status: EntityStatus) {
  return updateLocalAirport(id, { status });
}

export async function clearAllLocalAirports() {
  await writeLocalAirports([]);
  await writeDeletedAirportCodes([]);
}
