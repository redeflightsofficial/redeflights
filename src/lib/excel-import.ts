import * as XLSX from "xlsx";
import { buildRouteSlug, buildRouteIdentityKey } from "@/lib/route-meta";

export type ParsedAirlineRow = {
  name: string;
  iata_code: string;
  icao_code?: string;
  country?: string;
};

export type ParsedAirportRow = {
  name: string;
  iata_code: string;
  city: string;
  country?: string;
};

export type ParsedRouteRow = {
  from_city: string;
  to_city: string;
  from_airport_code?: string;
  to_airport_code?: string;
  airline_name?: string;
  slug: string;
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pickValue(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row).map(([key, value]) => ({
    key: normalizeHeader(key),
    value: String(value ?? "").trim(),
  }));

  // Prefer exact header matches so short aliases like "from"/"to" do not steal
  // values from "From Country" / "To Country".
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (!normalizedAlias) continue;
    const exact = entries.find((entry) => entry.key === normalizedAlias && entry.value);
    if (exact) return exact.value;
  }

  // Then allow compound headers that end with the alias (e.g. "airportcity" → "city"),
  // but only for aliases long enough to avoid accidental matches.
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (normalizedAlias.length < 4) continue;
    const fuzzy = entries.find(
      (entry) =>
        entry.value &&
        entry.key !== normalizedAlias &&
        (entry.key.endsWith(normalizedAlias) || entry.key.startsWith(normalizedAlias)),
    );
    if (fuzzy) return fuzzy.value;
  }

  return "";
}

function sanitizeAirportIata(value: string) {
  const code = value.trim().toUpperCase();
  return isLikelyAirportCode(code) ? code : "";
}

function pickAirportIata(row: Record<string, unknown>, direction: "from" | "to") {
  const iataAliases =
    direction === "from"
      ? [
          "fromiata",
          "from airport iata",
          "fromairportiata",
          "origin iata",
          "departure iata",
          "from airport code",
          "origin airport code",
        ]
      : [
          "toiata",
          "to airport iata",
          "toairportiata",
          "destination iata",
          "arrival iata",
          "to airport code",
          "destination airport code",
        ];

  const direct = sanitizeAirportIata(pickValue(row, iataAliases));
  if (direct) return direct;

  const fallbackAliases =
    direction === "from"
      ? ["fromairportcode", "fromairport", "originairport", "departureairport"]
      : ["toairportcode", "toairport", "destinationairport", "arrivalairport"];

  return sanitizeAirportIata(pickValue(row, fallbackAliases));
}

function pickAirportName(row: Record<string, unknown>, direction: "from" | "to") {
  const nameAliases =
    direction === "from"
      ? ["fromairportname", "from airport name", "origin airport name", "departure airport name"]
      : ["toairportname", "to airport name", "destination airport name", "arrival airport name"];

  const direct = pickValue(row, nameAliases);
  if (direct) return direct;

  const fallbackAliases =
    direction === "from"
      ? ["fromairport", "originairport", "departureairport"]
      : ["toairport", "destinationairport", "arrivalairport"];

  const fallback = pickValue(row, fallbackAliases);
  if (fallback && !isLikelyAirportCode(fallback)) return fallback;
  return "";
}

function isLikelyAirlineCode(code: string) {
  return /^[A-Z0-9]{2}$/i.test(code.trim());
}

function isLikelyAirportCode(code: string) {
  return /^[A-Z]{3}$/i.test(code.trim());
}

