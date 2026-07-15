import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { EntityStatus } from "@/types/airline";
import type { Route } from "@/types/route";

const LOCAL_ROUTES_PATH = path.join(process.cwd(), "data", "routes.local.json");

async function ensureDataDir() {
  await mkdir(path.dirname(LOCAL_ROUTES_PATH), { recursive: true });
}

export async function readLocalRoutes() {
  try {
    const raw = await readFile(LOCAL_ROUTES_PATH, "utf8");
    return JSON.parse(raw) as Route[];
  } catch {
    return [];
  }
}

async function writeLocalRoutes(routes: Route[]) {
  await ensureDataDir();
  await writeFile(LOCAL_ROUTES_PATH, JSON.stringify(routes, null, 2), "utf8");
}

export async function insertLocalRoute(input: Omit<Route, "id" | "created_at">) {
  const routes = await readLocalRoutes();
  const route: Route = {
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  routes.unshift(route);
  await writeLocalRoutes(routes);
  return route;
}

export async function insertLocalRoutesBatch(inputs: Omit<Route, "id" | "created_at">[]) {
  if (inputs.length === 0) return [];
  const routes = await readLocalRoutes();
  const created = inputs.map((input) => ({
    id: randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  }));
  routes.unshift(...created);
  await writeLocalRoutes(routes);
  return created;
}

export async function updateLocalRoute(
  id: string,
  patch: Partial<Omit<Route, "id" | "created_at">>,
) {
  const routes = await readLocalRoutes();
  const index = routes.findIndex((item) => item.id === id);
  if (index === -1) return null;
  routes[index] = { ...routes[index], ...patch };
  await writeLocalRoutes(routes);
  return routes[index];
}

export async function deleteLocalRoute(id: string) {
  const routes = await readLocalRoutes();
  const target = routes.find((item) => item.id === id);
  if (!target) return null;
  await writeLocalRoutes(routes.filter((item) => item.id !== id));
  return target;
}

export async function findLocalRouteBySlug(slug: string) {
  const routes = await readLocalRoutes();
  return routes.find((item) => item.slug === slug) ?? null;
}

export async function getLocalRoute(id: string) {
  const routes = await readLocalRoutes();
  return routes.find((item) => item.id === id) ?? null;
}

export async function updateLocalRouteStatus(id: string, status: EntityStatus) {
  return updateLocalRoute(id, { status });
}

export async function clearAllLocalRoutes() {
  await writeLocalRoutes([]);
}
