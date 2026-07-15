"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ContentPageHero } from "@/components/ContentPageHero";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1534088568595-a066be7709de?auto=format&fit=crop&w=1800&q=85",
  team: "/aboutus.jpeg",
  cta: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=85",
};

const eyebrowClass = "text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]";
const sectionTitleClass = "text-2xl font-extrabold leading-tight text-[#e30613] sm:text-3xl md:text-4xl";
const bodyClass = "text-base leading-relaxed text-gray-600";
const sectionPaddingClass = "px-4 py-8 sm:py-10 md:py-14";

const imageBadgeClass =
  "absolute left-3 top-3 rounded-md bg-[#e30613] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm";

const serviceCardImageClass =
  "aspect-[5/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]";

const stats = [
  { value: "25+", label: "Years Experience Worldwide" },
  { value: "160", label: "Destinations" },
  { value: "97%", label: "Satisfaction Rate" },
  { value: "24/7", label: "Travel Support" },
];

const pillars = [
  {
    title: "Our Mission",
    text: "Make travel booking simple, transparent and reliable for every customer we serve.",
  },
  {
    title: "Our Vision",
    text: "Become the most trusted travel partner for journeys across the UAE and worldwide.",
  },
  {
    title: "Our Values",
    text: "Honesty, expert guidance and traveler-first service in everything we do.",
  },
];

const services = [
  {
    title: "Flights",
    badge: "Best Fares",
    text: "Domestic and international fares with flexible options.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    href: "/flights",
  },
  {
    title: "Hotels",
    badge: "Verified Stays",
    text: "Budget hotels to luxury resorts worldwide.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    href: "/hotels",
  },
  {
    title: "Visa",
    badge: "Expert Help",
    text: "Documentation guidance and fast processing support.",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    href: "/visa",
  },
];

const strengths = [
  { title: "Transparent Pricing", text: "Clear quotes with no hidden charges." },
  { title: "Expert Advisors", text: "Deep knowledge of routes, visas and hotels." },
  { title: "Personalized Plans", text: "Tailored to your dates, budget and style." },
  { title: "End-to-End Support", text: "We stay with you from enquiry to return." },
];

const promises = [
  "Best price options matched to your budget",
  "Fast response on WhatsApp, phone and email",
  "Trusted partners for flights and hotels",
  "Visa guidance included",
];

const highlights = [
  { title: "UAE Based", sub: "Local experts, global reach" },
  { title: "Full Service", sub: "Flights to visa in one place" },
  { title: "Trusted Care", sub: "Support before and after travel" },
];

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function AboutPage() {
  return (
    <SiteShell active="About Us">
      <div className="w-full overflow-x-hidden">
        <ContentPageHero
          image={IMAGES.hero}
          title="About Us"
          description="Your trusted travel partner for flights, hotels, visas and packages worldwide."
          highlights={highlights}
          centered
          compact
          showBreadcrumb={false}
        />

        <section className="w-full border-b border-white/10 bg-[#042448]">
          <div className="mx-auto grid w-full max-w-[1260px] grid-cols-2 divide-x divide-y divide-white/15 md:grid-cols-4 md:divide-y-0">
            {stats.map((item) => (
              <div key={item.label} className="min-w-0 px-3 py-4 text-center sm:px-4 sm:py-5">
                <p className="text-xl font-extrabold text-[#e30613] sm:text-2xl md:text-3xl">{item.value}</p>
                <p className="mt-1 text-xs text-white/75 sm:text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`mx-auto w-full max-w-[1260px] ${sectionPaddingClass}`}>
          <div className="grid w-full items-center gap-6 lg:grid-cols-2 lg:gap-12">
            <motion.div {...fadeUp}>
              <div className="overflow-hidden rounded-xl">
                <Image
                  src={IMAGES.team}
                  alt="REDE I FLIGHTS professional team"
                  width={900}
                  height={600}
                  className="aspect-[5/3] w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-center gap-3 border-l-[3px] border-[#e30613] pl-4">
                <p className="text-2xl font-extrabold text-[#e30613]">25+</p>
                <p className="text-sm font-semibold text-[#0b2f57]">
                  Years of experience serving travelers worldwide
                </p>
              </div>
            </motion.div>

            <motion.div {...fadeUp}>
              <p className={eyebrowClass}>Who We Are</p>
              <h2 className={`mt-2 ${sectionTitleClass}`}>Your Trusted Travel Partner</h2>
              <p className={`mt-3 ${bodyClass}`}>
                REDE I FLIGHTS makes travel planning easier for families, business travelers and
                holiday makers with industry expertise and personal care on every booking.
              </p>

              <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
                {pillars.map((item) => (
                  <div
                    key={item.title}
                    className="home-feature border-l-[3px] border-[#e30613]/30 py-0.5 pl-4"
                  >
                    <p className="text-base font-bold text-[#e30613]">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="w-full border-y border-slate-200 bg-[#f8fafc]">
          <div className={`mx-auto w-full max-w-[1260px] ${sectionPaddingClass}`}>
            <div className="grid w-full items-start gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-10">
              <div>
                <p className={eyebrowClass}>Our Promise</p>
                <h2 className={`mt-2 ${sectionTitleClass}`}>Travel With Confidence</h2>
                <p className={`mt-3 ${bodyClass}`}>
                  Every enquiry is handled with care - clear communication, honest advice and
                  reliable support.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {promises.map((item) => (
                  <div
                    key={item}
                    className="home-feature min-w-0 border-l-[3px] border-[#e30613]/30 py-1 pl-4"
                  >
                    <p className="text-sm font-semibold text-[#0b2f57] sm:text-base">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`mx-auto w-full max-w-[1260px] ${sectionPaddingClass}`}>
          <div className="mb-6 text-center sm:mb-8">
            <p className={eyebrowClass}>What We Offer</p>
            <h2 className={`mt-2 ${sectionTitleClass}`}>Complete Travel Solutions</h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
            {services.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group min-w-0"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={640}
                    height={360}
                    className={serviceCardImageClass}
                  />
                  <span className={imageBadgeClass}>{item.badge}</span>
                </div>
                <h3 className="mt-2.5 text-lg font-bold text-[#e30613]">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-[#e30613]"
                >
                  Explore {item.title} <span aria-hidden>→</span>
                </Link>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="w-full border-t border-slate-200">
          <div className={`mx-auto w-full max-w-[1260px] ${sectionPaddingClass}`}>
            <div className="mx-auto max-w-3xl text-center">
              <p className={eyebrowClass}>Why Choose Us</p>
              <h2 className={`mt-2 ${sectionTitleClass}`}>Built Around Your Journey</h2>
              <p className={`mt-3 ${bodyClass}`}>
                Clarity, quality and responsive service from your first message to your safe return
                home.
              </p>
            </div>

            <div className="mx-auto mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              {strengths.map((item) => (
                <div
                  key={item.title}
                  className="home-feature min-w-0 border-l-[3px] border-[#e30613]/30 py-0.5 pl-4"
                >
                  <p className="text-sm font-bold text-[#e30613] sm:text-base">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative w-full overflow-hidden border-t border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.cta}
            alt=""
            aria-hidden
            className="absolute inset-0 z-0 h-full w-full object-cover object-center brightness-[0.5]"
          />
          <div className="absolute inset-0 z-[1] bg-[#042448]/85" />

          <div className="relative z-[2] mx-auto w-full max-w-[1260px] px-4 py-10 text-center sm:py-12 md:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Ready to Travel?
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#e30613] md:text-4xl">
              Let&apos;s Plan Your Next Trip
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/90">
              Speak with our experts for flights, hotels, visa and holiday packages.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
