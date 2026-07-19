import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getAirportBySlug } from "@/lib/airport-store";
import { brandedTitle, dynamicPageMetadata } from "@/lib/site-seo";

type AirportPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadActiveAirport(slug: string) {
  const airport = await getAirportBySlug(slug);
  return airport?.status === "active" ? airport : null;
}

export async function generateMetadata({ params }: AirportPageProps): Promise<Metadata> {
  const { slug } = await params;
  const airport = await loadActiveAirport(slug);

  if (!airport) {
    return { title: { absolute: brandedTitle("Airport Not Found") } };
  }

  return dynamicPageMetadata(
    airport.h1_heading || `${airport.city} Airport Flights`,
    airport.meta_description,
    `${airport.name}, ${airport.iata_code} airport, flights from ${airport.city}, flights to ${airport.city}`,
    airport.page_url,
  );
}

export default async function AirportPage({ params }: AirportPageProps) {
  const { slug } = await params;
  const airport = await loadActiveAirport(slug);

  if (!airport) notFound();

  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I need flight options to or from ${airport.name} (${airport.iata_code}), ${airport.city}. Please share the best fares.`,
  )}`;

  return (
    <SiteShell active="Flights">
      <section className="w-full">
        <article className="grid overflow-hidden border-y border-slate-200/90 bg-white lg:grid-cols-[3fr_2fr]">
          <div className="relative min-h-[210px] bg-[#f8fafc] sm:min-h-[280px] lg:min-h-[400px]">
            <Image
              src="/aboutus.png"
              alt="International airline cabin crew"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-contain p-3 sm:p-5"
            />
          </div>

          <div className="flex flex-col justify-center border-t border-slate-200 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex rounded-full bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Airport
              </span>
              <span className="rounded-xl bg-[#fff5f6] px-3 py-1.5 text-lg font-extrabold text-[#e30613]">
                {airport.iata_code}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[#e30613] xl:text-3xl">
              {airport.h1_heading || `${airport.city} Airport (${airport.iata_code}) Flights`}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {airport.name} • {airport.city}
              {airport.country ? `, ${airport.country}` : ""} • IATA: <strong>{airport.iata_code}</strong>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{airport.meta_description}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Compare routes, schedules and fares with fast booking assistance from our travel team.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={enquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Check fares
              </a>
              <Link
                href="/flights"
                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0b2f57] transition hover:border-[#0b2f57]/30"
              >
                All flights
              </Link>
            </div>
            <p className="mt-4 text-[11px] font-medium text-slate-400">Home / Airports / {airport.name}</p>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
