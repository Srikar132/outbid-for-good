import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/sanity/lib/image";

export function SanityImage({
  value,
  width = 128,
  height,
  alt = "",
  className,
  priority,
}: {
  value: SanityImageSource;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const resolvedHeight = height ?? width;

  return (
    <Image
      src={urlFor(value).width(width).height(resolvedHeight).fit("crop").url()}
      alt={alt}
      width={width}
      height={resolvedHeight}
      className={className}
      priority={priority}
    />
  );
}
