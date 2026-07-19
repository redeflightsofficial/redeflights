import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { getPackageBySlug } from "@/lib/package-store";
import { brandedTitle, dynamicPageMetadata, SITE_URL } from "@/lib/site-seo";

type PackagePageProps = {
  params: Promise<{ slug: string }>;
};

async function loadActivePackage(slug: string) {
  const tourPackage = await getPackageBySlug(slug);
  return tourPackage?.status === "active" ? tourPackage : null;
}

export async function generateMetadata({ params }: PackagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const tourPackage = await loadActivePackage(slug);
  if (!tourPackage) return { title: { absolute: brandedTitle("Tour Package Not Found") } };

  const description = `Explore the ${tourPackage.title} tour package: ${tourPackage.route}, ${tourPackage.duration}. Enquire with REDE FLIGHTS.`;
  return dynamicPageMetadata(
    tourPackage.title,
    description,
    `${tourPackage.title}, ${tourPackage.region} tour package, holiday package`,
    `${SITE_URL.replace(/\/$/, "")}/packages/${encodeURIComponent(slug)}`,
  );
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { slug } = await params;
  const tourPackage = await loadActivePackage(slug);
  if (!tourPackage) notFound();

  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(
    `Hi REDE FLIGHTS, I want details for the ${tourPackage.title} tour package (${tourPackage.duration}, ${tourPackage.route}).`,
  )}`;

  return (
    <SiteShell active="Tour Packages">
      <section className="mx-auto max-w-[1260px] px-4 py-8 sm:py-10">
        <article className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(11,47,87,0.09)] lg:grid-cols-[3fr_2fr]">
          <div className="relative min-h-[280px] bg-slate-100 sm:min-h-[400px]">
            <Image
              src={tourPackage.image_url || "/background.png"}
              alt={tourPackage.title}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {tourPackage.tag || "Tour Package"}
              </span>
              <span className="text-xs font-semibold text-slate-500">{tourPackage.duration}</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#0b2f57]">{tourPackage.title}</h1>
            <p className="mt-2 text-sm font-semibold text-[#e30613]">{tourPackage.route}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Discover this {tourPackage.region || "international"} holiday package with expert planning and booking support from REDE FLIGHTS.
            </p>
            {tourPackage.includes.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {tourPackage.includes.map((item) => (
                  <span key={item} className="rounded-full bg-[#fff5f6] px-3 py-1 text-xs font-semibold text-[#e30613]">
                    {item}
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
                Enquire now
              </a>
              <Link href="/packages" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0b2f57]">
                All packages
              </Link>
            </div>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
