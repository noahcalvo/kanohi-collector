import React from "react";

interface ColoredMaskProps {
  maskId: string;
  color?: string;
  className?: string;
  alt?: string;
}

/**
 * Maps color names to hex codes
 */
function colorToHex(color: string): string {
  const colorMap: Record<string, string> = {
    standard: "#808080",
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#10B981",
    yellow: "#F59E0B",
    purple: "#A855F7",
    orange: "#F97316",
    black: "#1F2937",
    white: "#F3F4F6",
    gold: "#EAB308",
    alt_blue: "#3B82F6",
    alt_green: "#10B981",
    alt_black: "#1F2937",
  };
  
  // If already a hex code, return as is
  if (color.startsWith("#")) return color;
  
  // Otherwise look up the color name
  return colorMap[color.toLowerCase()] || colorMap.standard;
}

/**
 * Renders a mask image with runtime color recoloring using multiply blend mode + CSS mask.
 * Requires mask images to have 100% opacity (not semi-transparent).
 */
export function ColoredMask({ 
  maskId, 
  color = "standard", // Default grey
  className = "",
  alt = "Mask"
}: ColoredMaskProps) {
  const imagePath = `/masks/${maskId}.png`;
  const hexColor = colorToHex(color);

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
      }}
    >
      {/* White background layer */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Grayscale mask image */}
      <img
        src={imagePath}
        alt={alt}
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* Color multiply layer */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: hexColor,
          mixBlendMode: "multiply"
        }}
      />
    </div>
  );
}
