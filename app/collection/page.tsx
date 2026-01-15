"use client";

import { useMemo, useState } from "react";
import type { CollectionMask, EquipSlot, Rarity } from "../../lib/types";

import { GenerationSection } from "./components/GenerationSection";
import { CollectionStats } from "./components/CollectionStats";
import { useAllMasks } from "../hooks/useAllMasks";
import { useColorPicker } from "../hooks/useColorPicker";
import { useEquipMask } from "../hooks/useEquipMask";
import { useMe } from "../hooks/useMe";
import FullCollectionSection from "./components/FullCollection";

export default function CollectionPage() {
  const { me, refreshMe } = useMe();
  const { masks: allMasks } = useAllMasks();
  const { equip, equipping, equipError, clearEquipError } = useEquipMask({
    refreshMe,
  });
  const { changeColor, changing, changeError, clearChangeError } =
    useColorPicker({ refreshMe });

  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(
    new Set([1])
  );
  const [isStatsExpanded, setIsStatsExpanded] = useState(true);

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
      new Map(me?.collection?.map((m) => [m.mask_id, m.name] as const) ?? []),
    [me?.collection]
  );

  const currentToaEquipped = useMemo(() => {
    const equipped = me?.equipped.find((e) => e.equipped_slot === "TOA");
    if (!equipped) return null;
    return {
      maskId: equipped.mask_id,
      name: maskNameById.get(equipped.mask_id) ?? equipped.mask_id,
      color: equipped.equipped_color,
      transparent: me?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.transparent,
      offsetY: me?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.offsetY,
    };
  }, [me?.equipped, me?.collection, maskNameById]);

  const currentTuragaEquipped = useMemo(() => {
    const equipped = me?.equipped.find((e) => e.equipped_slot === "TURAGA");
    if (!equipped) return null;
    return {
      maskId: equipped.mask_id,
      name: maskNameById.get(equipped.mask_id) ?? equipped.mask_id,
      color: equipped.equipped_color,
      transparent: me?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.transparent,
      offsetY: me?.collection.find((c) => c.mask_id === equipped.mask_id)
        ?.offsetY,
    };
  }, [me?.equipped, me?.collection, maskNameById]);

  // Group masks by generation, then by rarity
  const masksByGeneration = useMemo(() => {
    if (!me?.collection)
      return new Map<number, Map<Rarity, CollectionMask[]>>();

    const grouped = new Map<number, Map<Rarity, CollectionMask[]>>();

    me.collection.forEach((mask) => {
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
  }, [me?.collection]);

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
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight font-voya-nui">
            Collection
          </h1>
        </div>
      </header>

      <section className="card">
        {me ? (
          me.collection.length === 0 ? (
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

      {me?.collection && (
        <CollectionStats
          collection={me.collection}
          allMasks={allMasks}
          colorAvailability={me?.color_availability}
          isExpanded={isStatsExpanded}
          onToggle={() => setIsStatsExpanded(!isStatsExpanded)}
        />
      )}

      <FullCollectionSection masks={me?.collection ?? []} />
    </div>
  );
}