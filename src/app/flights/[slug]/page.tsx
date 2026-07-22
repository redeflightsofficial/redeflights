import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { getBannerBySlug } from "@/lib/banner-store";
import { parseRouteFromSlug } from "@/lib/banner-meta";
import { getAirlineByIataCode } from "@/lib/airline-store";
import { getAirportByIataCode } from "@/lib/airport-store";
import { buildFlightDeal, buildFlightEnquiryUrl } from "@/lib/flight-deal-display";
import { airlineDetailHref, airportDetailHref } from "@/lib/flight-entity-links";
import { getRouteBySlug } from "@/lib/route-store";
import { dynamicPageMetadata, brandedTitle } from "@/lib/site-seo";
import type { Route } from "@/types/route";

type FlightRoutePageProps = {
  params: Promise<{ slug: string }>;
};

async function loadActiveRoute(slug: string) {
  const [route, banner] = await Promise.all([getRouteBySlug(slug), getBannerBySlug(slug)]);
  const activeBanner = banner?.status === "active" ? banner : null;

  if (route?.status === "active") {
    return {
      route,
      heroImage: activeBanner?.image_url || "/aboutus.png",
      heroAlt: activeBanner?.alt || `${route.from_city} to ${route.to_city} flights`,
    };
  }

  if (!activeBanner) return null;
  const locations = parseRouteFromSlug(activeBanner.slug || slug);
  if (!locations) return null;

  const bannerRoute: Route = {
    id: activeBanner.id,
    from_city: locations.from,
    to_city: locations.to,
    from_airport_code: null,
    to_airport_code: null,
    airline_name: null,
    airline_iata_code: null,
    slug,
    og_title: activeBanner.seo_title || activeBanner.alt,
    og_description: activeBanner.meta_description || "",
    seo_keywords: `${locations.from} to ${locations.to} flights, cheap flights, rede flights`,
    seo_title: activeBanner.seo_title || activeBanner.alt,
    meta_description:
      activeBanner.meta_description ||
      `Book cheap flights from ${locations.from} to ${locations.to} with REDE FLIGHTS.`,
    h1_heading: activeBanner.h1_heading || `${locations.from} to ${locations.to} Flights`,
    page_url: activeBanner.page_url || `/flights/${encodeURIComponent(slug)}`,
    status: "active",
    created_at: activeBanner.created_at,
  };

  return {
    route: bannerRoute,
    heroImage: activeBanner.image_url,
    heroAlt: activeBanner.alt,
  };
}

export async function generateMetadata({ params }: FlightRoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadActiveRoute(slug);

  if (!data) {
    return { title: { absolute: brandedTitle("Flight Not Found") } };
  }

  return dynamicPageMetadata(
    data.route.h1_heading || `${data.route.from_city} to ${data.route.to_city} Flights`,
    data.route.meta_description,
    data.route.seo_keywords,
    data.route.page_url,
  );
}

export default async function FlightRoutePage({ params }: FlightRoutePageProps) {
  const { slug } = await params;
  const data = await loadActiveRoute(slug);

  if (!data) notFound();

  const { route, heroImage, heroAlt } = data;
  const deal = buildFlightDeal(route);
  const enquiryUrl = buildFlightEnquiryUrl(route.from_city, route.to_city, deal.airline);
  const heroTitle = route.h1_heading || `${route.from_city} to ${route.to_city} Flights`;

  const [airline, fromAirport, toAirport] = await Promise.all([
    route.airline_iata_code ? getAirlineByIataCode(route.airline_iata_code) : Promise.resolve(null),
    route.from_airport_code ? getAirportByIataCode(route.from_airport_code) : Promise.resolve(null),
    route.to_airport_code ? getAirportByIataCode(route.to_airport_code) : Promise.resolve(null),
  ]);

  const airlineHref =
    airline?.status === "active" && airline.slug ? airlineDetailHref(airline.slug) : null;
  const fromAirportHref =
    fromAirport?.status === "active" && fromAirport.slug
      ? airportDetailHref(fromAirport.slug)
      : null;
  const toAirportHref =
    toAirport?.status === "active" && toAirport.slug ? airportDetailHref(toAirport.slug) : null;

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-[1260px] bg-white lg:grid-cols-[7fr_3fr]">
        <div className="relative h-[210px] bg-white p-3 sm:h-[270px] sm:p-4 lg:h-[330px]">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-contain p-3 sm:p-4"
          />
        </div>

        <div className="hero-depth flex items-center bg-gradient-to-br from-[#042448] to-[#0b2f57] px-5 py-8 text-white sm:px-7 lg:px-6">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/95 backdrop-blur-sm">
              Flights
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight xl:text-3xl">{heroTitle}</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              {route.meta_description}
            </p>
            <p className="mt-3 text-[11px] font-medium text-white/70">
              Home / Flights / {route.from_city} to {route.to_city}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-7 sm:py-9">
        <div className="mx-auto max-w-2xl">
          <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(11,47,87,0.06)] sm:p-5">
            <div className="min-w-0 space-y-2">
              {airlineHref ? (
                <Link
                  href={airlineHref}
                  className="text-sm font-semibold text-[#0b2f57] transition hover:text-[#e30613]"
                >
                  {deal.airline}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-[#0b2f57]">{deal.airline}</p>
              )}
              <h2 className="text-lg font-bold leading-snug text-[#0b2f57]">
                {fromAirportHref ? (
                  <Link href={fromAirportHref} className="transition hover:text-[#e30613]">
                    {deal.fromCity}
                  </Link>
                ) : (
                  deal.fromCity
                )}
                <span className="mx-2.5 font-normal text-slate-300">→</span>
                {toAirportHref ? (
                  <Link href={toAirportHref} className="transition hover:text-[#e30613]">
                    {deal.toCity}
                  </Link>
                ) : (
                  deal.toCity
                )}
              </h2>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-600">
              Book your flight from {route.from_city} to {route.to_city} with REDE FLIGHTS. Compare fares,
              get expert assistance, and enquire instantly on WhatsApp for the best available options.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={enquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Enquire on WhatsApp
              </a>
              <Link
                href="/flights"
                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0b2f57] transition hover:border-[#0b2f57]/30"
              >
                Browse all flights
              </Link>
            </div>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
