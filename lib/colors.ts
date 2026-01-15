// Server/client-safe color utilities

export type ColorContext = "default" | "pillText";

// Canonical mapping for known color names
const COLOR_HEX_MAP: Record<string, string> = {
  standard: "#a3a3a3",
  red: "#ff0000",
  blue: "#2244ff",
  green: "#15973D",
  brown: "#7C2D12",
  white: "#FFFFFF",
  black: "#222222",
  orange: "#ff8c00",
  perriwinkle: "#00b3ff",
  lime: "#a8e62e",
  "light gray": "#dfe4ed",
  "dark gray": "#63635F",
  tan: "#dbb686",
  gold: "#b8860b",
};

/** Normalize and return canonical hex; passthrough if already hex */
export function colorToHex(name: string | undefined | null): string {
  if (!name) return COLOR_HEX_MAP.standard;
  const n = String(name).trim();
  if (isHex(n)) return normalizeHex(n);
  const key = n.toLowerCase();
  return COLOR_HEX_MAP[key] ?? COLOR_HEX_MAP.standard;
}

/** Context-aware UI hex (e.g., “New Color” pill needs contrast) */
export function uiHex(name: string | undefined | null, context: ColorContext = "default"): string {
  const base = colorToHex(name);
  if (context !== "pillText") return base;
  return adjustForPillText(base);
}

// --- helpers ---

function isHex(input: string): boolean {
  const s = input.startsWith("#") ? input.slice(1) : input;
  return /^[0-9a-fA-F]{3}$/.test(s) || /^[0-9a-fA-F]{6}$/.test(s);
}

function normalizeHex(input: string): string {
  const s = input.startsWith("#") ? input.slice(1) : input;
  return "#" + s.toLowerCase();
}

function adjustForPillText(hex: string): string {
  const b = brightness(hex);
  // If dark, lighten towards white; if light, darken towards black.
  return b < 0.5 ? mixHex(hex, "#ffffff", 0.35) : mixHex(hex, "#000000", 0.35);
}

function brightness(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  // Relative luminance (sRGB)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return "#" + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
}

function mixHex(a: string, b: string, weight: number): string {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  const w = Math.max(0, Math.min(1, weight));
  const r = ar.r * (1 - w) + br.r * w;
  const g = ar.g * (1 - w) + br.g * w;
  const bl = ar.b * (1 - w) + br.b * w;
  return rgbToHex(r, g, bl);
}
