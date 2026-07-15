"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlightLocationAutocomplete } from "@/components/FlightLocationAutocomplete";
import { PageHero } from "@/components/PageHero";
import { SiteShell } from "@/components/SiteShell";
import { SwapRoutesIcon, WhatsAppIcon } from "@/components/icons";
import {
  buildFlightDeal,
  buildFlightEnquiryUrl,
  findMatchingRouteAirline,
  openFlightSearchEnquiry,
  sortFlightDeals,
  type FlightDeal,
} from "@/lib/flight-deal-display";
import {
  buildFlightSearchLocations,
  matchesFlightLocation,
} from "@/lib/flight-search-locations";
import type { Airport } from "@/types/airport";
import type { Route } from "@/types/route";

type SortOption = "newest" | "route" | "airline";

const flightsLabelClass =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/90";
const flightsFieldClass =
  "min-h-[42px] w-full rounded-lg border border-white/25 bg-white px-3 py-2 text-sm font-semibold text-[#0b2f57] outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/30";
const flightsSwapButtonClass =
  "mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white text-[#e30613] shadow-sm transition hover:bg-white/90 active:scale-95";

function DealCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5">
      <div className="space-y-1.5">
        <div className="h-2.5 w-20 rounded bg-slate-100" />
        <div className="h-3.5 w-36 rounded bg-slate-100" />
      </div>
      <div className="mt-3 h-9 rounded-md bg-slate-100" />
    </div>
  );
}

