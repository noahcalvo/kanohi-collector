"use client";

import { useMemo, useState } from "react";
import type { CollectionMask, EquipSlot, Rarity, Mask, MePayload } from "../../../lib/types";

import { useColorPicker } from "../../hooks/useColorPicker";
import { useEquipMask } from "../../hooks/useEquipMask";
import { useMe } from "../../hooks/useMe";
import { CollectionStats } from "./CollectionStats";
import FullCollectionSection from "./FullCollection";
import { GenerationSection } from "./GenerationSection";

interface CollectionClientProps {
  initialMe: MePayload;
  allMasks: Mask[];
}

export function CollectionClient({ initialMe, allMasks }: CollectionClientProps) {
  // Use the hook to get real-time updates, but start with server data
  const { me, refreshMe } = useMe();
  const currentMe = me ?? initialMe;

  const { equip, equipping, equipError, clearEquipError } = useEquipMask({
    refreshMe,
  });
  const { changeColor, changing, changeError, clearChangeError } =
    useColorPicker({ refreshMe });

  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(
    new Set([])
  );
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const toggleGeneration = (gen: number) => {
    setExpandedGenerations((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) {
        next.delete(gen);
      } else {
        next.add(gen);
      }
      return next;
    });
  };

  const equipAndClear = async (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => {
    clearEquipError();
    await equip(maskId, slot, color, transparent);
  };

  const changeColorAndClear = async (maskId: string, color: string) => {
    clearChangeError();
    await changeColor(maskId, color);
  };

  const maskNameById = useMemo(
    () =>
      new Map(currentMe?.collection?.map((m) => [m.mask_id, m.name] as const) ?? []),
    [currentMe?.collection]
  );

  const currentToaEquipped = useMemo(() => {
    const equipped = currentMe?.equipped.find((e) => e.equipped_slot === "TOA");
    if (!equipped) return null;
    return {
      maskId: equipped.mask_id,
      name: maskNameById.get(equipped.mask_id) ?? equipped.mask_id,
      color: equipped.equipped_color,
      transparent: currentMe?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.transparent,
      offsetY: currentMe?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.offsetY,
    };
  }, [currentMe?.equipped, currentMe?.collection, maskNameById]);

  const currentTuragaEquipped = useMemo(() => {
    const equipped = currentMe?.equipped.find((e) => e.equipped_slot === "TURAGA");
    if (!equipped) return null;
    return {
      maskId: equipped.mask_id,
      name: maskNameById.get(equipped.mask_id) ?? equipped.mask_id,
      color: equipped.equipped_color,
      transparent: currentMe?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.transparent,
      offsetY: currentMe?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.offsetY,
    };
  }, [currentMe?.equipped, currentMe?.collection, maskNameById]);

  // Group masks by generation, then by rarity
  const masksByGeneration = useMemo(() => {
    if (!currentMe?.collection)
      return new Map<number, Map<Rarity, CollectionMask[]>>();

    const grouped = new Map<number, Map<Rarity, CollectionMask[]>>();

    currentMe.collection.forEach((mask) => {
      const gen = mask.generation;
      if (!grouped.has(gen)) {
        grouped.set(gen, new Map());
      }
      const genGroup = grouped.get(gen)!;

      if (!genGroup.has(mask.rarity)) {
        genGroup.set(mask.rarity, []);
      }
      genGroup.get(mask.rarity)!.push(mask);
    });

    return grouped;
  }, [currentMe?.collection]);

  const sortedGenerations = useMemo(() => {
    return Array.from(masksByGeneration.keys()).sort((a, b) => a - b);
  }, [masksByGeneration]);

  // Count total available masks by generation and rarity
  const totalMasksByGenRarity = useMemo(() => {
    const totals = new Map<number, Map<Rarity, number>>();
    allMasks.forEach((mask) => {
      if (!totals.has(mask.generation)) {
        totals.set(mask.generation, new Map());
      }
      const genMap = totals.get(mask.generation)!;
      genMap.set(mask.base_rarity, (genMap.get(mask.base_rarity) || 0) + 1);
    });
    return totals;
  }, [allMasks]);

  const rarityOrder: Rarity[] = ["MYTHIC", "RARE", "COMMON"];

  return (
    <div className="space-y-6">
      <section className="card">
        {currentMe ? (
          currentMe.collection.length === 0 ? (
            <p className="text-slate-500 text-sm mt-3">
              No masks owned yet. Open a pack to start collecting.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {sortedGenerations.map((gen) => (
                <GenerationSection
                  key={gen}
                  gen={gen}
                  isExpanded={expandedGenerations.has(gen)}
                  onToggle={() => toggleGeneration(gen)}
                  genMasks={masksByGeneration.get(gen)!}
                  totalMasksByGenRarity={totalMasksByGenRarity}
                  rarityOrder={rarityOrder}
                  maskNameById={maskNameById}
                  onEquip={equipAndClear}
                  equipping={equipping}
                  onChangeColor={changeColorAndClear}
                  changing={changing}
                  currentToaEquipped={currentToaEquipped}
                  currentTuragaEquipped={currentTuragaEquipped}
                />
              ))}
            </div>
          )
        ) : (
          <p className="text-slate-500 text-sm mt-3">Loading...</p>
        )}
      </section>

      {(equipError || changeError) && (
        <p className="text-rose-700 text-sm">{equipError || changeError}</p>
      )}

      {currentMe?.collection && (
        <CollectionStats
          collection={currentMe.collection}
          allMasks={allMasks}
          colorAvailability={currentMe?.color_availability}
          isExpanded={isStatsExpanded}
          onToggle={() => setIsStatsExpanded(!isStatsExpanded)}
        />
      )}

      <FullCollectionSection masks={currentMe?.collection ?? []} />
    </div>
  );
}