function guessAirlineCode(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

function addAirline(
  map: Map<string, ParsedAirlineRow>,
  name: string,
  code: string,
  country = "",
) {
  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  if (!cleanName || !isLikelyAirlineCode(cleanCode)) return;
  const cleanCountry = country.trim();
  const existing = map.get(cleanCode);
  if (existing) {
    if (!existing.country && cleanCountry) existing.country = cleanCountry;
    return;
  }
  map.set(cleanCode, {
    name: cleanName,
    iata_code: cleanCode,
    country: cleanCountry || undefined,
  });
}

function addAirport(
  map: Map<string, ParsedAirportRow>,
  name: string,
  code: string,
  city: string,
  country = "",
) {
  const cleanCode = code.trim().toUpperCase();
  const cleanCity = city.trim();
  if (!cleanCode || !isLikelyAirportCode(cleanCode)) return;
  const finalName = name.trim() || `${cleanCity || cleanCode} Airport`;
  const finalCity = cleanCity || name.trim() || cleanCode;
  const cleanCountry = country.trim();
  const existing = map.get(cleanCode);
  if (existing) {
    if (!existing.country && cleanCountry) existing.country = cleanCountry;
    return;
  }
  map.set(cleanCode, {
    name: finalName,
    iata_code: cleanCode,
    city: finalCity,
    country: cleanCountry || undefined,
  });
}

export type ImportExtractStats = {
  totalRows: number;
  parsedRoutes: number;
  skippedMissingCities: number;
  mergedDuplicates: number;
};

function addRoute(
  map: Map<string, ParsedRouteRow>,
  row: Omit<ParsedRouteRow, "slug">,
  stats?: { mergedDuplicates: number },
) {
  const fromCity = row.from_city.trim();
  const toCity = row.to_city.trim();
  if (!fromCity || !toCity) return;
  const slug = buildRouteSlug(
    fromCity,
    toCity,
    row.airline_name || "",
    row.from_airport_code || "",
    row.to_airport_code || "",
  );
  const identityKey = buildRouteIdentityKey({
    from_city: fromCity,
    to_city: toCity,
    airline_name: row.airline_name,
    from_airport_code: row.from_airport_code,
    to_airport_code: row.to_airport_code,
  });
  if (map.has(identityKey)) {
    if (stats) stats.mergedDuplicates += 1;
    return;
  }
  map.set(identityKey, {
    from_city: fromCity,
    to_city: toCity,
    from_airport_code: sanitizeAirportIata(row.from_airport_code || "") || undefined,
    to_airport_code: sanitizeAirportIata(row.to_airport_code || "") || undefined,
    airline_name: row.airline_name?.trim() || undefined,
    slug,
  });
}

export function parseExcelBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const rows: Record<string, unknown>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    rows.push(...sheetRows);
  }

  return rows;
}

export function extractFlightDataFromRows(rows: Record<string, unknown>[]) {
  const airlines = new Map<string, ParsedAirlineRow>();
  const airports = new Map<string, ParsedAirportRow>();
  const routes = new Map<string, ParsedRouteRow>();
  const stats = {
    totalRows: rows.length,
    parsedRoutes: 0,
    skippedMissingCities: 0,
    mergedDuplicates: 0,
  };

  for (const row of rows) {
    const fromCity = pickValue(row, [
      "fromcity",
      "from city",
      "origincity",
      "origin city",
      "departurecity",
      "departure city",
      "cityfrom",
      "from",
      "origin",
    ]);
    const toCity = pickValue(row, [
      "tocity",
      "to city",
      "destinationcity",
      "destination city",
      "arrivalcity",
      "arrival city",
      "cityto",
      "to",
      "destination",
    ]);
    const airlineName = pickValue(row, [
      "airlinename",
      "airline",
      "airline name",
      "carrier",
      "fromairline",
      "toairline",
    ]);
    const fromAirportCode = pickAirportIata(row, "from");
    const toAirportCode = pickAirportIata(row, "to");
    const fromAirportName = pickAirportName(row, "from");
    const toAirportName = pickAirportName(row, "to");
    const airlineCode = pickValue(row, [
      "airlinecode",
      "airline iata",
      "carriercode",
    ]);
    const sharedCountry = pickValue(row, [
      "country",
      "countryname",
      "country name",
      "nation",
    ]);
    const fromCountry =
      pickValue(row, [
        "fromcountry",
        "from country",
        "origincountry",
        "origin country",
        "departurecountry",
        "departure country",
        "sourcecountry",
        "source country",
      ]) || sharedCountry;
    const toCountry =
      pickValue(row, [
        "tocountry",
        "to country",
        "destinationcountry",
        "destination country",
        "arrivalcountry",
        "arrival country",
      ]) || sharedCountry;
    const airlineCountry =
      pickValue(row, [
        "airlinecountry",
        "airline country",
        "carriercountry",
        "carrier country",
      ]) || sharedCountry;

    if (fromCity && toCity) {
      addRoute(
        routes,
        {
          from_city: fromCity,
          to_city: toCity,
          from_airport_code: fromAirportCode || undefined,
          to_airport_code: toAirportCode || undefined,
          airline_name: airlineName || undefined,
        },
        stats,
      );
    } else {
      stats.skippedMissingCities += 1;
    }

    if (airlineName) {
      const code = airlineCode && isLikelyAirlineCode(airlineCode) ? airlineCode : guessAirlineCode(airlineName);
      addAirline(airlines, airlineName, code, airlineCountry);
    }

    if (fromAirportCode) {
      addAirport(
        airports,
        fromAirportName || `${fromCity || fromAirportCode} Airport`,
        fromAirportCode,
        fromCity || fromAirportCode,
        fromCountry,
      );
    }

    if (toAirportCode) {
      addAirport(
        airports,
        toAirportName || `${toCity || toAirportCode} Airport`,
        toAirportCode,
        toCity || toAirportCode,
        toCountry,
      );
    }
  }

  stats.parsedRoutes = routes.size;

  return {
    routes: Array.from(routes.values()),
    airlines: Array.from(airlines.values()),
    airports: Array.from(airports.values()),
    stats,
  };
}

