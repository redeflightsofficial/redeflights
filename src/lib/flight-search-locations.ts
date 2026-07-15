import type { Airport } from "@/types/airport";
import type { Route } from "@/types/route";

export type FlightLocationOption = {
  key: string;
  label: string;
  code: string;
  subtitle: string;
  searchText: string;
};

function addLocation(
  map: Map<string, FlightLocationOption>,
  city: string,
  code: string,
  subtitle: string,
) {
  const label = city.trim();
  if (!label) return;

  const normalizedCode = code.trim().toUpperCase() || label.slice(0, 3).toUpperCase();
  const key = `${label.toLowerCase()}|${normalizedCode}`;
  if (map.has(key)) return;

  map.set(key, {
    key,
    label,
    code: normalizedCode,
    subtitle: subtitle.trim() || label,
    searchText: `${label} ${normalizedCode} ${subtitle}`.toLowerCase(),
  });
}

export function buildFlightSearchLocations(routes: Route[], airports: Airport[]) {
  const map = new Map<string, FlightLocationOption>();

  for (const route of routes) {
    addLocation(map, route.from_city, route.from_airport_code || "", route.from_city);
    addLocation(map, route.to_city, route.to_airport_code || "", route.to_city);
  }

  for (const airport of airports) {
    const city = airport.city?.trim() || airport.name;
    addLocation(map, city, airport.iata_code, airport.name);
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function filterFlightLocations(options: FlightLocationOption[], query: string, limit = 8) {
  const trimmed = query.trim().toLowerCase();
  const list = trimmed
    ? options.filter((option) => option.searchText.includes(trimmed))
    : options;

  return list.slice(0, limit);
}

export function matchesFlightLocation(value: string, city: string, code: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return true;

  return (
    city.toLowerCase().includes(trimmed) ||
    code.toLowerCase().includes(trimmed) ||
    `${city} (${code})`.toLowerCase().includes(trimmed)
  );
}
