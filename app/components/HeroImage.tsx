"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ColoredMask } from "./ColoredMask";

function heroSrc(maskId: string): string | null {
  const match = maskId.match(/_(\d{2})$/);
  if (!match) return null;
  return `/mask_${match[1]}_hero.png`;
}

export function HeroImage({
  maskId,
  alt,
  size = "md",
  color,
}: {
  maskId: string;
  alt: string;
  size?: "sm" | "md";
  color?: string;
}) {
  const [hidden, setHidden] = useState(false);

  const src = useMemo(() => heroSrc(maskId), [maskId]);

  // If color is provided, use ColoredMask component
  if (color) {
    const sizeClass =
      size === "sm" ? "w-20 h-20 md:w-24 md:h-24" : "w-28 h-28 md:w-32 md:h-32";
    return (
      <ColoredMask
        maskId={maskId}
        color={color}
        className={sizeClass}
        alt={alt}
      />
    );
  }

  if (!src || hidden) return null;

  const dims =
    size === "sm"
      ? { width: 96, height: 96, className: "w-20 h-20 md:w-24 md:h-24" }
      : { width: 176, height: 176, className: "w-28 h-28 md:w-32 md:h-32" };

  return (
    <Image
      src={src}
      alt={alt}
      width={dims.width}
      height={dims.height}
      className={dims.className + " object-contain select-none drop-shadow-sm"}
      draggable={false}
      priority={false}
      onError={() => setHidden(true)}
    />
  );
}
