"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import type { UmrahPackage } from "@/types/umrah";

const DEFAULT_UMRAH_IMAGE =
  "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80";

const highlights = [
  { title: "Visa Assistance", sub: "Document guidance for Umrah travel" },
  { title: "Hotel + Transfers", sub: "Stay near Haram with ground support" },
  { title: "From Dubai", sub: "Convenient packages for UAE travellers" },
];

export default function UmrahPage() {
  const [packages, setPackages] = useState<UmrahPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPackages() {
      try {
        const response = await fetch("/api/umrah", { cache: "no-store" });
        const result = (await response.json()) as { packages?: UmrahPackage[] };
        if (response.ok) setPackages(result.packages || []);
      } catch {
        setPackages([]);
      } finally {
        setLoading(false);
      }
    }

    loadPackages();
  }, []);

  const cards = useMemo(
    () =>
      packages.map((pkg) => ({
        id: pkg.id,
        title: pkg.title,
        subtitle: pkg.h2_heading || pkg.short_description || `${pkg.nights} nights from ${pkg.departure_city}`,
        price: pkg.price_aed,
        nights: pkg.nights,
        image: pkg.image_url || DEFAULT_UMRAH_IMAGE,
        href: `/umrah/${pkg.slug}`,
      })),
    [packages],
  );

  return (
    <SiteShell active="Umrah">
      <section className="border-b border-slate-200 bg-gradient-to-b from-sky-100 via-sky-50 to-white">
        <div className="mx-auto max-w-[1260px] px-4 py-8 text-center sm:py-10 md:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Spiritual Journey
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b2f57] sm:text-4xl md:text-5xl">
              Umrah Packages
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Affordable Umrah packages from Dubai with hotel, visa assistance and transfers —
              curated by REDE FLIGHTS.
            </p>
          </motion.div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200/90 bg-white px-4 py-4 text-left shadow-sm"
              >
                <p className="text-sm font-bold text-[#0b2f57]">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-10 sm:py-12">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Featured Packages
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#0b2f57] sm:text-3xl">
              Choose Your Umrah Package
            </h2>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading Umrah packages...</p>
          ) : cards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <p className="text-base font-semibold text-[#0b2f57]">Umrah packages coming soon</p>
              <p className="mt-1 text-sm text-slate-500">Contact us on WhatsApp for a custom quote.</p>
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent("Hi REDE FLIGHTS, I want Umrah package details.")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-premium mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e30613] px-5 py-2.5 text-sm font-semibold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" /> Enquire Now
              </a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                >
                  <Link
                    href={card.href}
                    className="group relative block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(11,47,87,0.06)] transition hover:-translate-y-0.5 hover:border-[#e30613]/25 hover:shadow-[0_16px_36px_rgba(11,47,87,0.1)]"
                  >
                    <div className="relative aspect-[5/3] overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#042448]/80 via-transparent to-transparent" />
                      {card.nights ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0b2f57]">
                          {card.nights} Nights
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 p-4">
                      <h3 className="text-base font-bold leading-snug text-[#0b2f57] group-hover:text-[#e30613]">
                        {card.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-slate-500">{card.subtitle}</p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <p className="text-sm font-bold text-[#e30613]">
                          {card.price ? `From AED ${card.price}` : "Enquire for price"}
                        </p>
                        <span className="text-xs font-semibold text-[#0b2f57] group-hover:text-[#e30613]">
                          View details →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1260px] px-4 py-10 text-center sm:py-12">
          <h2 className="text-2xl font-extrabold text-[#0b2f57]">Need a custom Umrah plan?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Tell us your preferred dates, hotel category and travellers — we will share the best options.
          </p>
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent("Hi REDE FLIGHTS, I need a custom Umrah package quote.")}`}
            target="_blank"
            rel="noreferrer"
            className="btn-premium mt-5 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp Enquiry
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
