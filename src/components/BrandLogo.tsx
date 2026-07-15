type BrandLogoProps = {
  variant?: "navbar" | "hero" | "banner";
  tone?: "onLight" | "onDark";
  className?: string;
  mainClassName?: string;
  taglineClassName?: string;
};

export function BrandLogo({
  variant = "navbar",
  tone = "onLight",
  className = "",
  mainClassName = "",
  taglineClassName = "",
}: BrandLogoProps) {
  const mainTextClass =
    variant === "hero"
      ? "text-[18px] sm:text-[21px] md:text-[23px]"
      : variant === "banner"
        ? "text-[11px] sm:text-[12px]"
        : "text-[15px] sm:text-[17px]";
  const taglineTextClass =
    variant === "hero"
      ? "text-[5px] sm:text-[6px] sm:tracking-[0.14em]"
      : variant === "banner"
        ? "text-[4px] sm:text-[4.5px] tracking-[0.1em]"
        : "text-[4.5px] sm:text-[5px] sm:tracking-[0.12em]";

  const onDark = tone === "onDark";
  const lineClass = "bg-[#0b2f57]";
  const dividerClass = "bg-[#0b2f57]";
  const taglineColorClass = onDark ? "text-white/92" : "text-[#0b2f57]";
  const mainShadowClass = onDark ? "drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]" : "";

  return (
    <span
      className={`inline-flex flex-col items-center leading-none ${variant === "banner" ? "gap-0.5" : "gap-1.5"} ${className}`}
    >
      <span className="inline-flex w-fit flex-col items-stretch leading-none">
        <span className={`h-px shrink-0 ${lineClass}`} aria-hidden />
        <span
          className={`inline-flex items-center justify-center gap-[0.34em] whitespace-nowrap py-0.5 font-bold italic tracking-tight text-[#e30613] ${mainTextClass} ${mainShadowClass} ${mainClassName}`}
        >
          <span>REDE</span>
          <span
            className={`inline-block h-[0.95em] w-[0.11em] shrink-0 -skew-x-[18deg] not-italic ${dividerClass}`}
            aria-hidden
          />
          <span>FLIGHTS</span>
        </span>
        <span className={`h-px shrink-0 ${lineClass}`} aria-hidden />
      </span>
      <span
        className={`block w-full text-center font-semibold uppercase tracking-[0.1em] ${taglineColorClass} ${taglineTextClass} ${onDark ? "drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]" : ""} ${taglineClassName}`}
      >
        YOUR JOURNEY, OUR PRIORITY
      </span>
    </span>
  );
}
