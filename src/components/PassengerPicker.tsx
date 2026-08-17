"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clampMenuToViewport, lockBodyOverflowX } from "@/lib/overlay-position";

export type PassengerCounts = {
  adults: number;
  children: number;
  infants: number;
};

export const DEFAULT_PASSENGER_COUNTS: PassengerCounts = {
  adults: 1,
  children: 0,
  infants: 0,
};

const CATEGORIES: {
  key: keyof PassengerCounts;
  label: string;
  hint: string;
  min: number;
}[] = [
  { key: "adults", label: "Adults", hint: "12+ years", min: 1 },
  { key: "children", label: "Children", hint: "2–11 years", min: 0 },
  { key: "infants", label: "Infants", hint: "under 2 years", min: 0 },
];

export function formatPassengerSummary(counts: PassengerCounts) {
  const parts: string[] = [];
  if (counts.adults > 0) {
    parts.push(`${counts.adults} Adult${counts.adults === 1 ? "" : "s"}`);
  }
  if (counts.children > 0) {
    parts.push(`${counts.children} Child${counts.children === 1 ? "" : "ren"}`);
  }
  if (counts.infants > 0) {
    parts.push(`${counts.infants} Infant${counts.infants === 1 ? "" : "s"}`);
  }
  return parts.join(", ") || "1 Adult";
}

function totalPassengers(counts: PassengerCounts) {
  return counts.adults + counts.children + counts.infants;
}

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

type PassengerPickerProps = {
  value: PassengerCounts;
  onChange: (next: PassengerCounts) => void;
  className?: string;
  buttonClassName?: string;
};

export function PassengerPicker({
  value,
  onChange,
  className = "",
  buttonClassName = "",
}: PassengerPickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const preferredWidth = isMobile ? window.innerWidth - 16 : Math.max(rect.width, 300);
      const { left, width } = clampMenuToViewport(
        isMobile ? 8 : rect.left,
        Math.min(340, preferredWidth),
        8,
      );
      const gap = 8;
      const estimatedHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;

      setPosition({
        top: openUp ? Math.max(12, rect.top - estimatedHeight - gap) : rect.bottom + gap,
        left,
        width,
      });
    }

    updatePosition();
    const unlock = lockBodyOverflowX();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    return () => {
      unlock();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function updateCount(key: keyof PassengerCounts, delta: number) {
    const category = CATEGORIES.find((item) => item.key === key);
    if (!category) return;

    const nextValue = Math.max(category.min, Math.min(9, value[key] + delta));
    if (nextValue === value[key]) return;
    onChange({ ...value, [key]: nextValue });
  }

  function handleClear() {
    onChange({ ...DEFAULT_PASSENGER_COUNTS });
  }

  function handleDone() {
    setOpen(false);
  }

  const isDefault =
    value.adults === 1 && value.children === 0 && value.infants === 0;

  const panel =
    open && mounted && position
      ? createPortal(
          <div
            ref={panelRef}
            id={listId}
            role="dialog"
            aria-label="Select passengers"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              maxWidth: "calc(100vw - 16px)",
              zIndex: 10000,
            }}
            className="overflow-x-hidden overflow-y-auto rounded-2xl border border-[#d7e2f0] bg-white shadow-[0_20px_48px_rgba(11,47,87,0.22)]"
          >
            <div className="border-b border-[#eef2f8] bg-[#f8fafc] px-4 py-3">
              <p className="text-base font-bold text-[#0b2f57]">Who are you travelling with?</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {totalPassengers(value)} traveller{totalPassengers(value) === 1 ? "" : "s"} selected
              </p>
            </div>

            <ul className="space-y-1 px-3 py-3">
              {CATEGORIES.map((category) => {
                const count = value[category.key];
                const canDecrease = count > category.min;
                const canIncrease = count < 9;

                return (
                  <li
                    key={category.key}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#f8fafc]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0b2f57]">{category.label}</p>
                      <p className="text-xs text-slate-500">{category.hint}</p>
                    </div>

                    <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-lg border border-[#c8d4e6] bg-white shadow-sm">
                      <button
                        type="button"
                        aria-label={`Decrease ${category.label}`}
                        disabled={!canDecrease}
                        onClick={() => updateCount(category.key, -1)}
                        className="flex h-full w-9 items-center justify-center bg-[#0b2f57] text-lg font-semibold leading-none text-white transition hover:bg-[#092847] disabled:cursor-not-allowed disabled:bg-[#0b2f57]/35"
                      >
                        −
                      </button>
                      <span className="flex h-full min-w-11 items-center justify-center px-3 text-sm font-bold text-[#0b2f57]">
                        {count}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${category.label}`}
                        disabled={!canIncrease}
                        onClick={() => updateCount(category.key, 1)}
                        className="flex h-full w-9 items-center justify-center bg-[#0b2f57] text-lg font-semibold leading-none text-white transition hover:bg-[#092847] disabled:cursor-not-allowed disabled:bg-[#0b2f57]/35"
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2 border-t border-[#eef2f8] bg-[#f8fafc] px-3 py-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={isDefault}
                className="h-10 flex-1 rounded-lg border border-[#d5deea] bg-white px-3 text-sm font-semibold text-[#0b2f57] transition hover:border-[#0b2f57]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="h-10 flex-[1.3] rounded-lg bg-[#e30613] px-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(227,6,19,0.28)] transition hover:bg-[#c40010]"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative z-[60] min-w-0 max-w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={
          buttonClassName ||
          "flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-white/25 bg-white px-2.5 py-1.5 text-left text-base font-semibold text-[#0b2f57] outline-none transition hover:border-white focus:border-white focus:ring-2 focus:ring-white/30 sm:text-[15px]"
        }
      >
        <span className="truncate">{formatPassengerSummary(value)}</span>
        <span className="shrink-0 text-[#0b2f57]/70" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {panel}
    </div>
  );
}
