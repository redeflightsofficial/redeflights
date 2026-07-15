import { WHATSAPP_URL } from "@/lib/contact";
import { matchesFlightLocation } from "@/lib/flight-search-locations";
import type { Route } from "@/types/route";

export type FlightDeal = {
  id: string;
  airline: string;
  airlineCode: string;
  routeLabel: string;
  fromCity: string;
  toCity: string;
  fromCode: string;
  toCode: string;
  departure: string;
  arrival: string;
  duration: string;
  stopType: "Non-stop" | "1 Stop";
  slug: string;
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function padTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function airlineInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "RF";
}

export function buildFlightDeal(route: Route): FlightDeal {
  const seed = hashString(route.id);
  const airline = route.airline_name?.trim() || "Best Available Airline";
  const fromCode = route.from_airport_code || route.from_city.slice(0, 3).toUpperCase();
  const toCode = route.to_airport_code || route.to_city.slice(0, 3).toUpperCase();

  const depHour = 5 + (seed % 16);
  const depMinute = [0, 10, 15, 20, 30, 45][seed % 6];
  const durationMinutes = 185 + (seed % 520);
  const arrivalTotal = depHour * 60 + depMinute + durationMinutes;
  const arrHour = Math.floor(arrivalTotal / 60) % 24;
  const arrMinute = arrivalTotal % 60;

  const stopType = durationMinutes > 420 && seed % 3 === 0 ? "1 Stop" : "Non-stop";

  return {
    id: route.id,
    airline,
    airlineCode: route.airline_iata_code?.trim() || airlineInitials(airline),
    routeLabel: `${route.from_city} → ${route.to_city}`,
    fromCity: route.from_city,
    toCity: route.to_city,
    fromCode,
    toCode,
    departure: padTime(depHour, depMinute),
    arrival: padTime(arrHour, arrMinute),
    duration: formatDuration(durationMinutes),
    stopType,
    slug: route.slug,
  };
}

export function sortFlightDeals(
  deals: FlightDeal[],
  sortBy: "newest" | "route" | "airline",
) {
  const sorted = [...deals];
  if (sortBy === "route") {
    sorted.sort((a, b) => a.routeLabel.localeCompare(b.routeLabel));
  } else if (sortBy === "airline") {
    sorted.sort((a, b) => a.airline.localeCompare(b.airline));
  }
  return sorted;
}

export function buildFlightEnquiryUrl(fromCity: string, toCity: string, airline: string) {
  return buildFlightSearchEnquiryUrl({ from: fromCity, to: toCity, airline });
}

const passengerLabels: Record<string, string> = {
  "1a": "1 Adult",
  "2a": "2 Adults",
  "1a1c": "1 Adult, 1 Child",
  "2a1c": "2 Adults, 1 Child",
};

const travelClassLabels: Record<string, string> = {
  economy: "Economy",
  premium: "Premium Economy",
  business: "Business",
  first: "First",
};

export type FlightSearchEnquiryInput = {
  from?: string;
  to?: string;
  tripType?: "one-way" | "return";
  departDate?: string;
  returnDate?: string;
  travelClass?: string;
  passengers?: string;
  airline?: string;
};

function formatEnquiryDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function findMatchingRouteAirline(routes: Route[], from: string, to: string) {
  const match = routes.find(
    (route) =>
      matchesFlightLocation(from, route.from_city, route.from_airport_code || "") &&
      matchesFlightLocation(to, route.to_city, route.to_airport_code || ""),
  );

  return match?.airline_name?.trim() || "";
}

export function buildFlightSearchEnquiryMessage(input: FlightSearchEnquiryInput) {
  const from = input.from?.trim() || "";
  const to = input.to?.trim() || "";
  const airline = input.airline?.trim() || "";
  const lines = ["Hi REDE FLIGHTS, I would like to enquire about a flight."];

  if (from && to) lines.push(`Route: ${from} → ${to}`);
  else if (from) lines.push(`From: ${from}`);
  else if (to) lines.push(`To: ${to}`);

  if (input.tripType) {
    lines.push(`Trip type: ${input.tripType === "return" ? "Return" : "One Way"}`);
  }

  if (input.departDate) lines.push(`Departure date: ${formatEnquiryDate(input.departDate)}`);
  if (input.returnDate) lines.push(`Return date: ${formatEnquiryDate(input.returnDate)}`);

  if (input.passengers) {
    lines.push(`Travellers: ${passengerLabels[input.passengers] || input.passengers}`);
  }

  if (input.travelClass) {
    lines.push(`Class: ${travelClassLabels[input.travelClass] || input.travelClass}`);
  }

  if (airline) lines.push(`Airline: ${airline}`);

  lines.push("Please share the best available fare and options.");
  return lines.join("\n");
}

export function buildFlightSearchEnquiryUrl(input: FlightSearchEnquiryInput) {
  const text = encodeURIComponent(buildFlightSearchEnquiryMessage(input));
  return `${WHATSAPP_URL}?text=${text}`;
}

export function openFlightSearchEnquiry(input: FlightSearchEnquiryInput) {
  window.open(buildFlightSearchEnquiryUrl(input), "_blank", "noopener,noreferrer");
}
