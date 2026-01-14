import React from "react";
import { ColoredMask } from "./ColoredMask";

interface ColoredMaskWithGlowProps {
  maskId: string;
  color?: string;
  className?: string;
  alt?: string;
  transparent?: boolean;
}

/**
 * Wraps ColoredMask with a glow layer to improve visibility of eye holes on dark masks.
 */
export function ColoredMaskWithGlow({
  maskId,
  color,
  className,
  alt,
  transparent,
}: ColoredMaskWithGlowProps) {
  return (
    <div className="relative" style={{ filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))" }}>
      <ColoredMask
        maskId={maskId}
        color={color}
        className={className}
        alt={alt}
        withShading={false}
        transparent={transparent}
      />
    </div>
  );
}
