import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CONTACT_EMAIL, CONTACT_PHONE, MAILTO_URL, OFFICE_ADDRESS, TEL_URL } from "@/lib/contact";

const FOOTER_SKY_IMAGE = "/background.png";
const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Flights", href: "/flights" },
  { label: "Hotels", href: "/hotels" },
  { label: "Tour Packages", href: "/packages" },
  { label: "Destinations", href: "/destinations" },
];

const serviceLinks = [{ label: "Visa Services", href: "/visa" }];

export function Footer() {
  return (
    <footer className="relative isolate w-full max-w-full overflow-hidden border-t border-[#dbe4f0] bg-gradient-to-b from-[#0b2f57] to-[#072040] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOOTER_SKY_IMAGE}
          alt=""
          className="h-full w-full object-cover object-center opacity-40"
        />
      </div>
      <div className="footer-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(227,6,19,0.16),transparent_36%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1260px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid w-full gap-6 border-b border-white/15 pb-6 sm:gap-7 sm:pb-8 md:grid-cols-2 lg:grid-cols-4 lg:items-start lg:gap-8">
          <div className="text-center lg:text-left">
            <BrandLogo variant="navbar" tone="onDark" className="mx-auto lg:mx-0" />
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-blue-50/95 lg:mx-0">
              We are passionate about travel and committed to providing exceptional service and
              unforgettable experiences.
            </p>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-[#ff4d5a] sm:text-base">Quick Links</p>
            <ul className="space-y-0.5 text-sm text-blue-50/90">
              {quickLinks.map((item) => (
                <li key={item.href} className="footer-link">
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-[#ff4d5a] sm:text-base">Our Services</p>
            <ul className="space-y-0.5 text-sm text-blue-50/90">
              {serviceLinks.map((item) => (
                <li key={item.label} className="footer-link">
                  {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold text-[#ff4d5a] sm:text-base">Contact Us</p>
            <ul className="space-y-0.5 text-sm text-blue-50/90">
              <li className="footer-link leading-6">
                <span>{OFFICE_ADDRESS}</span>
              </li>
              <li className="footer-link">
                <a href={TEL_URL}>{CONTACT_PHONE}</a>
              </li>
              <li className="footer-link">
                <a href={MAILTO_URL} className="break-all lg:break-normal">
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex w-full flex-col items-center gap-2 text-center text-xs text-blue-100/90 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© 2026 REDE I FLIGHTS. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link href="#" className="footer-link">
              Terms & Conditions
            </Link>
            <Link href="#" className="footer-link">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
