"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";

export type ContentHeroHighlight = {
  title: string;
  sub: string;
  href?: string;
  external?: boolean;
};

type ContentPageHeroProps = {
  image: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  eyebrow?: string;
  title?: string;
  description?: string;
  breadcrumb?: string;
  highlights?: ContentHeroHighlight[];
  highlightsPosition?: "inline" | "bottom";
  centered?: boolean;
  showBreadcrumb?: boolean;
  useLogo?: boolean;
  compact?: boolean;
  theme?: "dark" | "light";
};

export function ContentPageHero({
  image,
  imagePosition = "center",
  imageFit = "cover",
  eyebrow,
  title,
  description,
  breadcrumb = "",
  highlights = [],
  highlightsPosition = "inline",
  centered = false,
  showBreadcrumb = true,
  useLogo = false,
  compact = false,
  theme = "dark",
}: ContentPageHeroProps) {
  const contentPaddingClass = compact
    ? "pt-5 pb-4 sm:pt-10 sm:pb-6 md:pt-14 md:pb-8"
    : "pt-8 pb-6 sm:pt-12 sm:pb-8 md:pt-16 md:pb-10";
  const highlightPaddingClass = compact
    ? "px-4 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6"
    : "px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6";

  const isLight = theme === "light";
  const pinHighlights = highlightsPosition === "bottom" && highlights.length > 0;

  const sectionMinHeightClass = pinHighlights
    ? imageFit === "contain"
      ? "min-h-[440px] bg-gradient-to-b from-sky-100 via-sky-50 to-sky-100 sm:min-h-[500px]"
      : "min-h-[380px] sm:min-h-[440px]"
    : imageFit === "contain"
      ? "min-h-[300px] bg-gradient-to-b from-sky-100 via-sky-50 to-sky-100 sm:min-h-[360px]"
      : "";

  return (
    <section
      className={`content-page-hero relative flex w-full flex-col overflow-hidden ${sectionMinHeightClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden
        className={`absolute inset-0 z-0 h-full w-full ${
          imageFit === "contain" ? "object-contain object-center" : "object-cover"
        } ${
          isLight
            ? "brightness-[1.02] saturate-[1.05]"
            : imageFit === "contain"
              ? ""
              : "brightness-[1.08] saturate-[1.1] contrast-[1.04]"
        }`}
        style={{ objectPosition: imagePosition }}
      />
      {isLight ? (
        <>
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-sky-50/55 via-white/35 to-white/70" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-white/25 via-transparent to-sky-100/20" />
        </>
      ) : imageFit === "contain" ? (
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-white/10 via-transparent to-[#042448]/55" />
      ) : (
        <>
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#042448]/92 via-[#0b2f57]/68 to-[#0b2f57]/35" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#042448]/50 via-transparent to-transparent" />
        </>
      )}

      <div className={`relative z-[2] flex flex-col ${pinHighlights ? "min-h-full flex-1" : ""}`}>
        <div className={`mx-auto w-full max-w-[1260px] px-4 sm:px-4 ${contentPaddingClass}`}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}
          >
            {useLogo ? (
              <div className={`${centered ? "flex justify-center" : ""}`}>
                <div
                  className={
                    isLight
                      ? "drop-shadow-[0_2px_14px_rgba(255,255,255,0.95)]"
                      : "drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
                  }
                >
                  <BrandLogo variant="navbar" tone={isLight ? "onLight" : "onDark"} />
                </div>
              </div>
            ) : (
              <>
                {eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#e30613] drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)] sm:text-sm sm:tracking-[0.16em]">
                    {eyebrow}
                  </p>
                ) : null}
                {title ? (
                  <h1 className="mt-2 text-2xl font-extrabold leading-[1.2] text-[#e30613] drop-shadow-[0_2px_10px_rgba(255,255,255,0.95)] sm:mt-3 sm:text-3xl md:text-4xl lg:text-[2.75rem]">
                    {title}
                  </h1>
                ) : null}
              </>
            )}
            {description ? (
              <p
                className={`max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg ${
                  isLight ? "text-[#0b2f57]/85" : "text-white/95"
                } ${useLogo ? "mt-4 sm:mt-5" : "mt-3 sm:mt-4"} ${centered ? "mx-auto" : ""} ${
                  isLight ? "" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
                }`}
              >
                {description}
              </p>
            ) : null}
            {showBreadcrumb ? (
              <p className={`mt-4 text-sm sm:mt-5 sm:text-base ${isLight ? "text-slate-500" : "text-white/90"}`}>
                <Link
                  href="/"
                  className={`font-medium transition ${isLight ? "hover:text-[#0b2f57]" : "hover:text-white"}`}
                >
                  Home
                </Link>
                <span className={`mx-2 ${isLight ? "text-[#e30613]" : "text-[#ff6b75]"}`}>&gt;</span>
                <span className={`font-semibold ${isLight ? "text-[#0b2f57]" : "text-white"}`}>{breadcrumb}</span>
              </p>
            ) : null}
          </motion.div>
        </div>

        {highlights.length > 0 ? (
          <div
            className={`relative z-[3] border-t border-white/20 bg-[#042448]/95 backdrop-blur-md ${
              pinHighlights ? "mt-auto" : ""
            }`}
          >
            <div
              className={`mx-auto grid max-w-[1260px] grid-cols-1 divide-y divide-white/10 sm:divide-x sm:divide-y-0 ${
                highlights.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
              }`}
            >
              {highlights.map((item) => {
                const inner = (
                  <>
                    <p className="text-sm font-bold text-[#e30613] sm:text-base md:text-lg">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/75 sm:mt-1 sm:text-sm">{item.sub}</p>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      className="group flex min-h-[56px] flex-col justify-center px-4 py-4 transition hover:bg-white/5 sm:min-h-0 sm:px-6 sm:py-5 md:px-8 md:py-6"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 sm:text-xs">
                        {item.title}
                      </span>
                      <span className="mt-1 break-all text-sm font-semibold text-white group-hover:text-[#ffb3b8] sm:mt-1.5 sm:break-normal sm:text-base md:text-lg">
                        {item.sub}
                      </span>
                    </a>
                  );
                }

                return (
                  <div
                    key={item.title}
                    className={`text-center ${highlightPaddingClass}`}
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
