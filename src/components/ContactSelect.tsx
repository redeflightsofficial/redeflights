"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type ContactSelectOption = {
  label: string;
  value: string;
};

type ContactSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ContactSelectOption[];
  ariaLabel: string;
  selectedLabel?: string;
  className?: string;
  listClassName?: string;
};

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
};

export function ContactSelect({
  value,
  onChange,
  options,
  ariaLabel,
  selectedLabel,
  className = "",
  listClassName = "",
}: ContactSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = Math.min(Math.max(rect.width, 200), 320);
    const menuHeight = Math.min(options.length, 8) * 44 + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;
    const maxLeft = window.innerWidth - menuWidth - 8;
    const left = Math.max(8, Math.min(rect.left, maxLeft));

    setMenuPosition({
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
      left,
      width: menuWidth,
    });
  };

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
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent | PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.(`[data-contact-menu="${listId}"]`)) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, listId]);

  const selected = options.find((option) => option.value === value);

  const dropdown =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            data-contact-menu={listId}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 99999,
            }}
            className={`max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_30px_rgba(11,47,87,0.12)] ${listClassName}`}
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full min-h-[44px] touch-manipulation items-center px-3 text-left text-base transition ${
                    active
                      ? "bg-[#fff5f6] font-semibold text-[#e30613]"
                      : "text-[#0b2f57] hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full min-h-[44px] touch-manipulation items-center justify-between gap-2 py-2.5 text-base text-[#0b2f57] outline-none"
      >
        <span className="truncate text-left font-semibold">
          {selectedLabel || selected?.label || "Select"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {dropdown}
    </div>
  );
}
