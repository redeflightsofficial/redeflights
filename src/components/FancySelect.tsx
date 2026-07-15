"use client";

import { useEffect, useId, useRef, useState } from "react";

type Option = { value: string; label: string };

export function FancySelect({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 border-0 border-b bg-transparent px-0 py-2.5 text-left text-sm font-medium transition ${
          open
            ? "border-[#2f6fed]"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <span className="truncate text-[#0b2f57]">{selected?.label}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-[#2f6fed]" : ""}`}
          fill="none"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeWidth="2" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-auto border border-slate-200 bg-white py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.1)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[#eff4ff] font-semibold text-[#0b2f57]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{option.label}</span>
                  {active && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#2f6fed]" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
