"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlightLocationAutocomplete } from "@/components/FlightLocationAutocomplete";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteShell } from "@/components/SiteShell";
import { SwapRoutesIcon, WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import { bannersToSlides } from "@/lib/banner";
import {
  findMatchingRouteAirline,
  openFlightSearchEnquiry,
} from "@/lib/flight-deal-display";
import { buildFlightSearchLocations } from "@/lib/flight-search-locations";
import { fetchPackagesFromApi, toDisplayPackage, type DisplayPackage } from "@/lib/packages";
import { SITE_BACKGROUND_VIDEO_SRC } from "@/lib/site-media";
import type { Airport } from "@/types/airport";
import type { Banner, BannerSlide } from "@/types/banner";
import type { Route } from "@/types/route";

const travelClassOptions = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const passengerOptions = [
  { value: "1a", label: "1 Adult" },
  { value: "2a", label: "2 Adults" },
  { value: "1a1c", label: "1 Adult, 1 Child" },
  { value: "2a1c", label: "2 Adults, 1 Child" },
];

const heroSearchLabelClass = "text-[11px] font-extrabold uppercase tracking-wide text-white/90";
const heroSearchCellClass =
  "flex min-h-[56px] min-w-0 flex-col justify-center overflow-x-hidden border-b border-white/15 bg-white/10 px-3 py-2.5 sm:min-h-[82px] sm:border-r sm:border-b-0 sm:px-4 sm:py-3 lg:px-4 lg:last:border-r-0";
const heroSearchDateCellClass =
  "flex min-h-[56px] min-w-0 flex-col justify-center border-b border-white/15 bg-white/10 px-3 py-2.5 sm:min-h-[82px] sm:border-r sm:border-b-0 sm:px-3.5 sm:pr-4 sm:py-3 lg:px-3.5 lg:pr-4";
const heroSearchTravellerCellClass = heroSearchCellClass;
const heroSearchSelectClass =
  "hero-search-select w-full min-w-0 cursor-pointer rounded-md border border-white/25 bg-white px-2 py-1.5 pr-6 text-sm font-semibold text-[#0b2f57] outline-none sm:text-[15px]";
const heroLocationInputClass =
  "mt-0.5 w-full min-w-0 rounded-md border border-white/25 bg-white px-2.5 py-2 text-sm font-semibold text-[#0b2f57] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-white/30 sm:mt-1 sm:text-[15px]";
const heroSearchDateInputClass =
  "hero-search-date mt-0.5 w-full min-w-0 rounded-md border border-white/25 bg-white px-2.5 py-2 pr-7 text-[14px] font-semibold leading-none text-[#0b2f57] outline-none disabled:opacity-45 sm:mt-1";
const heroSearchBarClassOneWay =
  "hero-search-bar grid w-full min-w-0 flex-1 grid-cols-1 overflow-x-hidden rounded-xl border border-white/20 bg-white/10 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1.95fr)_minmax(118px,1.05fr)_minmax(0,1fr)_auto]";
const heroSearchBarClassReturn =
  "hero-search-bar grid w-full min-w-0 flex-1 grid-cols-1 overflow-x-hidden rounded-xl border border-white/20 bg-white/10 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1.95fr)_minmax(110px,0.95fr)_minmax(110px,0.95fr)_minmax(0,1fr)_auto]";
const heroSearchSubmitCellClass =
  "flex min-h-[56px] items-center justify-center border-b border-white/15 bg-white/10 px-3 py-3 sm:col-span-2 sm:border-b-0 lg:col-span-1 lg:min-h-[82px] lg:border-l lg:border-white/15 lg:px-4";

const BANNER_VISIBLE_MS = 3000;
const BANNER_TRANSITION_S = 1.25;

const imageBadgeClass =
  "absolute left-3 top-3 rounded-md bg-[#e30613] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm";

const catalogImageClass =
  "h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]";

const tourPackageImageClass =
  "h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]";

const catalogLinkClass =
  "mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#e30613] transition hover:gap-2";

const services = [
  {
    title: "Flights",
    desc: "We deal with international Flights worldwide",
    href: "/flights",
    image: "/aboutus.jpeg",
  },
  {
    title: "Hotels",
    desc: "Curated stays from budget hotels to luxury resorts worldwide.",
    href: "/hotels",
    badge: "Verified Stays",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Visa",
    desc: "Expert visa guidance with high success rate and fast processing.",
    href: "/visa",
    badge: "Expert Help",
    image: "/visa-flags.png",
    imageWrapperClass: "flex min-h-[220px] items-center justify-center bg-sky-50 p-4 sm:min-h-[240px]",
    imageClass:
      "h-auto max-h-[200px] w-full object-contain object-center transition duration-500 group-hover:scale-[1.01] sm:max-h-[220px]",
  },
];

const destinations = [
  {
    title: "Bali, Indonesia",
    subtitle: "Island of Gods",
    packages: "32 Packages",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Dubai, UAE",
    subtitle: "City of Dreams",
    packages: "28 Packages",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Paris, France",
    subtitle: "City of Love",
    packages: "24 Packages",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Maldives",
    subtitle: "Tropical Paradise",
    packages: "18 Packages",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Singapore",
    subtitle: "City of Possibilities",
    packages: "22 Packages",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
  },
];

const steps = [
  { n: "01", title: "Tell us your plan", text: "Share dates, destination and budget." },
  { n: "02", title: "Get curated options", text: "Flights, hotels, visa and packages matched for you." },
  { n: "03", title: "Book with confidence", text: "Transparent pricing and expert support till travel." },
];

const reviews = [
  {
    name: "Ayesha Khan",
    place: "Dubai Trip",
    text: "Smooth booking and great hotel options. The team handled everything quickly.",
  },
  {
    name: "Rahul Mehta",
    place: "Europe Package",
    text: "Very professional service. Visa guidance and itinerary were both excellent.",
  },
  {
    name: "Sofia Ali",
    place: "Maldives Stay",
    text: "Premium feel from start to end. Transparent pricing and attentive support.",
  },
];

export default function Home() {
  const [travelClass, setTravelClass] = useState("economy");
  const [passengers, setPassengers] = useState("1a");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [tripType, setTripType] = useState<"one-way" | "return">("one-way");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [swapRotation, setSwapRotation] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerTransitionEnabled, setBannerTransitionEnabled] = useState(true);
  const [heroBanners, setHeroBanners] = useState<BannerSlide[]>([]);
  const [homePackages, setHomePackages] = useState<DisplayPackage[]>([]);

  const loopBanners = useMemo(
    () => (heroBanners.length > 1 ? [...heroBanners, ...heroBanners] : heroBanners),
    [heroBanners],
  );

  const locationOptions = useMemo(
    () => buildFlightSearchLocations(routes, airports),
    [routes, airports],
  );

  const loadFlightLocations = useCallback(async () => {
    try {
      const [routesResponse, airportsResponse] = await Promise.all([
        fetch("/api/routes", { cache: "no-store" }),
        fetch("/api/airports", { cache: "no-store" }),
      ]);
      const routesResult = (await routesResponse.json()) as { routes?: Route[] };
      const airportsResult = (await airportsResponse.json()) as { airports?: Airport[] };

      if (routesResponse.ok) setRoutes(routesResult.routes || []);
      if (airportsResponse.ok) setAirports(airportsResult.airports || []);
    } catch {
      // Keep search usable with manual input when data is unavailable.
    }
  }, []);

  useEffect(() => {
    loadFlightLocations();
  }, [loadFlightLocations]);

  useEffect(() => {
    async function loadBanners() {
      try {
        const response = await fetch("/api/banners");
        const result = (await response.json()) as { banners?: Banner[] };
        const activeBanners = result.banners || [];

        if (activeBanners.length > 0) {
          setHeroBanners(bannersToSlides(activeBanners));
          setBannerIndex(0);
        } else {
          setHeroBanners([]);
          setBannerIndex(0);
        }
      } catch {
        setHeroBanners([]);
      }
    }

    loadBanners();
  }, []);

  useEffect(() => {
    async function loadPackages() {
      try {
        const items = await fetchPackagesFromApi(true);
        setHomePackages(items.map(toDisplayPackage).slice(0, 3));
      } catch {
        setHomePackages([]);
      }
    }

    loadPackages();
  }, []);

  useEffect(() => {
    heroBanners.forEach((banner) => {
      const img = new window.Image();
      img.src = banner.src;
    });
  }, [heroBanners]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;

    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev >= heroBanners.length ? prev : prev + 1));
    }, BANNER_VISIBLE_MS + BANNER_TRANSITION_S * 1000);

    return () => clearInterval(timer);
  }, [heroBanners.length]);

  return (
    <SiteShell active="Home">
      <section className="relative z-0 w-full overflow-hidden pb-24 pt-20 sm:pb-28 sm:pt-8 md:pb-32">
        <video
          className="footer-video-animate absolute inset-0 z-0 h-full w-full object-cover object-[center_30%] brightness-[1.24] saturate-[1.15] contrast-[1.08]"
          src={SITE_BACKGROUND_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster="/background.png"
        />
        <div className="hero-overlay-premium pointer-events-none absolute inset-0 z-[1]" />

        <div className="relative z-[2] mx-auto flex w-full min-w-0 max-w-[1420px] flex-col gap-6 px-4 sm:gap-5 sm:px-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="flex w-full min-w-0 flex-1 flex-col max-sm:mt-4 max-sm:px-1 sm:mt-0 sm:px-0 lg:max-w-none">
            <form
              className="relative z-20 w-full min-w-0 space-y-3 overflow-x-hidden rounded-2xl bg-gradient-to-br from-[#a8000d] via-[#e30613] to-[#c40010] p-4 shadow-[0_20px_48px_rgba(179,0,15,0.35)] ring-1 ring-white/20 max-sm:mx-auto max-sm:max-w-full sm:space-y-0 sm:p-4"
              onSubmit={(e) => {
                e.preventDefault();
                const airline = findMatchingRouteAirline(routes, fromQuery, toQuery);
                openFlightSearchEnquiry({
                  from: fromQuery,
                  to: toQuery,
                  tripType,
                  departDate,
                  returnDate: tripType === "return" ? returnDate : undefined,
                  travelClass,
                  passengers,
                  airline,
                });
              }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 px-0.5 sm:mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
                  Trip
                </span>
                <div className="inline-flex gap-1 rounded-full border border-white/20 bg-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTripType("one-way");
                      setReturnDate("");
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                      tripType === "one-way"
                        ? "bg-white text-[#e30613] shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("return")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                      tripType === "return"
                        ? "bg-white text-[#e30613] shadow-sm"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    Return
                  </button>
                </div>
              </div>
              <div className="w-full">
                <div
                  className={`${
                    tripType === "return" ? heroSearchBarClassReturn : heroSearchBarClassOneWay
                  } max-sm:mx-0 sm:mx-0`}
                >
                  <div className="flex min-h-[56px] min-w-0 flex-row items-stretch gap-1 overflow-x-hidden border-b border-white/15 bg-white/10 sm:min-h-[82px] sm:col-span-2 sm:gap-0 sm:border-r sm:border-b-0 lg:col-span-1">
                    <div className="flex min-w-0 flex-1 flex-col justify-center overflow-x-hidden px-2.5 py-2.5 sm:px-4 sm:py-4">
                      <FlightLocationAutocomplete
                        label="From"
                        value={fromQuery}
                        onChange={setFromQuery}
                        options={locationOptions}
                        placeholder="City"
                        labelClassName={heroSearchLabelClass}
                        inputClassName={heroLocationInputClass}
                      />
                    </div>

                    <div className="flex w-10 shrink-0 items-center justify-center sm:w-16">
                      <button
                        type="button"
                        aria-label="Swap departure and destination"
                        title="Swap From and To"
                        className="hero-route-swap flex h-9 w-9 min-h-[36px] min-w-[36px] cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white text-[#e30613] shadow-sm hover:bg-white/90 sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px]"
                        style={{ transform: `rotate(${swapRotation}deg)` }}
                        onClick={() => {
                          setFromQuery(toQuery);
                          setToQuery(fromQuery);
                          setSwapRotation((prev) => prev + 180);
                        }}
                      >
                        <SwapRoutesIcon className="pointer-events-none h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center overflow-x-hidden border-l border-white/15 px-2.5 py-2.5 sm:border-l-0 sm:px-4 sm:py-4">
                      <FlightLocationAutocomplete
                        label="To"
                        value={toQuery}
                        onChange={setToQuery}
                        options={locationOptions}
                        placeholder="City"
                        labelClassName={heroSearchLabelClass}
                        inputClassName={heroLocationInputClass}
                      />
                    </div>
                  </div>
                  <label className={heroSearchDateCellClass}>
                    <span className={heroSearchLabelClass}>Depart</span>
                    <div className="hero-search-date-wrap">
                      <input
                        type="date"
                        value={departDate}
                        onChange={(e) => {
                          const nextDepartDate = e.target.value;
                          setDepartDate(nextDepartDate);
                          if (returnDate && nextDepartDate && returnDate < nextDepartDate) {
                            setReturnDate("");
                          }
                        }}
                        className={heroSearchDateInputClass}
                      />
                    </div>
                  </label>
                  {tripType === "return" ? (
                    <label className={heroSearchDateCellClass}>
                      <span className={heroSearchLabelClass}>Return</span>
                      <div className="hero-search-date-wrap">
                        <input
                          type="date"
                          value={returnDate}
                          min={departDate || undefined}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className={heroSearchDateInputClass}
                        />
                      </div>
                    </label>
                  ) : null}
                  <div className={heroSearchTravellerCellClass}>
                    <span className={heroSearchLabelClass}>Travellers &amp; class</span>
                    <div className="mt-1 grid min-w-0 grid-cols-2 gap-2 sm:mt-1.5 sm:grid-cols-1 sm:gap-1.5">
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className={heroSearchSelectClass}
                      >
                        {passengerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={travelClass}
                        onChange={(e) => setTravelClass(e.target.value)}
                        className={heroSearchSelectClass}
                      >
                        {travelClassOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={heroSearchSubmitCellClass}>
                    <button
                      type="submit"
                      className="btn-premium inline-flex h-11 min-h-[44px] w-full max-w-[220px] items-center justify-center gap-2 rounded-lg bg-[#0b2f57] px-6 text-sm font-bold tracking-wide text-white shadow-[0_8px_20px_rgba(11,47,87,0.35)] transition hover:bg-[#092847] active:scale-[0.98] sm:max-w-none lg:min-w-[132px]"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Enquiry Now
                    </button>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {heroBanners.length > 0 ? (
          <div className="hero-card-premium mx-auto flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl leading-none sm:mx-0 sm:w-[240px] sm:max-w-[240px] md:w-[270px] md:max-w-[270px] lg:shrink-0">
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <motion.div
                className="flex h-full will-change-transform"
                style={{ width: `${loopBanners.length * 100}%` }}
                animate={{
                  x: loopBanners.length
                    ? `-${bannerIndex * (100 / loopBanners.length)}%`
                    : "0%",
                }}
                transition={
                  bannerTransitionEnabled
                    ? {
                        duration: BANNER_TRANSITION_S,
                        ease: [0.45, 0, 0.25, 1],
                      }
                    : { duration: 0 }
                }
                onAnimationComplete={() => {
                  if (heroBanners.length <= 1 || bannerIndex < heroBanners.length) return;

                  setBannerTransitionEnabled(false);
                  setBannerIndex(0);
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => setBannerTransitionEnabled(true));
                  });
                }}
              >
                {loopBanners.map((banner, index) => (
                  <div
                    key={`${banner.src}-${index}`}
                    className="h-full shrink-0 overflow-hidden"
                    style={{ width: `${100 / loopBanners.length}%` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="block h-full w-full object-cover object-[center_68%]"
                      draggable={false}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="flex w-full items-center justify-center border-t border-slate-200 bg-white px-2 py-1.5">
              <BrandLogo variant="banner" />
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-1.5 bg-[#e30613] px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#c40010] sm:text-xs"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
              Enquire Now
            </a>
          </div>
          ) : null}
        </div>
      </section>

      <section className="relative z-10 w-full bg-[var(--surface-muted)]">
        <div className="mx-auto max-w-[1260px] px-4 pb-14 pt-10 sm:pt-14 md:pt-16">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center justify-center bg-[#e30613] px-8 py-3 shadow-sm">
            <p className="whitespace-nowrap text-sm font-bold uppercase tracking-wide text-white antialiased">
              Our Services
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
          {services.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="group"
            >
              <div
                className={`relative overflow-hidden rounded-xl ${item.imageWrapperClass ?? ""}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={640}
                  height={360}
                  className={item.imageClass ?? catalogImageClass}
                />
                {item.badge ? <span className={imageBadgeClass}>{item.badge}</span> : null}
              </div>
              <div className="pt-3">
                <h3 className="text-lg font-bold text-[#0b2f57]">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                <Link href={item.href} className={catalogLinkClass}>
                  Explore {item.title}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="soft-section premium-shadow mt-10 grid grid-cols-1 gap-4 rounded-xl p-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Best Price Guarantee", sub: "We ensure the best prices" },
            { title: "Expert Travel Support", sub: "24/7 assistance" },
            { title: "Handpicked Experiences", sub: "Curated just for you" },
            { title: "Secure & Safe", sub: "Your safety is our priority" },
          ].map((item) => (
            <div
              key={item.title}
              className="home-feature border-l-2 border-[#e30613]/25 pl-4 transition hover:border-[#e30613]"
            >
              <p className="font-semibold text-[#e30613]">{item.title}</p>
              <p className="text-sm text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Tour Packages */}
        <div className="mb-6 mt-14 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Tour Packages
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-[#e30613] md:text-4xl">
              Handpicked holiday packages
            </h2>
          </div>
          <Link href="/packages" className="mt-2 inline-block text-sm font-semibold text-[#e30613]">
            View All Packages →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-5">
          {homePackages.map((pkg, index) => (
            <motion.article
              key={pkg.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[5/3] overflow-hidden bg-slate-100">
                <Image
                  src={pkg.image}
                  alt={pkg.title}
                  width={700}
                  height={420}
                  className={tourPackageImageClass}
                />
                <span className={imageBadgeClass}>{pkg.tag}</span>
              </div>
              <div className="p-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {pkg.duration}
                </p>
                <h3 className="mt-1 text-lg font-bold leading-snug text-[#0b2f57]">{pkg.title}</h3>
                <a
                  href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                    `Hello REDE I FLIGHTS, I would like to enquire about the ${pkg.title} tour package (${pkg.duration}).`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-premium mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#e30613] px-4 text-sm font-semibold text-white hover:bg-[#c40010]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Enquire Now
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-14 px-2 py-4">
          <h3 className="text-center text-2xl font-extrabold text-[#e30613] sm:text-3xl">How It Works</h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            Simple 3-step booking process with expert support.
          </p>
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="px-2 py-4 text-center sm:px-5"
              >
                <p className="text-sm font-bold text-[#e30613]">{step.n}</p>
                <h4 className="mt-2 text-lg font-bold text-[#0b2f57]">{step.title}</h4>
                <p className="mt-2 text-sm text-gray-500">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-4 mt-14 text-center">
          <div>
            <h2 className="text-3xl font-extrabold text-[#e30613] md:text-4xl">
              Popular Destinations
            </h2>
            <p className="mt-1 text-sm text-gray-500">Handpicked places travelers love most.</p>
          </div>
          <Link href="/destinations" className="mt-2 inline-block text-sm font-semibold text-[#e30613]">
            View All Destinations →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {destinations.map((place, index) => (
            <motion.article
              key={place.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              whileHover={{ y: -6 }}
              className="tilt-shell premium-shadow hover-lift-soft group relative overflow-hidden rounded-2xl"
            >
              <Image
                className="tilt-card h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                src={place.image}
                alt={place.title}
                width={420}
                height={320}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-4 text-white">
                <h3 className="text-lg font-bold">{place.title}</h3>
                <p className="text-sm text-gray-200">{place.subtitle}</p>
                <p className="mt-1 text-xs text-[#ffb3bc]">{place.packages}</p>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Reviews */}
        <div className="mt-14">
          <h3 className="text-center text-3xl font-extrabold text-[#e30613]">What Travelers Say</h3>
          <p className="mt-2 text-center text-sm text-gray-500">
            Real feedback from happy travelers who booked with us.
          </p>
          <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-5">
            {reviews.map((review, index) => (
              <motion.article
                key={review.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="premium-shadow hover-lift-soft rounded-2xl border border-[#edf1f8] bg-white p-5"
              >
                <p className="text-amber-500">★★★★★</p>
                <p className="mt-3 text-sm leading-6 text-gray-600">&ldquo;{review.text}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="font-semibold text-[#0b2f57]">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.place}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <section className="mt-12 border-t border-slate-200 pt-10">
          <h3 className="text-center text-3xl font-extrabold text-[#e30613]">Why Travel With Us?</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
            Trusted travel support with transparent service at every step.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {[
              { title: "Customized Trips", sub: "Tailored to your needs" },
              { title: "Wide Destinations", sub: "Across the globe" },
              { title: "No Hidden Charges", sub: "Transparent pricing" },
              { title: "Trusted by Clients", sub: "100% satisfaction" },
              { title: "Easy Inquiry", sub: "Quick & simple process" },
            ].map((item) => (
              <div
                key={item.title}
                className="home-feature border-l-2 border-[#e30613]/25 pl-4 transition hover:border-[#e30613]"
              >
                <p className="font-semibold text-[#0b2f57]">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </section>
    </SiteShell>
  );
}
