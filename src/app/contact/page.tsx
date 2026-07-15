"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ContactSelect } from "@/components/ContactSelect";
import { ContentPageHero } from "@/components/ContentPageHero";
import { SiteShell } from "@/components/SiteShell";
import { WhatsAppIcon } from "@/components/icons";
import { CONTACT_EMAIL, MAILTO_URL, OFFICE_ADDRESS, WHATSAPP_URL } from "@/lib/contact";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  formatPhoneWithCountryCode,
  PHONE_COUNTRY_CODES,
} from "@/lib/phone-country-codes";

const CONTACT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85";

const eyebrowClass = "text-sm font-semibold uppercase tracking-[0.14em] text-[#e30613]";
const sectionTitleClass = "text-2xl font-extrabold leading-tight text-[#e30613] sm:text-3xl md:text-4xl";
const blockTitleClass = "text-2xl font-bold leading-snug text-[#e30613]";
const bodyClass = "text-base leading-relaxed text-gray-600";
const fieldLabelClass = "text-sm font-semibold text-slate-600";
const phoneFieldWrapClass =
  "mt-1.5 flex flex-col gap-2 border-0 border-b-2 border-slate-200 pb-1 transition focus-within:border-[#e30613] sm:flex-row sm:items-center sm:gap-2";
const phoneCodeWrapClass = "w-full shrink-0 sm:w-[8.5rem]";
const phoneInputClass =
  "min-w-0 w-full flex-1 border-0 bg-transparent py-2.5 text-base text-[#0b2f57] outline-none placeholder:text-slate-400";
const fieldClass =
  "mt-1.5 w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-base text-[#0b2f57] outline-none transition placeholder:text-slate-400 focus:border-[#e30613]";

const fieldLabelRequiredClass = `${fieldLabelClass} after:ml-0.5 after:text-[#e30613] after:content-['*']`;

const featureBoxClass =
  "home-feature border-l-[3px] border-[#e30613]/30 pl-5 transition hover:border-[#e30613]";

const trustItems = [
  { title: "24/7 Support", sub: "Always here when you need us" },
  { title: "Expert Guidance", sub: "Flights, hotels, visa and more" },
  { title: "Fast Response", sub: "Quick answers to your queries" },
];

const services = ["Flights", "Hotels", "Visa", "Tour Packages"];

const quickActions = [
  { title: "Office", sub: OFFICE_ADDRESS },
  { title: "Email Us", sub: CONTACT_EMAIL, href: MAILTO_URL },
  { title: "WhatsApp", sub: "Chat instantly", href: WHATSAPP_URL, external: true },
];

const countryCodeOptions = PHONE_COUNTRY_CODES.map((item) => ({
  label: `${item.country} (${item.code})`,
  value: item.code,
}));

const serviceOptions = services.map((item) => ({
  label: item,
  value: item,
}));

