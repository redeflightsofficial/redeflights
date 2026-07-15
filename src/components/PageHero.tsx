import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";

type PageHeroProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  breadcrumb: string;
  image: string;
  centered?: boolean;
  showBreadcrumb?: boolean;
  compact?: boolean;
  eyebrowVariant?: "text" | "badge";
  brandLogo?: boolean;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  image,
  centered = false,
  showBreadcrumb = true,
  compact = false,
  eyebrowVariant = "text",
  brandLogo = false,
  children,
}: PageHeroProps) {
  return (
    <section
      className={`hero-depth relative bg-cover bg-center overflow-x-hidden ${children ? "overflow-y-visible" : "overflow-hidden"}`}
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(4, 36, 72, 0.88) 0%, rgba(11, 47, 87, 0.72) 45%, rgba(4, 36, 72, 0.55) 100%), url('${image}')`,
      }}
    >
      <div
        className={`mx-auto max-w-[1260px] px-4 text-white ${
          compact ? "py-3 sm:py-4" : "py-10 sm:py-14 md:py-16"
        } ${
          children
            ? compact
              ? "min-h-0 pb-8 sm:min-h-0 sm:pb-10"
              : "min-h-0 pb-20 sm:min-h-[360px] sm:pb-24 md:min-h-[460px] md:pb-32"
            : compact
              ? "min-h-0 sm:min-h-[200px]"
              : "min-h-0 sm:min-h-[320px] md:min-h-[380px]"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}
        >
          {eyebrow ? (
            eyebrowVariant === "badge" ? (
              <span className="inline-flex rounded-full border border-[#ff8a94]/40 bg-[#e30613] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                {eyebrow}
              </span>
            ) : (
              <p className="font-display text-base italic text-[#ffdadf] sm:text-xl">{eyebrow}</p>
            )
          ) : null}
          {brandLogo ? (
            <div className={`mt-2 ${centered ? "flex justify-center" : ""}`}>
              <BrandLogo variant="navbar" tone="onDark" />
            </div>
          ) : null}
          {!brandLogo && title ? (
            <h1
              className={`font-extrabold leading-tight tracking-tight text-white ${
                compact ? "mt-3 text-2xl sm:text-3xl md:text-4xl" : "mt-2 text-3xl sm:text-4xl md:text-5xl"
              } ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
            >
              {title}
            </h1>
          ) : null}
          {!brandLogo && description ? (
            <p
              className={`leading-6 text-white/85 ${
                compact ? "mt-2 text-sm sm:text-[15px]" : "mt-3 text-sm sm:text-base"
              } ${centered ? "mx-auto max-w-xl" : "max-w-xl"}`}
            >
              {description}
            </p>
          ) : null}
          {showBreadcrumb ? (
            <p className="mt-5 text-sm text-white/90">
              Home <span className="text-[#ff4d5a]">&gt;</span> {breadcrumb}
            </p>
          ) : null}
        </motion.div>
      </div>
      {children ? <div className="relative z-20">{children}</div> : null}
    </section>
  );
}
