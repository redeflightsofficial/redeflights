"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { WhatsAppIcon } from "@/components/icons";
import { CONTACT_EMAIL, CONTACT_PHONE, MAILTO_URL, TEL_URL, WHATSAPP_URL } from "@/lib/contact";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Flights", href: "/flights" },
  { label: "Hotels", href: "/hotels" },
  { label: "Tour Packages", href: "/packages" },
  { label: "Visa", href: "/visa" },
  { label: "Destinations", href: "/destinations" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export function Navbar({
  active = "Home",
  overlay = false,
}: {
  active?: string;
  overlay?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className={`w-full max-w-full overflow-x-hidden ${
        overlay ? "absolute inset-x-0 top-0 z-50" : "fixed inset-x-0 top-0 z-50 shadow-sm"
      }`}
    >
      {!overlay && (
        <div className="bg-[#042448] text-white dark:bg-[#071526]">
          <div className="mx-auto flex max-w-[1260px] flex-col gap-1 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 sm:gap-6">
              <a href={TEL_URL} className="break-all hover:text-blue-100 sm:break-normal">
                {CONTACT_PHONE}
              </a>
              <a href={MAILTO_URL} className="break-all hover:text-blue-100 sm:break-normal">
                {CONTACT_EMAIL}
              </a>
            </div>
            <span className="text-blue-100">Mon - Sun: 9:00 AM - 9:00 PM</span>
          </div>
        </div>
      )}

      <div
        className={
          overlay
            ? "border-b border-white/20 bg-white/90 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90"
            : "border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        }
      >
        <div className="mx-auto flex max-w-[1260px] items-center justify-between gap-3 px-4 py-3 lg:gap-4">
          <Link href="/" className="inline-flex shrink-0 bg-transparent leading-none">
            <BrandLogo />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-x-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition xl:text-[14px] ${
                  link.label === active
                    ? "bg-[#fff5f6] text-[#e30613] dark:bg-slate-800 dark:text-[#ff8a94]"
                    : "text-[var(--nav-text)] hover:bg-slate-100 hover:text-[#e30613] dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-premium premium-shadow hidden items-center gap-1.5 rounded-xl bg-[#e30613] px-4 py-2.5 text-xs font-semibold text-white sm:inline-flex lg:text-sm"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enquire Now
            </a>
            <button
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-[#0b2f57] shadow-sm transition hover:border-[#e30613]/40 hover:text-[#e30613] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 lg:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? "top-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    isMenuOpen ? "top-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
            <div className="flex flex-col gap-1.5 pt-3 text-[15px] font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex min-h-[44px] items-center rounded-xl px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    link.label === active ? "text-[#e30613]" : "text-[var(--nav-text)]"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-premium mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#e30613] px-3 py-2.5 text-sm font-semibold text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Enquire Now
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
