import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { VisaImage } from "@/components/VisaImage";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getDestinationBySlug } from "@/lib/destination-store";
import { brandedTitle, dynamicPageMetadata } from "@/lib/site-seo";

type DestinationPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadActiveDestination(slug: string) {
  const destination = await getDestinationBySlug(slug);
  return destination?.status === "active" ? destination : null;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await loadActiveDestination(slug);
  if (!destination) return { title: { absolute: brandedTitle("Destination Not Found") } };

  return dynamicPageMetadata(
    destination.h1_heading || destination.title,
    destination.meta_description,
    destination.seo_keywords,
    destination.page_url,
  );
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = await loadActiveDestination(slug);
  if (!destination) notFound();

  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want to plan a trip to ${destination.title}, ${destination.country}. Please share suitable packages and travel options.`,
  )}`;

  return (
    <SiteShell active="Destinations">
      <section className="mx-auto max-w-[1260px] px-4 py-8 sm:py-10">
        <article className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(11,47,87,0.09)] lg:grid-cols-[3fr_2fr]">
          <div className="relative min-h-[260px] bg-slate-100 sm:min-h-[360px]">
            <VisaImage
              src={destination.image_url || "/background.png"}
              alt={destination.title}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <span className="w-fit rounded-full bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Destination
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#0b2f57]">
              {destination.h1_heading || destination.title}
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#e30613]">
              {destination.country} • {destination.region}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {destination.meta_description || destination.subtitle}
            </p>
            {destination.travel_styles.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {destination.travel_styles.map((style) => (
                  <span key={style} className="rounded-full bg-[#fff5f6] px-3 py-1 text-xs font-semibold text-[#e30613]">
                    {style}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={enquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Plan this trip
              </a>
              <Link href="/destinations" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0b2f57]">
                All destinations
              </Link>
            </div>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
