import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getUmrahBySlug } from "@/lib/umrah-store";
import { brandedTitle, dynamicPageMetadata } from "@/lib/site-seo";

type UmrahDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const DEFAULT_UMRAH_IMAGE =
  "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1400&q=80";

function parseFaq(raw: string) {
  const match = raw.match(/^(.+?\?)\s*(.+)$/);
  if (match) {
    return { question: match[1].trim(), answer: match[2].trim() };
  }
  return { question: raw.trim(), answer: "" };
}

async function loadActivePackage(slug: string) {
  const pkg = await getUmrahBySlug(slug);
  if (!pkg || pkg.status !== "active") return null;
  return pkg;
}

export async function generateMetadata({ params }: UmrahDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await loadActivePackage(slug);

  if (!pkg) {
    return { title: { absolute: brandedTitle("Umrah Package Not Found") } };
  }

  return dynamicPageMetadata(
    pkg.h1_heading || pkg.title,
    pkg.meta_description,
    pkg.seo_keywords || pkg.focus_keyword,
    pkg.page_url,
  );
}

export default async function UmrahDetailPage({ params }: UmrahDetailPageProps) {
  const { slug } = await params;
  const pkg = await loadActivePackage(slug);

  if (!pkg) notFound();

  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want details for ${pkg.title}${pkg.price_aed ? ` (AED ${pkg.price_aed})` : ""}.`,
  )}`;
  const heroImage = pkg.image_url || DEFAULT_UMRAH_IMAGE;
  const hotelLabel = [pkg.hotel_category, pkg.hotel_name].filter(Boolean).join(" · ");
  const includes = [
    pkg.visa_included ? "Visa assistance" : null,
    pkg.transfer_included ? "Airport transfers" : null,
    pkg.hotel_category ? `${pkg.hotel_category} hotel` : "Hotel stay",
    pkg.airline && pkg.airline !== "Any" ? `${pkg.airline} flights` : "Flight options",
  ].filter(Boolean) as string[];
  const faqs = (pkg.faqs || []).map(parseFaq);

  const details = [
    { label: "Departure", value: pkg.departure_city },
    { label: "Destination", value: pkg.destination },
    { label: "Nights", value: pkg.nights ? String(pkg.nights) : "" },
    { label: "Hotel", value: hotelLabel },
    { label: "Airline", value: pkg.airline },
    { label: "Package ID", value: pkg.package_code },
  ].filter((item) => item.value);

  return (
    <SiteShell active="Umrah">
      <section className="bg-white">
        <div className="mx-auto max-w-[980px] px-4 py-6 sm:py-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/umrah"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#0b2f57] transition hover:border-[#e30613]/40 hover:text-[#e30613]"
            >
              ← Back
            </Link>
            <p className="text-[11px] font-medium text-slate-500">
              <Link href="/" className="hover:text-[#e30613]">
                Home
              </Link>
              <span className="mx-1.5 text-slate-300">/</span>
              <Link href="/umrah" className="hover:text-[#e30613]">
                Umrah
              </Link>
              <span className="mx-1.5 text-slate-300">/</span>
              <span className="text-[#0b2f57]">{pkg.title}</span>
            </p>
          </div>

          <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={heroImage}
                  alt={pkg.image_alt || pkg.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e30613]">
                Umrah Package
              </p>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-[#0b2f57] sm:text-3xl">
                {pkg.h1_heading || pkg.title}
              </h1>
              {pkg.h2_heading ? (
                <p className="mt-1.5 text-sm font-semibold text-slate-500">{pkg.h2_heading}</p>
              ) : null}

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {pkg.long_description || pkg.short_description || pkg.meta_description}
              </p>

              {includes.length ? (
                <div className="mt-5">
                  <h2 className="text-sm font-bold text-[#0b2f57]">What’s included</h2>
                  <ul className="mt-2 space-y-1.5">
                    {includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-[#e30613]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28">
              {pkg.price_aed ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Starting from
                </p>
              ) : null}
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#e30613]">
                {pkg.price_aed ? `AED ${pkg.price_aed}` : "Enquire for price"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {pkg.departure_city || "Dubai"} to {pkg.destination || "Makkah & Madinah"}
                {pkg.nights ? ` · ${pkg.nights} nights` : ""}
              </p>

              <dl className="mt-5 space-y-2.5 border-t border-slate-200 pt-4">
                {details.map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-slate-500">{item.label}</dt>
                    <dd className="text-right font-semibold text-[#0b2f57]">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={enquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enquire on WhatsApp
                </a>
                <Link
                  href="/umrah"
                  className="inline-flex min-h-[40px] items-center justify-center text-sm font-semibold text-[#0b2f57] hover:text-[#e30613]"
                >
                  ← All Umrah packages
                </Link>
              </div>

              {faqs.length ? (
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <h2 className="text-sm font-bold text-[#0b2f57]">FAQs</h2>
                  <div className="mt-3 divide-y divide-slate-100">
                    {faqs.map((faq) => (
                      <div key={faq.question} className="py-2.5 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold text-[#0b2f57]">{faq.question}</p>
                        {faq.answer ? (
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{faq.answer}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
