"use client";

import type { CollectionMask, EquipSlot, Rarity } from "../../../lib/types";
import { CollectionMaskCard } from "../../components/MaskCards";

export function GenerationSection({
  gen,
  isExpanded,
  onToggle,
  genMasks,
  totalMasksByGenRarity,
  rarityOrder,
  maskNameById,
  onEquip,
  equipping,
  onChangeColor,
  maskColors,
  currentToaEquipped,
  currentTuragaEquipped,
}: {
  gen: number;
  isExpanded: boolean;
  onToggle: () => void;
  genMasks: Map<Rarity, CollectionMask[]>;
  totalMasksByGenRarity: Map<number, Map<Rarity, number>>;
  rarityOrder: Rarity[];
  maskNameById: Map<string, string>;
  onEquip: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean,
  ) => void;
  equipping: string | null;
  onChangeColor: (maskId: string, color: string) => void;
  maskColors: Record<string, string>;
  currentToaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
    offsetY?: number;
  } | null;
  currentTuragaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
    offsetY?: number;
  } | null;
}) {
  const totalCount = Array.from(genMasks.values()).reduce(
    (sum, masks) => sum + masks.length,
    0,
  );
  const totalsByRarity = totalMasksByGenRarity.get(gen);
  const totalAvailableGen = totalsByRarity
    ? Array.from(totalsByRarity.values()).reduce((a, b) => a + b, 0)
    : totalCount;
  const percent = totalAvailableGen
    ? Math.round((totalCount / totalAvailableGen) * 100)
    : 0;

  return (
    <div className="overflow-visible">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 rounded-xl transition-colors flex items-center justify-between text-left hover:bg-white/50 active:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-slate-900">
            Generation {gen}
          </span>
          <span className="text-sm text-slate-600">{percent}% complete</span>
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
        <div className="p-4 space-y-6">
          {rarityOrder.map((rarity) => {
            const masks = genMasks.get(rarity);
            const totalAvailable =
              totalMasksByGenRarity.get(gen)?.get(rarity) || 0;
            const owned = masks?.length || 0;

            if (totalAvailable === 0) return null;

            return (
              <div key={rarity}>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  {rarity} ({owned}/{totalAvailable})
                </h3>
                {owned === 0 ? (
                  <p className="text-slate-400 text-sm italic">
                    No {rarity.toLowerCase()} masks unlocked yet
                  </p>
                ) : masks ? (
                  <div className="-mx-4 px-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-3">
                    {masks.map((m) => (
                      <div
                        key={m.mask_id}
                        className="flex-none w-[260px] md:w-auto"
                      >
                        <CollectionMaskCard
                          mask={{
                            ...m,
                            name: maskNameById.get(m.mask_id) ?? m.name,
                          }}
                          selectedColor={maskColors[m.mask_id]}
                          onEquip={onEquip}
                          equipping={equipping}
                          onChangeColor={onChangeColor}
                          currentToaEquipped={currentToaEquipped}
                          currentTuragaEquipped={currentTuragaEquipped}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
