import Image from "next/image";
import React, { useMemo, useState } from "react";
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
  const [maskReady, setMaskReady] = useState(false);
  const maskPngSrc = useMemo(() => `/masks/${maskId}.png`, [maskId]);

  return (
    <div
      className="relative"
      style={{
        filter: maskReady
          ? "drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))"
          : "none",
        transform: "translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      <Image
        src={maskPngSrc}
        alt=""
        fill
        className="absolute inset-0 opacity-0 pointer-events-none"
        draggable={false}
        priority={false}
        onLoad={() => setMaskReady(true)}
        onError={() => setMaskReady(true)}
      />
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
