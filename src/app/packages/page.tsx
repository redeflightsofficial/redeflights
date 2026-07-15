"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ContactSelect } from "@/components/ContactSelect";
import { ContentPageHero } from "@/components/ContentPageHero";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { fetchDestinationOptionsFromApi, DESTINATION_MONTHS } from "@/lib/destinations";
import { fetchPackagesFromApi, toDisplayPackage, type DisplayPackage } from "@/lib/packages";
import { WHATSAPP_URL } from "@/lib/contact";

const fieldLabelClass = "text-xs font-bold uppercase tracking-wide text-slate-600";

const packageTravelerOptions = [
  { value: "1", label: "1 Traveler" },
  { value: "2", label: "2 Travelers" },
  { value: "3", label: "3 Travelers" },
  { value: "4", label: "4 Travelers" },
  { value: "family", label: "Family Group" },
];

const monthOptions = DESTINATION_MONTHS.map((month) => ({
  value: month.value,
  label: month.value ? month.label : "Any Month",
}));

const trustItems = [
  { title: "Curated Packages", sub: "Handpicked holidays worldwide" },
  { title: "Expert Planning", sub: "Flights, hotels and sightseeing included" },
  { title: "Direct Enquiry", sub: "Get quotes instantly on WhatsApp" },
];

const regionOptions = ["Europe", "Asia", "Middle East", "Africa", "Americas"];
const themeOptions = ["Family", "Honeymoon", "Adventure", "Beach", "Luxury"];

type FilterChipProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

