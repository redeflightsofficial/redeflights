import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { VisaImage } from "@/components/VisaImage";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getVisaBySlug } from "@/lib/visa-store";
import { DEFAULT_VISA_IMAGE, resolveVisaImageUrl } from "@/lib/visa-display";
import { dynamicPageMetadata, brandedTitle } from "@/lib/site-seo";

type VisaDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_IMAGE = DEFAULT_VISA_IMAGE;

async function loadActiveVisa(slug: string) {
  const visa = await getVisaBySlug(slug);
  if (!visa || visa.status !== "active") return null;
  return visa;
}

export async function generateMetadata({ params }: VisaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const visa = await loadActiveVisa(slug);

  if (!visa) {
    return { title: { absolute: brandedTitle("Visa Service Not Found") } };
  }

  return dynamicPageMetadata(
    visa.h1_heading || `${visa.country} Visa`,
    visa.meta_description,
    visa.seo_keywords,
    visa.page_url,
  );
}

export default async function VisaDetailPage({ params }: VisaDetailPageProps) {
  const { slug } = await params;
  const visa = await loadActiveVisa(slug);

  if (!visa) notFound();

  const visaLabel = visa.visa_type ? `${visa.country} ${visa.visa_type}` : visa.country;
  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want to apply for ${visaLabel} visa. Please guide me.`,
  )}`;
  const heroImage = resolveVisaImageUrl(visa.image_url, FALLBACK_IMAGE);

  return (
    <SiteShell active="Visa">
      <section
        className="hero-depth relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(4, 36, 72, 0.88) 0%, rgba(11, 47, 87, 0.72) 45%, rgba(4, 36, 72, 0.55) 100%), url('${heroImage}')`,
        }}
      >
        <div className="mx-auto max-w-[1260px] px-4 py-10 text-white sm:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-white/20 bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Visa Services
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {visa.h1_heading}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
              {visa.meta_description}
            </p>
            <p className="mt-3 text-[11px] font-medium text-white/70">
              Home / Visa / {visaLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(11,47,87,0.06)] sm:p-6">
            <h2 className="text-xl font-bold text-[#0b2f57]">
              {visa.visa_type ? `${visa.country} ${visa.visa_type} Visa` : `${visa.country} Visa`}
            </h2>
            {visa.processing_time ? (
              <p className="mt-2 text-sm font-semibold text-[#e30613]">
                Processing: {visa.processing_time}
              </p>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {visa.description ||
                `Apply for your ${visa.visa_type ? `${visa.country} ${visa.visa_type.toLowerCase()}` : visa.country} visa with REDE FLIGHTS. Our team helps with document checklist, application review and status guidance.`}
            </p>
            <a
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium mt-6 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Apply on WhatsApp
            </a>
          </article>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(11,47,87,0.06)]">
            <VisaImage
              src={heroImage}
              alt={`${visa.country} visa`}
              width={700}
              height={420}
              className="h-56 w-full object-cover sm:h-full"
            />
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-4xl text-center">
          <Link href="/visa" className="text-sm font-semibold text-[#e30613] hover:underline">
            ← Browse all visa services
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
