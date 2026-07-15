"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ContactSelect } from "@/components/ContactSelect";
import { VisaImage } from "@/components/VisaImage";
import { WhatsAppIcon } from "@/components/icons";
import {
  DEFAULT_DESTINATION_FILTERS,
  DESTINATION_MONTHS,
  DESTINATION_SORT_OPTIONS,
  DESTINATION_TRAVELERS,
  fetchDestinationOptionsFromApi,
  fetchDestinationsFromApi,
  filterDestinations,
  openDestinationEnquiry,
  searchDestinations,
} from "@/lib/destinations";
import type { Destination, DestinationSearchFilters } from "@/types/destination";

const fieldLabelClass = "text-xs font-bold uppercase tracking-wide text-slate-600";
const selectClass =
  "mt-1.5 w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 pr-6 text-[15px] font-semibold text-[#0b2f57] outline-none";
const resultCardImageClass =
  "h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]";

function hasActiveFilters(filters: DestinationSearchFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.region !== "All Regions" ||
    filters.travelStyle !== "All Styles" ||
    filters.travelMonth !== "" ||
    filters.travelers !== DEFAULT_DESTINATION_FILTERS.travelers ||
    filters.sortBy !== DEFAULT_DESTINATION_FILTERS.sortBy
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e30613]/25 bg-[#fff5f6] px-3 py-1.5 text-xs font-semibold text-[#0b2f57]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="text-[#e30613] transition hover:text-[#c40010] min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
      >
        ×
      </button>
    </span>
  );
}

