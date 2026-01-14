import Image from "next/image";
import React from "react";

interface NakedHeadProps {
  eyeColor?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Renders a naked head with colored eyes.
 * Layers head/base.png on top of head/eyes.png with a dynamic eye color background.
 */
export function NakedHead({
  eyeColor = "#FF0000",
  className = "",
  size = "md",
}: NakedHeadProps) {
  const dimensions = size === "sm" ? 96 : 128;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Eyes layer with colored background - bottom layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: eyeColor,
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

      {/* Base head layer - top layer */}
      <Image
        src="/head/base.png"
        alt="Head"
        width={dimensions}
        height={dimensions}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        priority={false}
      />
    </div>
  );
}
