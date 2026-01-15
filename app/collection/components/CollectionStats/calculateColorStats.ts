import { CollectionMask } from "../../../../lib/types";

const DEFAULT_COLORS_BY_RARITY: Record<string, string[]> = {
  COMMON: [
    "standard",
    "orange",
    "perriwinkle",
    "lime",
    "tan",
    "light gray",
    "dark gray",
  ],
  RARE: ["standard", "red", "blue", "green", "brown", "white", "black"],
  MYTHIC: ["standard"],
};

export function calculateColorStatsFallback(
  collection: CollectionMask[],
  allMasks: Array<{ mask_id: string; base_rarity: string; generation: number }>
): Record<string, { owned: number; available: number }> {
  const colorStats: Record<string, { owned: number; available: number }> = {};

  const allColors = new Set<string>();
  Object.values(DEFAULT_COLORS_BY_RARITY).forEach((colors) => {
    colors.forEach((color) => allColors.add(color));
  });

  allColors.forEach((color) => {
    let owned = 0;
    let available = 0;

    allMasks.forEach((mask) => {
      const maskRarity =
        mask.base_rarity as keyof typeof DEFAULT_COLORS_BY_RARITY;
      const availableColorsForRarity =
        DEFAULT_COLORS_BY_RARITY[maskRarity] || [];

      if (availableColorsForRarity.includes(color)) {
        available++;

        const userMask = collection.find((m) => m.mask_id === mask.mask_id);
        if (userMask && userMask.unlocked_colors?.includes(color)) {
          owned++;
        }
      }
    });

    if (available > 0) {
      colorStats[color] = { owned, available };
    }
  });

  return colorStats;
}