export function mapAirlineRows(rows: Record<string, unknown>[]) {
  const map = new Map<string, ParsedAirlineRow>();

  for (const row of rows) {
    const name = pickValue(row, ["name", "airlinename", "airline", "airline name", "carrier"]);
    const iataCode = pickValue(row, [
      "iata",
      "iatacode",
      "iata code",
      "code",
      "airlinecode",
      "airline iata",
      "carriercode",
    ]);
    const icaoCode = pickValue(row, ["icao", "icaocode", "icao code"]);
    const country = pickValue(row, [
      "country",
      "countryname",
      "country name",
      "nation",
      "airlinecountry",
      "airline country",
    ]);
    const code = (iataCode.trim().toUpperCase() || (name ? guessAirlineCode(name) : "")).trim();

    if (!name.trim() || !isLikelyAirlineCode(code)) continue;

    const existing = map.get(code);
    if (existing) {
      if (!existing.country && country.trim()) existing.country = country.trim();
      continue;
    }

    map.set(code, {
      name: name.trim(),
      iata_code: code,
      icao_code: icaoCode.trim().toUpperCase() || undefined,
      country: country.trim() || undefined,
    });
  }

  return Array.from(map.values());
}

export function mapAirportRows(rows: Record<string, unknown>[]) {
  const map = new Map<string, ParsedAirportRow>();

  for (const row of rows) {
    const name = pickValue(row, ["name", "airportname", "airport", "airport name"]);
    const iataCode = pickValue(row, ["iata", "iatacode", "iata code", "code", "airportcode"]);
    const city = pickValue(row, ["city", "airportcity", "location", "town"]);
    const country = pickValue(row, [
      "country",
      "countryname",
      "country name",
      "nation",
      "airportcountry",
      "airport country",
    ]);
    const code = sanitizeAirportIata(iataCode) || iataCode.trim().toUpperCase();

    if (!isLikelyAirportCode(code)) continue;

    const finalCity = city.trim() || name.trim() || code;
    if (!finalCity) continue;

    const existing = map.get(code);
    if (existing) {
      if (!existing.country && country.trim()) existing.country = country.trim();
      continue;
    }

    map.set(code, {
      name: name.trim() || `${finalCity} Airport`,
      iata_code: code,
      city: finalCity,
      country: country.trim() || undefined,
    });
  }

  return Array.from(map.values());
}
