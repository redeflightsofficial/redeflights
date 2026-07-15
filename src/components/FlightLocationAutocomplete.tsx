"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  filterFlightLocations,
  type FlightLocationOption,
} from "@/lib/flight-search-locations";

type FlightLocationAutocompleteProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FlightLocationOption[];
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
};

const inputClass =
  "min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0b2f57] outline-none transition placeholder:text-slate-400 focus:border-[#0b2f57]/35 focus:ring-2 focus:ring-[#0b2f57]/10";

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
};

export function FlightLocationAutocomplete({
  label,
  value,
  onChange,
  options,
  placeholder = "City",
  className = "",
  labelClassName = "mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500",
  inputClassName = inputClass,
}: FlightLocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const suggestions = useMemo(
    () => filterFlightLocations(options, value, 12),
    [options, value],
  );

  const updateMenuPosition = () => {
    const wrapper = wrapperRef.current;
    const input = inputRef.current;
    if (!wrapper || !input) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const menuWidth = Math.min(Math.max(wrapperRect.width, 240), window.innerWidth - 16);
    const menuHeight = Math.min(suggestions.length, 8) * 52 + 16;
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const openAbove = spaceBelow < menuHeight + 12 && inputRect.top > menuHeight + 12;
    const maxLeft = window.innerWidth - menuWidth - 8;
    const left = Math.max(8, Math.min(wrapperRect.left, maxLeft));

    setMenuPosition({
      top: openAbove ? undefined : inputRect.bottom + 6,
      bottom: openAbove ? window.innerHeight - inputRect.top + 8 : undefined,
      left,
      width: menuWidth,
    });
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [value, suggestions.length]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, suggestions.length, value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent | PointerEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.(`[data-flight-menu="${listId}"]`)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [listId]);

  function selectOption(option: FlightLocationOption) {
    onChange(option.label);
    setOpen(false);
  }

  const dropdown =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            data-flight-menu={listId}
            style={{
              position: "fixed",
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 99999,
            }}
            className="rounded-xl border border-slate-200 bg-white shadow-[0_20px_44px_rgba(11,47,87,0.2)]"
          >
            {suggestions.length > 0 ? (
              <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto overscroll-contain py-1">
                {suggestions.map((option, index) => (
                  <li
                    key={option.key}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`cursor-pointer touch-manipulation px-3 py-2.5 transition ${
                      index === activeIndex ? "bg-[#f8fafc]" : "hover:bg-[#f8fafc]"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectOption(option);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#0b2f57]">{option.label}</p>
                      <span className="shrink-0 rounded-md bg-[#0b2f57]/8 px-1.5 py-0.5 text-[10px] font-bold text-[#0b2f57]">
                        {option.code}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{option.subtitle}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-slate-500">No matching cities or airports</p>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapperRef} className={`relative overflow-visible ${className}`}>
      <label className={labelClassName}>{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            setOpen(true);
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && suggestions[activeIndex]) {
            event.preventDefault();
            selectOption(suggestions[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className={inputClassName}
      />
      {dropdown}
    </div>
  );
}
