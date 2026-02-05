import Image from "next/image";
import React, { memo } from "react";
import { colorToHex } from "../../lib/colors";

interface ColoredMaskProps {
  maskId: string;
  color?: string;
  className?: string;
  alt?: string;
  transparent?: boolean;
  withShading?: boolean;
  style?: React.CSSProperties;
  priority?: boolean;
}

// Color utilities centralized in lib/colors

/**
 * Renders a mask image with runtime color recoloring using multiply blend mode + CSS mask.
 * For opaque masks (100% opacity), uses CSS mask technique.
 * For transparent masks (80% opacity), overlays the colored image directly.
 * Memoized for better performance when re-rendering with same props.
 */
export const ColoredMask = memo(function ColoredMask({
  maskId,
  color = "standard", // Default grey
  className = "",
  alt = "Mask",
  transparent = false,
  withShading = false,
  style = {},
  priority = false,
}: ColoredMaskProps) {
  const imagePath = `/masks/${maskId}.png`;
  const hexColor = colorToHex(color);
  const isTransparent = transparent;

  // Mask rendering with proper coloring and lighting
  return (
    <div
      className={`relative ${className}`}
      style={{
        isolation: "isolate",
        WebkitMaskImage: `url(${imagePath})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${imagePath})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        opacity: isTransparent ? 0.8 : 1,
        ...style,
      }}
    >
      {/* White background layer */}
      <div className="absolute inset-0 bg-white" />

      {/* Grayscale mask image */}
      <Image
        src={imagePath}
        alt={alt}
        fill
        sizes="(max-width: 768px) 128px, 256px"
        className="absolute inset-0 w-full h-full object-contain"
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />

      {/* Color multiply layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: hexColor,
          mixBlendMode: "multiply",
        }}
      />

      {withShading && (
        <>
          {/* Highlight layer - top-left highlight */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)",
              mixBlendMode: "soft-light",
              pointerEvents: "none",
            }}
          />

          {/* Shadow layer - bottom-right shadow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 70%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 100%)",
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  );
});
