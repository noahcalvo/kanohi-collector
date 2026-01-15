"use client";

import { useMemo } from "react";
import type { CollectionMask, Rarity } from "../../../lib/types";
import { calculateColorStatsFallback } from "../components/CollectionStats/calculateColorStats";
import { ColorUnlockProgress } from "../components/CollectionStats/ColorUnlockProgress";
import { MythicCounter } from "../components/CollectionStats/MythicCounter";
import { OverallCompletion } from "../components/CollectionStats/OverallCompletion";
import { RarityBreakdown } from "../components/CollectionStats/RarityBreakdown";
import { StrongestMasks } from "../components/CollectionStats/StrongestMasks";

export function CollectionStats({
  collection,
  allMasks,
  colorAvailability,
  isExpanded = true,
  onToggle,
}: {
  collection: CollectionMask[];
  allMasks: Array<{ mask_id: string; base_rarity: Rarity; generation: number }>;
  colorAvailability?: Record<string, { owned: number; available: number }>;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const colorStats = useMemo(
    () =>
      colorAvailability || calculateColorStatsFallback(collection, allMasks),
    [colorAvailability, collection, allMasks]
  );

  const rarityStats = useMemo(() => {
    const stats = new Map<Rarity, { owned: number; total: number }>();
    const rarityOrder: Rarity[] = ["MYTHIC", "RARE", "COMMON"];

    rarityOrder.forEach((rarity) => {
      const owned = collection.filter((m) => m.rarity === rarity).length;
      const total = allMasks.filter((m) => m.base_rarity === rarity).length;
      stats.set(rarity, { owned, total });
    });

    return stats;
  }, [collection, allMasks]);

  const mythicCount = useMemo(
    () => collection.filter((m) => m.rarity === "MYTHIC").length,
    [collection]
  );

  const totalMythic = useMemo(
    () => allMasks.filter((m) => m.base_rarity === "MYTHIC").length,
    [allMasks]
  );

  const totalOwned = collection.length;
  const totalAvailable = allMasks.length;
  const overallPercent =
    totalAvailable > 0 ? Math.round((totalOwned / totalAvailable) * 100) : 0;

  const rarityOrder: Rarity[] = ["MYTHIC", "RARE", "COMMON"];

  return (
    <section className="card">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 rounded-xl transition-colors flex items-center justify-between text-left hover:bg-white/50 active:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-slate-900">
            Collection Statistics
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
            <OverallCompletion
              percent={overallPercent}
              owned={totalOwned}
              total={totalAvailable}
            />
            <MythicCounter count={mythicCount} total={totalMythic} />
            <StrongestMasks collection={collection} />
            <RarityBreakdown
              rarityStats={rarityStats}
              rarityOrder={rarityOrder}
            />
            <ColorUnlockProgress colorStats={colorStats} />
          </div>
        </div>
      )}
    </section>
  );
}
