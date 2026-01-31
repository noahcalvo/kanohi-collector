// Client-safe constants that can be imported in browser code
// These are re-exported from constants.ts to avoid pulling in server-only dependencies

import { PACK_UNIT_SECONDS } from "./constants";
import type { BuffType, EquipSlot } from "./types";

export const LEVEL_BASE = 500

export const MAX_LEVEL_BY_RARITY = {
  COMMON: 10,
  RARE: 5,
  MYTHIC: 3,
};

// Pack cooldown constants (client-safe subset)
export const PACK_UNITS_PER_PACK = 5;
export const TOTAL_PACK_COOLDOWN_SECONDS = PACK_UNIT_SECONDS * PACK_UNITS_PER_PACK;

// Helper function for displaying buff percentages based on equip slot
export function buffPercent(slot: EquipSlot): string {
  if (slot === "TOA") {
    return "(+100% buff)";
  } else if (slot === "TURAGA") {
    return "(+50% buff)";
  }
  return "";
}

// Compute the actual buff value for a mask
export function computeMaskBuffValue(
  buffBaseValue: number,
  level: number,
): number {
  return buffBaseValue * level;
}

// Format buff value as percentage or time reduction
export function formatBuffValue(
  buffType: BuffType,
  value: number,
): string {
  if (value === 0) return "No effect";
  
  switch (buffType) {
    case "RARITY_ODDS":
      return `+${(value * 100).toFixed(1)}% rare rarity boost`;
    case "CD_REDUCTION":
      const secondsSaved = TOTAL_PACK_COOLDOWN_SECONDS * value;
      const hoursSaved = secondsSaved / 3600;
      if (hoursSaved >= 1) {
        return `-${hoursSaved.toFixed(1)}h cooldown`;
      } else {
        const minutesSaved = secondsSaved / 60;
        return `-${minutesSaved.toFixed(0)}m cooldown`;
      }
    case "PROTODERMIS":
      return `+${(value * 100).toFixed(1)}% protodermis`;
    case "DISCOVERY":
      return `+${(value * 100).toFixed(1)}% discovery`;
    case "INSPECTION":
      // todo: implement pack inspection
      return value > 0 ? "This effect has not been implemented yet" : "No effect";
    case "COLOR_VARIANTS":
      return `+${(value * 100).toFixed(0)}% color unlock`;
    case "FRIEND_BONUS":
      // todo: implement friend bonus
      return `+${(value * 100).toFixed(1)}% friend buff`;
    case "PACK_STACKING":
      return Math.floor(value) > 0 ? `+${Math.floor(value)} pack stack limit` : "Level this mask to increase pack stack limit";
    case "VISUAL":
      return "Cosmetic only";
    default:
      return `+${(value * 100).toFixed(1)}%`;
  }
}

// Map buff types to user-friendly descriptions
export function getBuffDescription(buffType: BuffType): string {
  const buffDescriptions: Record<BuffType, string> = {
    RARITY_ODDS: "Increases chance of higher rarity masks in packs",
    CD_REDUCTION: "Reduces time required to earn pack units",
    PROTODERMIS: "Increases protodermis earned from duplicate masks",
    DISCOVERY: "Increases chance of discovering new masks you don't own",
    VISUAL: "Purely cosmetic - no gameplay buff",
    INSPECTION: "Allows for occasional inspection of mask packs",
    COLOR_VARIANTS: "Increases chance of unlocking new mask colors",
    FRIEND_BONUS: "Boosts benefits from having friends",
    PACK_STACKING: "Enables accumulation of multiple packs",
  };
  return buffDescriptions[buffType] || "Unknown buff";
}
