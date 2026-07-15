import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getHotelBySlug } from "@/lib/hotel-store";
import { dynamicPageMetadata, brandedTitle } from "@/lib/site-seo";

type HotelDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85";

async function loadActiveHotel(slug: string) {
  const hotel = await getHotelBySlug(slug);
  if (!hotel || hotel.status !== "active") return null;
  return hotel;
}

export async function generateMetadata({ params }: HotelDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await loadActiveHotel(slug);

  if (!hotel) {
    return { title: { absolute: brandedTitle("Hotel Not Found") } };
  }

  return dynamicPageMetadata(
    hotel.h1_heading || hotel.name,
    hotel.meta_description,
    hotel.seo_keywords,
    hotel.page_url,
  );
}

export default async function HotelDetailPage({ params }: HotelDetailPageProps) {
  const { slug } = await params;
  const hotel = await loadActiveHotel(slug);

  if (!hotel) notFound();

  const image = hotel.image_url || FALLBACK_IMAGE;
  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want hotel booking details for ${hotel.name} in ${hotel.location}. Please guide me.`,
  )}`;

  return (
    <SiteShell active="Hotels">
      <section
        className="hero-depth relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(4, 36, 72, 0.9), rgba(11, 47, 87, 0.62)), url('${image}')`,
        }}
      >
        <div className="mx-auto max-w-[1260px] px-4 py-10 text-white sm:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-white/20 bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Hotel Booking
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {hotel.h1_heading}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
              {hotel.meta_description}
            </p>
            <p className="mt-3 text-[11px] font-medium text-white/70">
              Home / Hotels / {hotel.name}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(11,47,87,0.06)] sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#e30613]">
              {hotel.location}
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#0b2f57]">{hotel.name}</h2>
            <p className="mt-2 text-sm font-semibold text-[#e30613]">
              {hotel.stars ? `${hotel.stars} Star` : "Hotel"} {hotel.rating ? `• ${hotel.rating}` : ""}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {hotel.description ||
                `Book ${hotel.name} in ${hotel.location} with REDE FLIGHTS. Our team helps with stay options, travel coordination and quick booking support.`}
            </p>
            {hotel.amenities.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {hotel.amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-[#fff5f6] px-3 py-1 text-xs font-semibold text-[#e30613]">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : null}
            <a
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium mt-6 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enquire on WhatsApp
            </a>
          </article>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(11,47,87,0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={hotel.name}
              className="h-56 w-full object-cover sm:h-full"
            />
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-4xl text-center">
          <Link href="/hotels" className="text-sm font-semibold text-[#e30613] hover:underline">
            Browse all hotels
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
