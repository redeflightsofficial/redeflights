import Image from "next/image";
import { canUseNextImage } from "@/lib/visa-display";

type VisaImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
};

export function VisaImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  sizes,
}: VisaImageProps) {
  const fillClass = fill ? "absolute inset-0 h-full w-full " : "";

  if (canUseNextImage(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={`${fillClass}${className || ""}`}
        />
      );
    }

    return <Image src={src} alt={alt} width={width} height={height} className={className} />;
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`${fillClass}${className || ""}`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );
}
