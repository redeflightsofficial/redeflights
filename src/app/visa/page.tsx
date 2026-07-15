"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { BrandLogo } from "@/components/BrandLogo";
import { VisaImage } from "@/components/VisaImage";
import { WHATSAPP_URL } from "@/lib/contact";
import { DEFAULT_VISA_IMAGE, resolveVisaImageUrl } from "@/lib/visa-display";
import type { Visa } from "@/types/visa";

const CTA_IMAGE =
  "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1800&q=85";

const eyebrowClass = "text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]";
const sectionTitleClass = "text-2xl font-extrabold leading-tight text-[#e30613] sm:text-3xl md:text-4xl";
const bodyClass = "text-base leading-relaxed text-gray-600";

const highlights = [
  { title: "Expert Guidance", sub: "Document checklist and profile review" },
  { title: "High Success Rate", sub: "Trusted visa processing support" },
  { title: "Fast Processing", sub: "Priority handling for urgent travel" },
];

const trustItems = [
  { title: "Tourist Visas", sub: "Holiday and leisure travel worldwide" },
  { title: "Business Visas", sub: "Meetings, conferences and work trips" },
];

const visaCardImageClass =
  "object-cover object-center transition duration-500 group-hover:scale-[1.03]";

const visaCardAspectClass = "aspect-[5/3] w-full";

const strengths = [
  { title: "Profile Assessment", text: "We review your travel history and documents before submission." },
  { title: "Document Checklist", text: "Clear list of required papers for each visa type." },
  { title: "Application Review", text: "Forms checked by experienced visa advisors." },
  { title: "Status Updates", text: "Guidance from application to embassy decision." },
];

const documents = [
  "Valid passport (6+ months validity)",
  "Recent passport-size photographs",
  "Confirmed flight itinerary",
  "Hotel booking or invitation letter",
  "Bank statements and financial proof",
  "Travel insurance (where required)",
];

const steps = [
  { n: "01", title: "Share Your Plan", text: "Tell us destination, visa type and travel dates." },
  { n: "02", title: "Document Preparation", text: "We provide checklist and review your documents." },
  { n: "03", title: "Submit & Track", text: "Application support until visa decision." },
];

export default function VisaPage() {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVisas() {
      try {
        const response = await fetch("/api/visas", { cache: "no-store" });
        const result = (await response.json()) as { visas?: Visa[] };
        if (response.ok) setVisas(result.visas || []);
      } catch {
        setVisas([]);
      } finally {
        setLoading(false);
      }
    }

    loadVisas();
  }, []);

  const displayCards = useMemo(
    () =>
      visas.map((visa) => ({
        id: visa.id,
        country: visa.country,
        subtitle: visa.visa_type || "Visa Service",
        image: resolveVisaImageUrl(visa.image_url, DEFAULT_VISA_IMAGE),
        href: `/visa/${visa.slug}`,
      })),
    [visas],
  );

  return (
    <SiteShell active="Visa">
      <section className="border-b border-slate-200 bg-gradient-to-b from-sky-100 via-sky-50 to-white">
        <div className="mx-auto max-w-[1260px] px-4 py-8 text-center sm:py-10 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Hassle-Free Applications
            </p>
            <h1 className="sr-only">Visa Services</h1>
            <div className="mt-4 flex justify-center sm:mt-5">
              <BrandLogo variant="hero" tone="onLight" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#042448]">
        <div className="mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {highlights.map((item) => (
            <div key={item.title} className="px-4 py-5 text-center sm:px-6 sm:py-6 md:px-8">
              <p className="text-sm font-bold text-[#e30613] sm:text-base md:text-lg">{item.title}</p>
              <p className="mt-1 text-xs text-white/75 sm:text-sm">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {trustItems.map((item) => (
            <div key={item.title} className="px-6 py-7 text-center sm:py-8">
              <p className="text-lg font-bold text-[#e30613]">{item.title}</p>
              <p className="mt-2 text-base text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visa cards */}
      <section className="mx-auto max-w-[1260px] px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <p className={eyebrowClass}>Visa Destinations</p>
          <h2 className={`mt-2 ${sectionTitleClass}`}>Our Visa Services</h2>
          <p className={`mx-auto mt-3 max-w-2xl ${bodyClass}`}>
            {loading
              ? "Loading visa services..."
              : displayCards.length > 0
                ? "Choose your destination and start your application with expert support."
                : "Visa services will appear here once added from the admin dashboard."}
          </p>
        </div>

        {displayCards.length === 0 && !loading ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-[#f8fafc] px-6 py-12 text-center text-sm text-slate-500">
            No visa services available yet. Add and activate them from the admin panel.
          </p>
        ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayCards.map((item, index) => (
            <motion.div
              key={item.id}
              className="h-full"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={`group relative block overflow-hidden rounded-xl ${visaCardAspectClass}`}
              >
                <VisaImage
                  src={item.image}
                  alt={item.country}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={visaCardImageClass}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#042448]/90 via-[#042448]/35 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-3 p-5">
                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">{item.country}</h3>
                    <p className="mt-1 text-sm text-white/80">{item.subtitle}</p>
                  </div>
                  <span className="btn-premium shrink-0 bg-[#e30613] px-4 py-2.5 text-sm font-semibold text-white group-hover:bg-[#c40010]">
                    Apply Now
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        )}
      </section>

      {/* Why choose us */}
      <section className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-12 md:py-14">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className={eyebrowClass}>Why Choose Us</p>
              <h2 className={`mt-2 ${sectionTitleClass}`}>Trusted Visa Support</h2>
              <p className={`mt-4 ${bodyClass}`}>
                From document preparation to embassy submission guidance - our team helps you apply
                with confidence and clarity.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {strengths.map((item) => (
                  <div
                    key={item.title}
                    className="home-feature border-l-[3px] border-[#e30613]/30 py-0.5 pl-4"
                  >
                    <p className="text-sm font-bold text-[#e30613] sm:text-base">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={eyebrowClass}>Required Documents</p>
              <h2 className={`mt-2 ${sectionTitleClass}`}>What You May Need</h2>
              <ul className="mt-5 space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc}
                    className="home-feature border-l-[3px] border-[#e30613]/30 py-1 pl-4 text-sm text-gray-600 sm:text-base"
                  >
                    {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                Exact requirements vary by country and visa type. We provide a tailored checklist
                for your application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1260px] px-4 py-12 md:py-14">
          <div className="mb-10 text-center">
            <p className={eyebrowClass}>How It Works</p>
            <h2 className={`mt-2 ${sectionTitleClass}`}>Simple 3-Step Process</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#e30613] bg-white text-sm font-bold text-[#e30613]">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#e30613]">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CTA_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 z-0 h-full w-full object-cover object-center brightness-[0.55]"
        />
        <div className="absolute inset-0 z-[1] bg-[#042448]/88" />

        <div className="relative z-[2] mx-auto max-w-[1260px] px-4 py-14 text-center md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
            Need Visa Help?
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#e30613] md:text-4xl">
            Consult Our Visa Experts
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
            Our consultants will review your profile and guide you on the best visa path for your
            travel plans.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="btn-premium bg-[#e30613] px-7 py-3.5 text-base font-semibold text-white hover:bg-[#c40010]"
            >
              Contact Us
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-premium inline-flex items-center gap-2 border border-white/35 bg-white/10 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/20"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
