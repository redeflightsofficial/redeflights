"use client";

import Link from "next/link";
import { ContentPageHero } from "@/components/ContentPageHero";
import { DestinationSearchSection } from "@/components/destinations/DestinationSearchSection";
import { SiteShell } from "@/components/SiteShell";
import { WHATSAPP_URL } from "@/lib/contact";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85";
const CTA_IMAGE =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=85";

const eyebrowClass = "text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]";
const sectionTitleClass = "text-2xl font-extrabold leading-tight text-[#e30613] sm:text-3xl md:text-4xl";
const bodyClass = "text-base leading-relaxed text-gray-600";

const highlights = [
  { title: "160 Destinations", sub: "Worldwide travel options" },
  { title: "Curated Packages", sub: "Handpicked by our experts" },
  { title: "Best Price Options", sub: "Transparent, competitive fares" },
];

const strengths = [
  { title: "Expert Planning", text: "Routes, stays and visas handled by specialists." },
  { title: "Flexible Options", text: "Dates, budgets and travel styles tailored to you." },
  { title: "UAE-Based Team", text: "Local advisors with global destination knowledge." },
  { title: "End-to-End Support", text: "From enquiry to return - we stay with you." },
];

export default function DestinationsPage() {
  return (
    <SiteShell active="Destinations">
      <ContentPageHero
        image={HERO_IMAGE}
        eyebrow="Explore The World"
        title="Destinations"
        description="Discover handpicked destinations worldwide. From Europe, Asia and beyond - plan your next journey with trusted travel experts worldwide."
        highlights={highlights}
        centered
        showBreadcrumb={false}
      />

      <DestinationSearchSection />

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { title: "Global Coverage", sub: "International flights worldwide" },
            { title: "Personalized Plans", sub: "Built around your dates and budget" },
            { title: "24/7 Assistance", sub: "Support before and after travel" },
          ].map((item) => (
            <div key={item.title} className="px-6 py-7 text-center sm:py-8">
              <p className="text-lg font-bold text-[#e30613]">{item.title}</p>
              <p className="mt-2 text-base text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why book */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1260px] px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className={eyebrowClass}>Why Book With Us</p>
            <h2 className={`mt-2 ${sectionTitleClass}`}>Plan With Confidence</h2>
            <p className={`mt-4 ${bodyClass}`}>
              Whether it is a family holiday, honeymoon or business trip - our team finds the
              right destination, dates and budget with honest advice and fast support.
            </p>
          </div>
          <div className="mx-auto mt-7 grid max-w-4xl gap-4 sm:grid-cols-2">
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
            Ready to Travel?
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#e30613] md:text-4xl">
            Let&apos;s Plan Your Next Destination
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90">
            Share your travel plans and our experts will send curated options within hours.
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
