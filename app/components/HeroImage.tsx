"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ColoredMask } from "./ColoredMask";
import { NakedHead } from "./NakedHead";

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
  transparent,
  maskOffsetY = 0,
  showBaseHead = true,
}: {
  maskId: string;
  alt: string;
  size?: "sm" | "md";
  color?: string;
  transparent?: boolean;
  maskOffsetY?: number; // Vertical offset in pixels for mask positioning
  showBaseHead?: boolean; // Whether to show the base head underneath the mask
}) {
  const [hidden, setHidden] = useState(false);

  const src = useMemo(() => heroSrc(maskId), [maskId]);

  // If color is provided, use ColoredMask component
  if (color) {
    const sizeClass =
      size === "sm" ? "w-20 h-20 md:w-24 md:h-24" : "w-28 h-28 md:w-32 md:h-32";
    const dimensions = size === "sm" ? 96 : 128;

    return (
      <div
        className={`relative ${sizeClass}`}
        style={{
          filter:
            "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3)) drop-shadow(0 6px 6px rgba(0, 0, 0, 0.23))",
        }}
      >
        {showBaseHead && (
          <>
            {/* Layer 1: Eyes with color - bottom */}
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundColor: "#FF0000",
                maskImage: "url(/head/eyes.png)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskImage: "url(/head/eyes.png)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
              }}
            />
            {/* Layer 2: Base head - middle */}
            <Image
              src="/head/base.png"
              alt="Base head"
              width={dimensions}
              height={dimensions}
              className="absolute inset-0 w-full h-full object-contain z-[5]"
              draggable={false}
              priority={false}
            />
          </>
        )}
        {/* Layer 3: Colored mask - top */}
        <div
          className="absolute inset-0 z-10"
          style={{ transform: `translateY(${maskOffsetY}px)` }}
        >
          <ColoredMask
            maskId={maskId}
            color={color}
            className="w-full h-full"
            alt={alt}
            transparent={transparent}
          />
        </div>
      </div>
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
