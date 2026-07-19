import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getAirlineBySlug } from "@/lib/airline-store";
import { brandedTitle, dynamicPageMetadata } from "@/lib/site-seo";

type AirlinePageProps = {
  params: Promise<{ slug: string }>;
};

async function loadActiveAirline(slug: string) {
  const airline = await getAirlineBySlug(slug);
  return airline?.status === "active" ? airline : null;
}

export async function generateMetadata({ params }: AirlinePageProps): Promise<Metadata> {
  const { slug } = await params;
  const airline = await loadActiveAirline(slug);

  if (!airline) {
    return { title: { absolute: brandedTitle("Airline Not Found") } };
  }

  return dynamicPageMetadata(
    airline.h1_heading || `${airline.name} Flights`,
    airline.meta_description,
    `${airline.name} flights, ${airline.iata_code} airline, airline booking`,
    airline.page_url,
  );
}

export default async function AirlinePage({ params }: AirlinePageProps) {
  const { slug } = await params;
  const airline = await loadActiveAirline(slug);

  if (!airline) notFound();

  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want to book a flight with ${airline.name} (${airline.iata_code}). Please share the best available fares.`,
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
                Airline
              </span>
              <span className="rounded-xl bg-[#fff5f6] px-3 py-1.5 text-lg font-extrabold text-[#e30613]">
                {airline.iata_code}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-[#0b2f57] xl:text-3xl">
              {airline.h1_heading || `${airline.name} Flights`}
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {airline.name} • IATA: <strong>{airline.iata_code}</strong>
              {airline.icao_code ? ` • ICAO: ${airline.icao_code}` : ""}
              {airline.country ? ` • ${airline.country}` : ""}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{airline.meta_description}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Compare available fares and routes with quick booking support from our travel team.
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
            <p className="mt-4 text-[11px] font-medium text-slate-400">Home / Airlines / {airline.name}</p>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
