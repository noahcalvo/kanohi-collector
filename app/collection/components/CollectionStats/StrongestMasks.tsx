"use client";

import { Crown } from "lucide-react";
import {
  DUPLICATE_ESSENCE,
  MAX_LEVEL_BY_RARITY,
} from "../../../../lib/constants";
import { CollectionMask } from "../../../../lib/types";
import { ColoredMask } from "../../../components/ColoredMask";

export function StrongestMasks({
  collection,
}: {
  collection: CollectionMask[];
}) {
  const calculateStrength = (mask: CollectionMask): number => {
    return (
      (mask.level - 1) * MAX_LEVEL_BY_RARITY[mask.rarity] +
      (mask.essence || 0) +
      DUPLICATE_ESSENCE
    );
  };

  const topMasks = collection
    .sort((a, b) => calculateStrength(b) - calculateStrength(a))
    .slice(0, 3);

  return (
    <div className="flex flex-col p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-visible md:col-span-2">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 bg-radial-gradient from-emerald-200/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-3 relative z-10">
        Strongest Masks
      </div>
      <div className="flex justify-center items-end gap-0 md:gap-4 lg:gap-6 relative z-10">
        {/* #2 on the left */}
        {topMasks[1] && (
          <div className="flex flex-col items-center">
            <div className="relative w-16 md:w-24 md:h-24 h-16 mb-3 rounded-xl bg-white/40 backdrop-blur-sm p-1">
              <ColoredMask
                maskId={topMasks[1].mask_id}
                color={topMasks[1].equipped_color}
                className="w-full h-full"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-600">#2</div>
              <div className="text-xs text-slate-600 font-semibold truncate w-28">
                {topMasks[1].name}
              </div>
              <div className="text-xs text-slate-500 font-light">
                Lvl {topMasks[1].level}
              </div>
            </div>
          </div>
        )}

        {/* #1 in the center (tallest) */}
        {topMasks[0] && (
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 p-1.5">
              <ColoredMask
                maskId={topMasks[0].mask_id}
                color={topMasks[0].equipped_color}
                className="w-full h-full"
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-amber-600 flex items-center justify-center gap-1.5 mb-1">
                <Crown size={28} className="text-amber-600" />
                #1
              </div>
              <div className="text-sm text-slate-700 truncate font-bold">
                {topMasks[0].name}
              </div>
              <div className="text-sm text-slate-500 font-light">
                Lvl {topMasks[0].level}
              </div>
            </div>
          </div>
        )}

        {/* #3 on the right */}
        {topMasks[2] && (
          <div className="flex flex-col items-center">
            <div className="relative w-16 md:w-24 md:h-24 h-16 mb-3 rounded-xl bg-white/40 backdrop-blur-sm p-1">
              <ColoredMask
                maskId={topMasks[2].mask_id}
                color={topMasks[2].equipped_color}
                className="w-full h-full"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-600">#3</div>
              <div className="text-xs text-slate-600 font-semibold truncate w-28">
                {topMasks[2].name}
              </div>
              <div className="text-xs text-slate-500 font-light">
                Lvl {topMasks[2].level}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