export function DestinationSearchSection() {
  const [draftFilters, setDraftFilters] = useState<DestinationSearchFilters>(
    DEFAULT_DESTINATION_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<DestinationSearchFilters>(
    DEFAULT_DESTINATION_FILTERS,
  );
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [destinationOptions, setDestinationOptions] = useState([
    { label: "All Destinations", value: "" },
  ]);
  const [results, setResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadDestinations() {
      const [destinations, options] = await Promise.all([
        fetchDestinationsFromApi(),
        fetchDestinationOptionsFromApi(),
      ]);
      setAllDestinations(destinations);
      setDestinationOptions(options);
      setResults(filterDestinations(destinations, DEFAULT_DESTINATION_FILTERS));
    }

    loadDestinations();
  }, []);

  const applyFilters = useCallback(
    (filters: DestinationSearchFilters) => {
      setResults(filterDestinations(allDestinations, filters));
      setAppliedFilters(filters);
    },
    [allDestinations],
  );

  const runSearch = useCallback(async (filters: DestinationSearchFilters) => {
    setIsSearching(true);
    try {
      const data = await searchDestinations(filters);
      setResults(data);
      setAppliedFilters(filters);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (appliedFilters.query.trim()) {
      chips.push({
        key: "query",
        label: `Destination: ${appliedFilters.query}`,
        onRemove: () => {
          const next = { ...appliedFilters, query: "" };
          setDraftFilters(next);
          applyFilters(next);
        },
      });
    }
    if (appliedFilters.region !== "All Regions") {
      chips.push({
        key: "region",
        label: appliedFilters.region,
        onRemove: () => {
          const next: DestinationSearchFilters = { ...appliedFilters, region: "All Regions" };
          setDraftFilters(next);
          applyFilters(next);
        },
      });
    }
    if (appliedFilters.travelStyle !== "All Styles") {
      chips.push({
        key: "style",
        label: appliedFilters.travelStyle,
        onRemove: () => {
          const next: DestinationSearchFilters = { ...appliedFilters, travelStyle: "All Styles" };
          setDraftFilters(next);
          applyFilters(next);
        },
      });
    }
    if (appliedFilters.travelMonth) {
      const monthLabel =
        DESTINATION_MONTHS.find((m) => m.value === appliedFilters.travelMonth)?.label ?? "";
      chips.push({
        key: "month",
        label: monthLabel,
        onRemove: () => {
          const next = { ...appliedFilters, travelMonth: "" };
          setDraftFilters(next);
          applyFilters(next);
        },
      });
    }
    if (appliedFilters.travelers !== DEFAULT_DESTINATION_FILTERS.travelers) {
      const travelerLabel =
        DESTINATION_TRAVELERS.find((t) => t.value === appliedFilters.travelers)?.label ?? "";
      chips.push({
        key: "travelers",
        label: travelerLabel,
        onRemove: () => {
          const next = { ...appliedFilters, travelers: DEFAULT_DESTINATION_FILTERS.travelers };
          setDraftFilters(next);
          applyFilters(next);
        },
      });
    }

    return chips;
  }, [appliedFilters, applyFilters]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const data = await searchDestinations(draftFilters);
      setResults(data);
      setAppliedFilters(draftFilters);

      const selected = data.find((place) => place.title === draftFilters.query.trim());
      if (selected) {
        openDestinationEnquiry(selected, draftFilters);
      } else if (draftFilters.query.trim()) {
        openDestinationEnquiry(
          {
            id: "search",
            title: draftFilters.query.trim(),
            subtitle: `Explore ${draftFilters.query.trim()}`,
            country: "",
            packages: 0,
            region: "Asia",
            travelStyles: [],
            image: "",
            popularScore: 0,
          },
          draftFilters,
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearAll = () => {
    setDraftFilters(DEFAULT_DESTINATION_FILTERS);
    applyFilters(DEFAULT_DESTINATION_FILTERS);
  };

  return (
    <>
      <section className="border-y border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-6 md:py-8">
          <form onSubmit={handleSearch}>
            <div className="relative z-20 mx-auto max-w-5xl overflow-x-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_10px_28px_rgba(11,47,87,0.1)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div className="relative border-b border-slate-200 px-3.5 py-3 sm:border-r sm:border-b-0 lg:px-4">
                  <span className={fieldLabelClass}>Destination</span>
                  <ContactSelect
                    value={draftFilters.query}
                    onChange={(value) => {
                      const next = { ...draftFilters, query: value };
                      setDraftFilters(next);
                      runSearch(next);
                    }}
                    options={destinationOptions}
                    ariaLabel="Select destination"
                    selectedLabel={
                      draftFilters.query
                        ? destinationOptions.find((option) => option.value === draftFilters.query)?.label
                        : "All Destinations"
                    }
                    className="mt-1"
                    listClassName="max-h-72"
                  />
                </div>

                <div className="border-b border-slate-200 px-3.5 py-3 sm:border-r sm:border-b-0 lg:px-4">
                  <label htmlFor="travel-month" className={fieldLabelClass}>
                    Travel Month
                  </label>
                  <select
                    id="travel-month"
                    value={draftFilters.travelMonth}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, travelMonth: e.target.value }))
                    }
                    className={selectClass}
                  >
                    {DESTINATION_MONTHS.map((month) => (
                      <option key={month.value || "any"} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-b border-slate-200 px-3.5 py-3 sm:border-b-0 lg:border-r lg:px-4">
                  <label htmlFor="travelers" className={fieldLabelClass}>
                    Travelers
                  </label>
                  <select
                    id="travelers"
                    value={draftFilters.travelers}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, travelers: e.target.value }))
                    }
                    className={selectClass}
                  >
                    {DESTINATION_TRAVELERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-full flex items-stretch px-3.5 py-3 sm:col-span-2 lg:col-span-1 lg:px-4">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="btn-premium flex w-full min-w-[100px] items-center justify-center gap-2 bg-[#e30613] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c40010] disabled:cursor-wait disabled:opacity-80 lg:w-auto"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {isSearching ? "Searching..." : "Enquiry Now"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-8 md:py-10">
        <div className="mb-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]">
            {isSearching ? "Finding destinations..." : "Search Results"}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#0b2f57]">
            <span className="text-[#e30613]">{results.length}</span> destinations
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#0b2f57]">
              Sort by
              <select
                value={draftFilters.sortBy}
                onChange={(e) => {
                  const sortBy = e.target.value as DestinationSearchFilters["sortBy"];
                  const next = { ...draftFilters, sortBy };
                  setDraftFilters(next);
                  applyFilters(next);
                }}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#0b2f57] outline-none focus:border-[#e30613] min-h-[44px]"
              >
                {DESTINATION_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters(appliedFilters) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="min-h-[44px] px-2 text-sm font-semibold text-[#e30613] transition hover:text-[#c40010]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            {activeFilterChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
            ))}
          </div>
        )}

        {isSearching ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="aspect-[5/3] bg-slate-200" />
                <div className="space-y-2 p-3.5">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fafc] px-6 py-14 text-center">
            <p className="text-lg font-bold text-[#0b2f57]">No destinations found</p>
            <p className="mx-auto mt-2 max-w-md text-base text-gray-500">
              Add destinations from the admin dashboard, or contact us for a custom travel plan.
            </p>
            <button
              type="button"
              onClick={handleClearAll}
                className="btn-premium mt-6 min-h-[44px] w-full bg-[#e30613] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c40010] sm:w-auto"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((place, index) => (
              <motion.article
                key={place.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-[5/3] overflow-hidden bg-slate-100">
                  <VisaImage
                    src={place.image}
                    alt={place.title}
                    width={700}
                    height={420}
                    className={resultCardImageClass}
                  />
                </div>
                <div className="p-3.5">
                  {place.country ? (
                    <p className="text-lg font-bold text-[#e30613]">{place.country}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      openDestinationEnquiry(place, {
                        travelMonth: appliedFilters.travelMonth,
                        travelers: appliedFilters.travelers,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold text-[#e30613] transition hover:gap-2 ${place.country ? "mt-2" : ""}`}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Enquiry Now <span aria-hidden>→</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