function FilterChip({ active, children, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] w-full rounded-lg px-3 text-left text-sm font-medium transition ${
        active
          ? "border border-[#e30613]/30 bg-[#fff5f6] text-[#0b2f57] shadow-[inset_3px_0_0_#e30613]"
          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-[#f8fafc]"
      }`}
    >
      {children}
    </button>
  );
}

type FilterPanelProps = {
  selectedRegions: string[];
  selectedThemes: string[];
  onRegionChange: (region: string) => void;
  onThemeChange: (theme: string) => void;
  onClear: () => void;
  showHeader?: boolean;
};

function FilterPanel({
  selectedRegions,
  selectedThemes,
  onRegionChange,
  onThemeChange,
  onClear,
  showHeader = true,
}: FilterPanelProps) {
  const activeCount = selectedRegions.length + selectedThemes.length;
  const hasFilters = activeCount > 0;

  return (
    <div className="space-y-5">
      {showHeader ? (
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">
                Filters
              </p>
              <h3 className="mt-1 text-base font-bold text-[#0b2f57]">Refine Packages</h3>
            </div>
            {hasFilters ? (
              <span className="rounded-full bg-[#fff5f6] px-2.5 py-1 text-xs font-bold text-[#e30613]">
                {activeCount}
              </span>
            ) : null}
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-3 text-sm font-semibold text-[#e30613] transition hover:text-[#c40010]"
            >
              Clear all filters
            </button>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Select destination or theme to find the right package.
            </p>
          )}
        </div>
      ) : null}

      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Destination
        </p>
        <div className="space-y-2">
          {regionOptions.map((region) => (
            <FilterChip
              key={region}
              active={selectedRegions.includes(region)}
              onClick={() => onRegionChange(region)}
            >
              {region}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Theme
        </p>
        <div className="space-y-2">
          {themeOptions.map((theme) => (
            <FilterChip
              key={theme}
              active={selectedThemes.includes(theme)}
              onClick={() => onThemeChange(theme)}
            >
              {theme}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const [packageItems, setPackageItems] = useState<DisplayPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [destination, setDestination] = useState("");
  const [travelMonth, setTravelMonth] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [destinationOptions, setDestinationOptions] = useState([
    { label: "All Destinations", value: "" },
  ]);

  useEffect(() => {
    async function loadDestinationOptions() {
      const options = await fetchDestinationOptionsFromApi();
      setDestinationOptions(options);
    }

    async function loadPackages() {
      setLoadingPackages(true);
      const items = await fetchPackagesFromApi(true);
      setPackageItems(items.map(toDisplayPackage));
      setLoadingPackages(false);
    }

    loadDestinationOptions();
    loadPackages();
  }, []);

  const selectedTravelMonth =
    monthOptions.find((option) => option.value === travelMonth)?.label || "Any Month";
  const selectedTravelers =
    packageTravelerOptions.find((option) => option.value === travelers)?.label || "2 Travelers";

  const visiblePackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return packageItems.filter((pkg) => {
      const matchesQuery =
        !query ||
        pkg.title.toLowerCase().includes(query) ||
        pkg.route.toLowerCase().includes(query) ||
        pkg.region.toLowerCase().includes(query);
      const matchesRegion =
        selectedRegions.length === 0 || selectedRegions.includes(pkg.region);
      const matchesTheme =
        selectedThemes.length === 0 || selectedThemes.includes(pkg.theme);

      return matchesQuery && matchesRegion && matchesTheme;
    });
  }, [packageItems, searchQuery, selectedRegions, selectedThemes]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter((item) => item !== theme)
        : [...current, theme],
    );
  };

  const clearFilters = () => {
    setSelectedRegions([]);
    setSelectedThemes([]);
  };

  return (
    <SiteShell active="Tour Packages">
      <ContentPageHero
        image="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85"
        imagePosition="center 45%"
        eyebrow="Curated Holidays"
        title="Tour Packages"
        description="Handpicked holiday packages with flights, hotels and sightseeing. Search your trip and enquire directly with our travel experts."
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
              Plan Your Holiday
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-[#0b2f57] sm:text-3xl">
              Search Tour Packages
            </h1>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(destination);
            }}
            className="relative z-20 mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_40px_rgba(11,47,87,0.1)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_auto]">
              <div className="flex min-h-[76px] flex-col justify-center border-b border-slate-200 px-3.5 py-3 transition-colors hover:bg-slate-50/60 sm:border-r lg:border-b-0 lg:px-4">
                <span className={fieldLabelClass}>Destination</span>
                <ContactSelect
                  value={destination}
                  onChange={(value) => {
                    setDestination(value);
                    setSearchQuery(value);
                  }}
                  options={destinationOptions}
                  ariaLabel="Select package destination"
                  selectedLabel={
                    destination
                      ? destinationOptions.find((option) => option.value === destination)?.label
                      : "All Destinations"
                  }
                  className="mt-0.5"
                  listClassName="z-50 max-h-72"
                />
              </div>

              <div className="flex min-h-[76px] flex-col justify-center border-b border-slate-200 px-3.5 py-3 transition-colors hover:bg-slate-50/60 sm:border-b-0 sm:border-r lg:px-4">
                <span className={fieldLabelClass}>Travel Month</span>
                <ContactSelect
                  value={travelMonth}
                  onChange={setTravelMonth}
                  options={monthOptions}
                  ariaLabel="Select travel month"
                  selectedLabel={selectedTravelMonth}
                  className="mt-0.5"
                  listClassName="z-50 max-h-72"
                />
              </div>

              <div className="flex min-h-[76px] flex-col justify-center border-b border-slate-200 px-3.5 py-3 transition-colors hover:bg-slate-50/60 sm:border-b-0 sm:border-r lg:px-4">
                <span className={fieldLabelClass}>Travelers</span>
                <ContactSelect
                  value={travelers}
                  onChange={setTravelers}
                  options={packageTravelerOptions}
                  ariaLabel="Select number of travelers"
                  selectedLabel={selectedTravelers}
                  className="mt-0.5"
                  listClassName="z-50"
                />
              </div>

              <div className="flex items-stretch p-3 sm:col-span-2 lg:col-span-1 lg:p-3.5">
                <button
                  type="submit"
                  className="btn-premium flex min-h-[52px] w-full items-center justify-center bg-[#e30613] px-6 text-sm font-semibold text-white transition hover:bg-[#c40010] lg:min-w-[168px]"
                >
                  Search Packages
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-8 md:py-12">
        <details className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-[#f8fafc] shadow-sm lg:hidden">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between bg-white px-4 py-3 font-bold text-[#0b2f57] [&::-webkit-details-marker]:hidden">
            <span className="text-base">Refine Packages</span>
            <span className="text-sm font-semibold text-[#e30613]" aria-hidden>
              Show
            </span>
          </summary>
          <div className="border-t border-slate-200 bg-white p-4">
            <FilterPanel
              selectedRegions={selectedRegions}
              selectedThemes={selectedThemes}
              onRegionChange={toggleRegion}
              onThemeChange={toggleTheme}
              onClear={clearFilters}
            />
          </div>
        </details>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full shrink-0 lg:block lg:w-[248px]">
            <div className="sticky top-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(11,47,87,0.06)]">
              <div className="border-b border-slate-100 bg-[#f8fafc] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e30613]">
                      Filters
                    </p>
                    <h3 className="mt-1 text-base font-bold text-[#0b2f57]">Refine Packages</h3>
                  </div>
                  {selectedRegions.length + selectedThemes.length > 0 ? (
                    <span className="rounded-full bg-[#fff5f6] px-2.5 py-1 text-xs font-bold text-[#e30613]">
                      {selectedRegions.length + selectedThemes.length}
                    </span>
                  ) : null}
                </div>
                {selectedRegions.length + selectedThemes.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-sm font-semibold text-[#e30613] transition hover:text-[#c40010]"
                  >
                    Clear all filters
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Narrow your search by destination or theme.
                  </p>
                )}
              </div>

              <div className="px-4 py-4">
                <FilterPanel
                  selectedRegions={selectedRegions}
                  selectedThemes={selectedThemes}
                  onRegionChange={toggleRegion}
                  onThemeChange={toggleTheme}
                  onClear={clearFilters}
                  showHeader={false}
                />
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
                  Search Results
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#0b2f57] sm:text-3xl">
                  Top Tour Packages
                </h2>
              </div>
              <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                <span className="text-[#e30613]">{visiblePackages.length}</span> packages found
              </p>
            </div>

            {loadingPackages ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-6 py-14 text-center text-sm text-slate-500">
                Loading tour packages...
              </div>
            ) : visiblePackages.length > 0 ? (
              <div className="space-y-4">
                {visiblePackages.map((pkg, index) => {
                  const message = [
                    `Hello REDE I FLIGHTS, I would like to enquire about the ${pkg.title} tour package.`,
                    `Route: ${pkg.route}.`,
                    `Duration: ${pkg.duration}.`,
                    travelMonth ? `Travel month: ${selectedTravelMonth}.` : "",
                    `Travelers: ${selectedTravelers}.`,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const enquiryUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

                  return (
                    <motion.article
                      key={pkg.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-[#e30613]/25 hover:shadow-[0_10px_28px_rgba(11,47,87,0.08)]"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full shrink-0 overflow-hidden bg-slate-100 sm:w-52 sm:min-h-[180px] md:w-56">
                          <div className="relative aspect-[5/3] w-full sm:absolute sm:inset-0 sm:aspect-auto sm:h-full">
                            <Image
                              src={pkg.image}
                              alt={pkg.title}
                              fill
                              sizes="(max-width: 640px) 100vw, 224px"
                              className="object-cover transition duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                          <span className="absolute left-3 top-3 rounded-md bg-[#e30613] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            {pkg.tag}
                          </span>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#e30613]">
                              {pkg.region} · {pkg.theme}
                            </p>
                            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-[#0b2f57] md:text-xl">
                              {pkg.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">{pkg.route}</p>
                            <p className="mt-2 text-sm font-semibold text-[#0b2f57]">
                              {pkg.duration}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {pkg.includes.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="shrink-0 md:w-[210px]">
                            <a
                              href={enquiryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-premium inline-flex min-h-[46px] w-full items-center justify-center gap-2 bg-[#e30613] px-4 text-sm font-semibold text-white hover:bg-[#c40010]"
                            >
                              <WhatsAppIcon className="h-5 w-5" />
                              Enquire Now
                            </a>
                            <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
                              Get package details on WhatsApp
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-6 py-14 text-center">
                <h3 className="text-lg font-bold text-[#0b2f57]">No matching packages found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Try another destination or clear the filters. Our experts can also create a custom
                  package for you.
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
      </section>
    </SiteShell>
  );
}