export default function ContactPage() {
  const [agreedToContact, setAgreedToContact] = useState(false);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState(DEFAULT_PHONE_COUNTRY_CODE);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(services[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!agreedToContact) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setWhatsappUrl(null);

    const fullPhone = formatPhoneWithCountryCode(countryCode, phone);
    if (!fullPhone) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: fullPhone, email, service, message }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        whatsappUrl?: string;
      };

      if (!response.ok) {
        setError(result.error || "Unable to submit enquiry.");
        return;
      }

      setSuccess(result.message || "Your enquiry has been submitted successfully.");
      setWhatsappUrl(result.whatsappUrl || null);
      setName("");
      setCountryCode(DEFAULT_PHONE_COUNTRY_CODE);
      setPhone("");
      setEmail("");
      setMessage("");
      setService(services[0]);
      setAgreedToContact(false);
    } catch {
      setError("Network error. Please try again or contact us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell active="Contact Us">
      <ContentPageHero
        image={CONTACT_HERO_IMAGE}
        imagePosition="center 70%"
        eyebrow="We Are Here For You"
        title="Contact Us"
        description="Your trusted partner for flights, hotels and visa. Reach out today and let our team plan your next journey from Ajman to destinations worldwide."
        highlights={quickActions}
        centered
        showBreadcrumb={false}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {trustItems.map((item) => (
            <div key={item.title} className="px-6 py-6 text-center sm:py-8">
              <p className="text-lg font-bold text-[#e30613]">{item.title}</p>
              <p className="mt-2 text-base text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1260px] px-4 py-10 md:py-20">
        <div className="mb-12 text-center">
          <p className={eyebrowClass}>Get in Touch</p>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Start Planning Your Trip Today</h2>
          <p className={`mx-auto mt-4 max-w-2xl ${bodyClass}`}>
            Tell us where you want to go and we will help with the best travel options, transparent
            pricing and dedicated support from our expert team.
          </p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
          >
            <h3 className={blockTitleClass}>Send an Enquiry</h3>
            <p className={`mt-2 text-sm leading-relaxed text-gray-600 sm:text-base`}>
              Complete the form below and our travel team will contact you shortly.
            </p>

            <form className="mt-6 space-y-5 border-t border-slate-200 pt-6" onSubmit={handleSubmit}>
              <div className="grid gap-5">
                <label className="block">
                  <span className={fieldLabelClass}>Your Name</span>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Full name"
                    className={fieldClass}
                    autoComplete="name"
                    required
                  />
                </label>
                <div className="block">
                  <span className={fieldLabelRequiredClass}>Phone Number</span>
                  <div className={phoneFieldWrapClass}>
                    <div className={phoneCodeWrapClass}>
                      <ContactSelect
                        value={countryCode}
                        onChange={setCountryCode}
                        options={countryCodeOptions}
                        ariaLabel="Country code"
                        selectedLabel={countryCode}
                        listClassName="sm:min-w-[14rem]"
                      />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/[^\d\s-]/g, ""))}
                      placeholder="501234567"
                      className={phoneInputClass}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      required
                    />
                  </div>
                </div>
              </div>

              <label className="block">
                <span className={fieldLabelRequiredClass}>Email Address</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.com"
                  className={fieldClass}
                  required
                />
              </label>

              <div className="block">
                <span className={fieldLabelClass}>I am interested in</span>
                <div className="mt-1.5 border-b-2 border-slate-200 transition focus-within:border-[#e30613]">
                  <ContactSelect
                    value={service}
                    onChange={setService}
                    options={serviceOptions}
                    ariaLabel="Service type"
                  />
                </div>
              </div>

              <label className="block">
                <span className={fieldLabelClass}>Message</span>
                <textarea
                  name="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className={`${fieldClass} min-h-[96px] resize-y`}
                  placeholder="Destination, travel dates, passengers, budget or any special request..."
                />
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={agreedToContact}
                  onChange={(e) => setAgreedToContact(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#e30613]"
                  required
                />
                <span className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                  I agree to be contacted by REDE I FLIGHTS regarding my travel enquiry.
                </span>
              </label>

              {success ? (
                <p className="rounded-lg bg-[#ecfdf3] px-3 py-2 text-sm font-medium text-[#166534]">
                  {success}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg bg-[#fff5f6] px-3 py-2 text-sm font-medium text-[#e30613]">
                  {error}
                </p>
              ) : null}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-premium inline-flex min-h-[44px] w-full items-center justify-center gap-2 border border-[#e30613] bg-white px-5 text-sm font-semibold text-[#e30613] hover:bg-[#fff5f6] sm:w-auto"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Share same details on WhatsApp
                </a>
              ) : null}

              <button
                type="submit"
                disabled={!agreedToContact || loading}
                className="btn-premium w-full bg-[#e30613] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c40010] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Submitting..." : "Submit Enquiry"}
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="border-t border-slate-200 pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-14"
          >
            <h3 className={blockTitleClass}>Direct Contact</h3>
            <p className={`mt-3 ${bodyClass}`}>
              Reach us directly for immediate travel assistance. Our advisors are ready to help with
              bookings, visa queries and custom itineraries.
            </p>

            <div className="mt-10 space-y-7">
              <div className={featureBoxClass}>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Office Address
                </p>
                <p className="mt-2 text-base font-bold leading-relaxed text-[#0b2f57]">
                  {OFFICE_ADDRESS}
                </p>
                <p className="mt-1.5 text-base text-gray-500">Visit us in Ajman, UAE</p>
              </div>

              <div className={featureBoxClass}>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Email</p>
                <a
                  href={MAILTO_URL}
                  className="mt-2 block text-lg font-bold text-[#0b2f57] transition hover:text-[#e30613]"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="mt-1.5 text-base text-gray-500">Send your travel enquiry anytime</p>
              </div>

              <div className={featureBoxClass}>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Instant WhatsApp Support
                </p>
                <p className={`mt-2 ${bodyClass}`}>
                  Message us on WhatsApp for fast quotes on flights, hotels and tour packages.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-premium mt-4 inline-flex w-full min-h-[44px] items-center justify-center gap-2.5 bg-[#e30613] px-7 py-3.5 text-base font-semibold text-white hover:bg-[#c40010] sm:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat on WhatsApp
                </a>
              </div>

              <div className={featureBoxClass}>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Office Hours
                </p>
                <p className="mt-2 text-lg font-bold text-[#0b2f57]">Mon - Sun: 9:00 AM - 9:00 PM</p>
                <p className="mt-1.5 text-base text-gray-500">We respond as quickly as possible</p>
              </div>
            </div>

            <p className={`mt-10 ${bodyClass}`}>
              Looking for holiday packages?{" "}
              <Link href="/packages" className="font-bold text-[#e30613] hover:underline">
                View tour packages
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto max-w-[1260px] px-4 py-14">
          <div className="text-center">
            <p className={eyebrowClass}>Our Services</p>
            <h2 className={`mt-3 ${sectionTitleClass}`}>How We Help You Travel</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${bodyClass}`}>
              From flight bookings to visa assistance, we cover every step of your journey.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {services.map((service) => (
              <div
                key={service}
                className="home-feature border-l-[3px] border-[#e30613]/30 py-1 pl-5 transition hover:border-[#e30613]"
              >
                <p className="text-lg font-bold text-[#e30613]">{service}</p>
                <p className="mt-2 text-base text-gray-500">Expert booking support</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