function FlightDealCard({ deal }: { deal: FlightDeal }) {
  const enquiryUrl = buildFlightEnquiryUrl(deal.fromCity, deal.toCity, deal.airline);

  return (
    <article className="group rounded-xl border border-slate-200/90 bg-white p-4 transition duration-200 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(11,47,87,0.07)]">
      <div className="min-w-0 space-y-2">
        <p className="truncate text-xs font-semibold text-[#0b2f57]">{deal.airline}</p>
        <h3 className="truncate text-sm font-bold leading-snug text-[#0b2f57]">
          {deal.fromCity}
          <span className="mx-2 font-normal text-slate-300">→</span>
          {deal.toCity}
        </h3>
      </div>

      <a
        href={enquiryUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-premium mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#e30613] text-xs font-semibold text-white transition hover:bg-[#c40010]"
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
        Enquire Now
      </a>
    </article>
  );
}

export default function FlightsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelClass, setTravelClass] = useState("economy");

  const loadRoutes = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [routesResponse, airportsResponse] = await Promise.all([
        fetch("/api/routes", { cache: "no-store" }),
        fetch("/api/airports", { cache: "no-store" }),
      ]);

      const routesResult = (await routesResponse.json()) as { routes?: Route[]; error?: string };
      const airportsResult = (await airportsResponse.json()) as {
        airports?: Airport[];
        error?: string;
      };

      if (!routesResponse.ok) {
        setError(routesResult.error || "Unable to load flight routes.");
        setRoutes([]);
        setAirports([]);
        return;
      }

      setRoutes(routesResult.routes || []);
      setAirports(airportsResponse.ok ? airportsResult.airports || [] : []);
      setError(null);
    } catch {
      if (!silent) {
        setError("Network error while loading flight routes.");
        setRoutes([]);
        setAirports([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const to = params.get("to");
    const depart = params.get("depart");
    if (from) setFromQuery(from);
    if (to) setToQuery(to);
    if (depart) setDepartDate(depart);
  }, []);

  useEffect(() => {
    const onFocus = () => loadRoutes(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadRoutes(true);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") loadRoutes(true);
    }, 45000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [loadRoutes]);

  const locationOptions = useMemo(
    () => buildFlightSearchLocations(routes, airports),
    [routes, airports],
  );

  const deals = useMemo(() => {
    const built = routes.map(buildFlightDeal);
    const filtered = built.filter((deal) => {
      const fromMatch = matchesFlightLocation(fromQuery, deal.fromCity, deal.fromCode);
      const toMatch = matchesFlightLocation(toQuery, deal.toCity, deal.toCode);
      return fromMatch && toMatch;
    });

    if (sortBy === "newest") {
      const order = new Map(routes.map((route, index) => [route.id, index]));
      return [...filtered].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    return sortFlightDeals(filtered, sortBy);
  }, [routes, sortBy, fromQuery, toQuery]);

  const searchGridClass =
    tripType === "return"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-3"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end lg:gap-3";

  return (
    <SiteShell active="Flights">
      <PageHero
        eyebrow="Fly Anywhere, Anytime"
        title="Flights"
        description="Your Journey, Our Priority"
        breadcrumb="Flights"
        centered
        compact
        eyebrowVariant="badge"
        showBreadcrumb={false}
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80"
      >
        <div className="mx-auto max-w-[1260px] px-4 pb-4 sm:mt-[-6px]">
          <div className="overflow-x-hidden rounded-xl bg-gradient-to-br from-[#a8000d] via-[#e30613] to-[#c40010] shadow-[0_16px_36px_rgba(179,0,15,0.3)] ring-1 ring-white/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-4 py-2.5 sm:px-5">
              <div className="inline-flex gap-1 rounded-full border border-white/20 bg-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setTripType("one-way");
                    setReturnDate("");
                  }}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                    tripType === "one-way"
                      ? "bg-white text-[#e30613] shadow-sm"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  One Way
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("return")}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                    tripType === "return"
                      ? "bg-white text-[#e30613] shadow-sm"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  Return
                </button>
              </div>
              <p className="text-[10px] font-medium text-white/70">
                {locationOptions.length} cities
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <div className={searchGridClass}>
                <div className="flex min-w-0 items-end gap-2 sm:col-span-2 lg:col-span-1">
                  <div className="min-w-0 flex-1">
                    <FlightLocationAutocomplete
                      label="From"
                      value={fromQuery}
                      onChange={setFromQuery}
                      options={locationOptions}
                      placeholder="City"
                      labelClassName={flightsLabelClass}
                      inputClassName={flightsFieldClass}
                    />
                  </div>

                  <button
                    type="button"
                    aria-label="Swap from and to"
                    onClick={() => {
                      setFromQuery(toQuery);
                      setToQuery(fromQuery);
                    }}
                    className={flightsSwapButtonClass}
                  >
                    <SwapRoutesIcon className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <FlightLocationAutocomplete
                      label="To"
                      value={toQuery}
                      onChange={setToQuery}
                      options={locationOptions}
                      placeholder="City"
                      labelClassName={flightsLabelClass}
                      inputClassName={flightsFieldClass}
                    />
                  </div>
                </div>

                <label className="flight-date-field block min-w-0">
                  <span className={flightsLabelClass}>Departure</span>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => {
                      const nextDepartDate = e.target.value;
                      setDepartDate(nextDepartDate);
                      if (returnDate && nextDepartDate && returnDate < nextDepartDate) {
                        setReturnDate("");
                      }
                    }}
                    className={`${flightsFieldClass} flight-date-input`}
                  />
                </label>

                {tripType === "return" ? (
                  <label className="flight-date-field block min-w-0">
                    <span className={flightsLabelClass}>Return</span>
                    <input
                      type="date"
                      value={returnDate}
                      min={departDate || undefined}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className={`${flightsFieldClass} flight-date-input`}
                    />
                  </label>
                ) : null}

                <label className="block min-w-0">
                  <span className={flightsLabelClass}>Class</span>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className={flightsFieldClass}
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const airline = findMatchingRouteAirline(routes, fromQuery, toQuery);
                    openFlightSearchEnquiry({
                      from: fromQuery,
                      to: toQuery,
                      tripType,
                      departDate,
                      returnDate: tripType === "return" ? returnDate : undefined,
                      travelClass,
                      airline,
                    });
                  }}
                  className="btn-premium inline-flex h-[42px] w-full items-center justify-center gap-2 self-end rounded-lg bg-[#0b2f57] px-5 text-sm font-bold tracking-wide text-white shadow-[0_6px_16px_rgba(11,47,87,0.3)] transition hover:bg-[#092847] active:scale-[0.98] sm:col-span-2 lg:col-span-1 lg:min-w-[148px]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enquiry Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      <section className="border-t border-slate-200/80 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-8 md:py-10">
          <div className="mb-5 border-b border-slate-200/80 pb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e30613]">
              Popular Routes
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#e30613] sm:text-2xl">
              Routes Travelers Book Most
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading available routes..."
                : `${deals.length} active route${deals.length === 1 ? "" : "s"} · updated automatically`}
            </p>

            <label className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-xs">
              <span className="text-slate-500">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="cursor-pointer bg-transparent font-semibold text-[#0b2f57] outline-none"
              >
                <option value="newest">Newest</option>
                <option value="route">Route A-Z</option>
                <option value="airline">Airline A-Z</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-white px-4 py-6 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => loadRoutes()}
                className="mt-2 text-sm font-semibold text-[#e30613]"
              >
                Try again
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <DealCardSkeleton key={index} />
              ))}
            </div>
          ) : null}

          {!loading && !error && deals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <p className="text-base font-semibold text-[#0b2f57]">No active routes yet</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
                Add a route in dashboard and set status to Active — it will appear here
                automatically.
              </p>
              <Link
                href="/contact"
                className="btn-premium mt-4 inline-flex min-h-[40px] items-center rounded-lg bg-[#e30613] px-5 text-sm font-semibold text-white"
              >
                Contact for Custom Quote
              </Link>
            </div>
          ) : null}

          {!loading && !error && deals.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {deals.map((deal) => (
                <FlightDealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}
