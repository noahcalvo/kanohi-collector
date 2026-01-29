import { masks as maskDefs } from "../staticData";
import type { OpenResult } from "../types";

type PullRowLike = {
  idx: number;
  maskId: string;
  rarity: string;
  color: string;
  isNew: boolean;
  wasColorNew: boolean;
  essenceAwarded: number;
  essenceRemaining: number;
  finalEssenceRemaining: number;
  levelBefore: number;
  levelAfter: number;
  finalLevelAfter: number;
  unlockedColors: string[];
};

export function buildOpenResultReplay(
  pulls: PullRowLike[],
  pityCounterAfter: number,
): OpenResult {
  const byId = new Map(maskDefs.map((m) => [m.mask_id, m] as const));

  return {
    masks: pulls
      .slice()
      .sort((a, b) => a.idx - b.idx)
      .map((p) => {
        const def = byId.get(p.maskId);
        return {
          mask_id: p.maskId,
          name: def?.name ?? p.maskId,
          rarity: p.rarity as any,
          color: p.color,
          is_new: p.isNew,
          was_color_new: p.wasColorNew,
          essence_awarded: p.essenceAwarded,
          essence_remaining: p.essenceRemaining,
          final_essence_remaining: p.finalEssenceRemaining,
          level_before: p.levelBefore,
          level_after: p.levelAfter,
          final_level_after: p.finalLevelAfter,
          unlocked_colors: p.unlockedColors,
          transparent: def?.transparent,
        };
      }),
    pity_counter: pityCounterAfter,
  };
}
