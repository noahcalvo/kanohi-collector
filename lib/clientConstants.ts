// Client-safe constants that can be imported in browser code
// These are re-exported from constants.ts to avoid pulling in server-only dependencies

import type { BuffType, EquipSlot } from "./types";

export const LEVEL_BASE_BY_RARITY = {
  COMMON: 5,
  RARE: 25,
  MYTHIC: 200,
};

export const MAX_LEVEL_BY_RARITY = {
  COMMON: 10,
  RARE: 5,
  MYTHIC: 3,
};

// Helper function for displaying buff percentages based on equip slot
export function buffPercent(slot: EquipSlot): string {
  if (slot === "TOA") {
    return "(+100% buff)";
  } else if (slot === "TURAGA") {
    return "(+50% buff)";
  }
  return "";
}

// Map buff types to user-friendly descriptions
export function getBuffDescription(buffType: BuffType): string {
  const buffDescriptions: Record<BuffType, string> = {
    PACK_LUCK: "Increases chance of higher rarity masks in packs",
    TIMER_SPEED: "Reduces time required to earn pack units",
    DUPLICATE_EFF: "Increases protodermis earned from duplicate masks",
    DISCOVERY: "Increases chance of discovering new masks you don't own",
    VISUAL: "Purely cosmetic - no gameplay buff",
  };
  return buffDescriptions[buffType] || "Unknown buff";
}
