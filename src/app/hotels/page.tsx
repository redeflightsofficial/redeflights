"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ContactSelect } from "@/components/ContactSelect";
import { ContentPageHero } from "@/components/ContentPageHero";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { WHATSAPP_URL } from "@/lib/contact";
import type { Hotel } from "@/types/hotel";

const HOTELS_HERO_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=85";

const fallbackHotels = [
  {
    name: "Grand Hyatt Bali",
    location: "Bali, Indonesia",
    stars: 5,
    rating: "4.8",
    reviews: "2.1k reviews",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Breakfast", "Spa"],
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&h=420&q=85",
  },
  {
    name: "Conrad Maldives",
    location: "Maldives",
    stars: 5,
    rating: "4.9",
    reviews: "1.8k reviews",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Breakfast", "Airport Transfer"],
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=700&h=420&q=85",
  },
  {
    name: "Marina Bay Sands",
    location: "Singapore",
    stars: 5,
    rating: "4.7",
    reviews: "4.2k reviews",
    amenities: ["Free Wi-Fi", "Swimming Pool", "City View", "Spa"],
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=700&h=420&q=85",
  },
  {
    name: "The Ritz London",
    location: "London, United Kingdom",
    stars: 5,
    rating: "4.8",
    reviews: "3.4k reviews",
    amenities: ["Free Wi-Fi", "Breakfast", "Restaurant", "Airport Transfer"],
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=700&h=420&q=85",
  },
  {
    name: "Paris Marriott Opera",
    location: "Paris, France",
    stars: 4,
    rating: "4.6",
    reviews: "1.6k reviews",
    amenities: ["Free Wi-Fi", "Breakfast", "City View", "Restaurant"],
    image:
      "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=700&h=420&q=85",
  },
  {
    name: "Park Hotel Tokyo",
    location: "Tokyo, Japan",
    stars: 4,
    rating: "4.7",
    reviews: "2.7k reviews",
    amenities: ["Free Wi-Fi", "Breakfast", "City View", "Airport Transfer"],
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&h=420&q=85",
  },
];

const FALLBACK_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&h=420&q=85";

const trustItems = [
  { title: "Verified Stays", sub: "Trusted hotel partners worldwide" },
  { title: "Expert Support", sub: "Personal assistance for every booking" },
  { title: "Direct Enquiry", sub: "Connect instantly on WhatsApp" },
];

const starOptions = [5, 4];
const amenityOptions = ["Free Wi-Fi", "Swimming Pool", "Breakfast", "Airport Transfer", "Spa"];

const guestOptions = [
  { label: "1 Guest", value: "1 Guest" },
  { label: "2 Guests", value: "2 Guests" },
  { label: "3 Guests", value: "3 Guests" },
  { label: "4 Guests", value: "4 Guests" },
  { label: "Family", value: "Family" },
];

const searchFieldClass = "border-b border-slate-100 px-5 py-4 sm:px-5";

function StarIcons({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
        <span key={index} className="text-[11px] leading-none">
          ★
        </span>
      ))}
    </span>
  );
}

type FilterPanelProps = {
  selectedStars: number[];
  selectedAmenities: string[];
  onStarChange: (star: number) => void;
  onAmenityChange: (amenity: string) => void;
  onClear: () => void;
  compact?: boolean;
};

function StarRatingFilter({
  selectedStars,
  onStarChange,
}: {
  selectedStars: number[];
  onStarChange: (star: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {starOptions.map((star) => {
        const active = selectedStars.includes(star);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onStarChange(star)}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition ${
              active
                ? "border-[#e30613] bg-[#e30613] text-white shadow-sm"
                : "border-slate-200 bg-white text-[#0b2f57] hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span className={active ? "text-white" : "text-amber-500"}>★</span>
            {star} Star
          </button>
        );
      })}
    </div>
  );
}

function AmenityCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#e30613] focus:ring-[#e30613]/30"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function FilterPanel({
  selectedStars,
  selectedAmenities,
  onStarChange,
  onAmenityChange,
  onClear,
  compact = false,
}: FilterPanelProps) {
  const activeCount = selectedStars.length + selectedAmenities.length;
  const hasFilters = activeCount > 0;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0b2f57]">Filters</h3>
          {!compact ? (
            <p className="mt-0.5 text-xs text-slate-500">Rating and amenities</p>
          ) : null}
        </div>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#e30613] transition hover:text-[#c40010]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Star Rating
        </p>
        <StarRatingFilter selectedStars={selectedStars} onStarChange={onStarChange} />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Amenities
        </p>
        <div className="divide-y divide-slate-100">
          {amenityOptions.map((amenity) => (
            <AmenityCheckbox
              key={amenity}
              label={amenity}
              checked={selectedAmenities.includes(amenity)}
              onChange={() => onAmenityChange(amenity)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HotelsPage() {
  const [adminHotels, setAdminHotels] = useState<Hotel[]>([]);
  const [destination, setDestination] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [destinationOptions, setDestinationOptions] = useState([
    { label: "All Destinations", value: "" },
  ]);

  useEffect(() => {
    async function loadHotels() {
      try {
        const response = await fetch("/api/hotels", { cache: "no-store" });
        const result = (await response.json()) as { hotels?: Hotel[] };
        if (response.ok) setAdminHotels(result.hotels || []);
      } catch {
        setAdminHotels([]);
      }
    }

    loadHotels();
  }, []);

  useEffect(() => {
    async function loadDestinationOptions() {
      try {
        const response = await fetch("/api/destinations?dropdown=1", { cache: "no-store" });
        const result = (await response.json()) as {
          options?: { label: string; value: string }[];
        };
        if (response.ok && result.options) {
          setDestinationOptions([
            { label: "All Destinations", value: "" },
            ...result.options.map((option) => ({
              label: option.label,
              value: option.value,
            })),
          ]);
        }
      } catch {
        setDestinationOptions([{ label: "All Destinations", value: "" }]);
      }
    }

    loadDestinationOptions();
  }, []);

  const hotelCards = useMemo(
    () =>
      adminHotels.length > 0
        ? adminHotels.map((hotel) => ({
            id: hotel.id,
            name: hotel.name,
            location: hotel.location,
            stars: hotel.stars,
            rating: hotel.rating || "4.8",
            reviews: hotel.reviews || "Verified stay",
            amenities: hotel.amenities || [],
            image: hotel.image_url || FALLBACK_HOTEL_IMAGE,
          }))
        : fallbackHotels.map((hotel) => ({
            ...hotel,
            id: hotel.name,
          })),
    [adminHotels],
  );

  const visibleHotels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return hotelCards.filter((hotel) => {
      const matchesQuery =
        !query ||
        hotel.location.toLowerCase() === query.toLowerCase() ||
        hotel.location.toLowerCase().includes(query) ||
        hotel.name.toLowerCase().includes(query);
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((amenity) => hotel.amenities.includes(amenity));

      return matchesQuery && matchesStars && matchesAmenities;
    });
  }, [hotelCards, searchQuery, selectedStars, selectedAmenities]);

  const toggleStar = (star: number) => {
    setSelectedStars((current) =>
      current.includes(star) ? current.filter((item) => item !== star) : [...current, star],
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    );
  };

  const clearFilters = () => {
    setSelectedStars([]);
    setSelectedAmenities([]);
  };

  return (
    <SiteShell active="Hotels">
      <ContentPageHero
        image={HOTELS_HERO_IMAGE}
        imagePosition="center 55%"
        title="Hotels"
        description="Discover trusted hotels and resorts worldwide. Search your stay and enquire directly with our travel experts."
        centered
        showBreadcrumb={false}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {trustItems.map((item) => (
            <div key={item.title} className="px-4 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-base font-bold text-[#e30613] sm:text-lg">{item.title}</p>
              <p className="mt-1 text-sm text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-6 md:py-8">
          <div className="mb-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
              Find Your Stay
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#0b2f57] sm:text-3xl">
              Search Hotels Worldwide
            </h1>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(destination);
            }}
            className="relative z-20 mx-auto max-w-6xl overflow-x-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(11,47,87,0.1)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr_auto]">
              <div className={`${searchFieldClass} sm:border-r lg:border-b-0`}>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Destination
                </span>
                <ContactSelect
                  value={destination}
                  onChange={(value) => {
                    setDestination(value);
                    setSearchQuery(value);
                  }}
                  options={destinationOptions}
                  ariaLabel="Select hotel destination"
                  selectedLabel={
                    destination
                      ? destinationOptions.find((option) => option.value === destination)?.label
                      : "All Destinations"
                  }
                  className="mt-1"
                  listClassName="z-50 max-h-72 min-w-full"
                />
              </div>

              <label className={`${searchFieldClass} sm:border-r lg:border-b-0`}>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Check-in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-semibold text-[#0b2f57] outline-none"
                />
              </label>

              <label className={`${searchFieldClass} sm:border-r lg:border-b-0`}>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Check-out
                </span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm font-semibold text-[#0b2f57] outline-none"
                />
              </label>

              <div className={`${searchFieldClass} sm:border-r lg:border-b-0`}>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Guests
                </span>
                <ContactSelect
                  value={guests}
                  onChange={setGuests}
                  options={guestOptions}
                  ariaLabel="Select number of guests"
                  className="mt-1"
                  listClassName="z-50"
                />
              </div>

              <div className="flex items-stretch p-3 sm:col-span-2 lg:col-span-1 lg:p-4">
                <button
                  type="submit"
                  className="btn-premium min-h-[48px] w-full rounded-xl bg-[#e30613] px-6 text-sm font-semibold text-white hover:bg-[#c40010] lg:min-w-[148px]"
                >
                  Search Hotels
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-8 md:py-12">
        <details className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 py-3.5 font-semibold text-[#0b2f57] [&::-webkit-details-marker]:hidden">
            <span className="text-sm">Filters</span>
            <span className="text-xs font-semibold text-[#e30613]" aria-hidden>
              {selectedStars.length + selectedAmenities.length > 0
                ? `${selectedStars.length + selectedAmenities.length} active`
                : "Show"}
            </span>
          </summary>
          <div className="border-t border-slate-100 px-5 py-4">
            <FilterPanel
              selectedStars={selectedStars}
              selectedAmenities={selectedAmenities}
              onStarChange={toggleStar}
              onAmenityChange={toggleAmenity}
              onClear={clearFilters}
              compact
            />
          </div>
        </details>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full shrink-0 lg:block lg:w-[260px]">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(11,47,87,0.05)]">
              <FilterPanel
                selectedStars={selectedStars}
                selectedAmenities={selectedAmenities}
                onStarChange={toggleStar}
                onAmenityChange={toggleAmenity}
                onClear={clearFilters}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e30613]">
                  Search Results
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0b2f57] sm:text-2xl">
                  Recommended Hotels
                </h2>
              </div>
              <p className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500">
                <span className="text-[#e30613]">{visibleHotels.length}</span> hotels
              </p>
            </div>

            {visibleHotels.length > 0 ? (
              <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
                {visibleHotels.map((hotel, index) => {
                  const message = [
                    `Hello REDE I FLIGHTS, I would like to enquire about ${hotel.name} in ${hotel.location}.`,
                    checkIn ? `Check-in: ${checkIn}.` : "",
                    checkOut ? `Check-out: ${checkOut}.` : "",
                    `Guests: ${guests}.`,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
                  const amenityPreview =
                    hotel.amenities.length > 0
                      ? hotel.amenities.slice(0, 3)
                      : ["Luxury Stay", "Expert Support", "Best Rates"];

                  return (
                    <motion.article
                      key={hotel.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-[1.35rem] shadow-[0_10px_36px_rgba(4,36,72,0.14)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(4,36,72,0.2)]"
                    >
                      <div className="relative aspect-[5/4] overflow-hidden bg-slate-900 sm:aspect-[16/11]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#042448]/95 via-[#042448]/55 to-[#042448]/15" />
                        <div className="absolute inset-0 bg-[#e30613]/0 transition duration-300 group-hover:bg-[#e30613]/10" />

                        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 sm:left-5 sm:right-5 sm:top-5">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                            <StarIcons count={hotel.stars} />
                            {hotel.stars} Star
                          </span>
                          <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
                            Verified Stay
                          </span>
                        </div>

                        <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-6">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                            {hotel.location}
                          </p>
                          <h3 className="mt-1.5 text-2xl font-extrabold leading-tight text-[#e30613] sm:text-[1.7rem]">
                            {hotel.name}
                          </h3>

                          <div className="mt-3 flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                              <StarIcons count={hotel.stars} />
                              {hotel.rating}
                            </span>
                            <span className="text-sm text-white/70">{hotel.reviews}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {amenityPreview.map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-relaxed text-white/65">
                              Get personalised rates and availability from our travel experts.
                            </p>
                            <a
                              href={enquiryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-premium inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#e30613] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(227,6,19,0.35)] transition hover:bg-[#c40010]"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                              Enquire Now
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-6 py-14 text-center">
                <h3 className="text-lg font-bold text-[#0b2f57]">No matching hotels found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Try another destination or clear the filters. You can also ask our experts for a
                  custom hotel recommendation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDestination("");
                    setSearchQuery("");
                    clearFilters();
                  }}
                  className="btn-premium mt-5 min-h-[44px] bg-[#e30613] px-6 text-sm font-semibold text-white"
                >
                  Reset Search
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>
    </SiteShell>
  );
}
