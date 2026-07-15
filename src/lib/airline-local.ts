import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { Airline, EntityStatus } from "@/types/airline";

const LOCAL_AIRLINES_PATH = path.join(process.cwd(), "data", "airlines.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_AIRLINES_PATH), { recursive: true });
}

export async function readLocalAirlines() {
  try {
    const raw = await readFile(LOCAL_AIRLINES_PATH, "utf8");
    return JSON.parse(raw) as Airline[];
  } catch {
    return [];
  }
}

async function writeLocalAirlines(airlines: Airline[]) {
  await ensureDataDir();
  await writeFile(LOCAL_AIRLINES_PATH, JSON.stringify(airlines, null, 2), "utf8");
}

export async function insertLocalAirline(input: Omit<Airline, "id" | "created_at">) {
  const airlines = await readLocalAirlines();
  const airline: Airline = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  airlines.unshift(airline);
  await writeLocalAirlines(airlines);
  return airline;
}

export async function updateLocalAirline(
  id: string,
  patch: Partial<Omit<Airline, "id" | "created_at">>,
) {
  const airlines = await readLocalAirlines();
  const index = airlines.findIndex((item) => item.id === id);
  if (index === -1) return null;
  airlines[index] = { ...airlines[index], ...patch };
  await writeLocalAirlines(airlines);
  return airlines[index];
}

export async function readDeletedAirlineCodes() {
  const deletedPath = path.join(process.cwd(), "data", "airlines.deleted-iata.json");
  try {
    const raw = await readFile(deletedPath, "utf8");
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function writeDeletedAirlineCodes(codes: string[]) {
  const deletedPath = path.join(process.cwd(), "data", "airlines.deleted-iata.json");
  await ensureDataDir();
  await writeFile(deletedPath, JSON.stringify(codes, null, 2), "utf8");
}

export async function markAirlineDeleted(iataCode: string) {
  const code = iataCode.trim().toUpperCase();
  if (!code) return;

  const codes = await readDeletedAirlineCodes();
  if (codes.includes(code)) return;

  codes.push(code);
  await writeDeletedAirlineCodes(codes);
}

export async function deleteLocalAirline(id: string) {
  const airlines = await readLocalAirlines();
  const target = airlines.find((item) => item.id === id);
  if (!target) return null;

  await writeLocalAirlines(airlines.filter((item) => item.id !== id));
  return target;
}

export async function getLocalAirline(id: string) {
  const airlines = await readLocalAirlines();
  return airlines.find((item) => item.id === id) ?? null;
}

export async function findLocalAirlineByIata(iataCode: string) {
  const airlines = await readLocalAirlines();
  const code = iataCode.trim().toUpperCase();
  return airlines.find((item) => item.iata_code.toUpperCase() === code) ?? null;
}

export async function insertLocalAirlinesBatch(inputs: Omit<Airline, "id" | "created_at">[]) {
  if (inputs.length === 0) return [];
  const airlines = await readLocalAirlines();
  const created = inputs.map((input) => ({
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  }));
  airlines.unshift(...created);
  await writeLocalAirlines(airlines);
  return created;
}

export async function updateLocalAirlineStatus(id: string, status: EntityStatus) {
  return updateLocalAirline(id, { status });
}

export async function clearAllLocalAirlines() {
  await writeLocalAirlines([]);
  await writeDeletedAirlineCodes([]);
}
