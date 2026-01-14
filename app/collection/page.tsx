"use client";

import { useMemo, useState } from "react";
import type { CollectionMask, EquipSlot, Rarity } from "../../lib/types";

import { HeroImage } from "../components/HeroImage";
import { CollectionMaskCard } from "../components/MaskCards";
import { useAllMasks } from "../hooks/useAllMasks";
import { useColorPicker } from "../hooks/useColorPicker";
import { useEquipMask } from "../hooks/useEquipMask";
import { useMe } from "../hooks/useMe";

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
        <div className="flex items-center gap-3">
          <FullCollectionToggle />
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
              {sortedGenerations.map((gen) => {
                const isExpanded = expandedGenerations.has(gen);
                const genMasks = masksByGeneration.get(gen)!;
                const totalCount = Array.from(genMasks.values()).reduce(
                  (sum, masks) => sum + masks.length,
                  0
                );
                // Compute total available masks for generation from catalog
                const totalsByRarity = totalMasksByGenRarity.get(gen);
                const totalAvailableGen = totalsByRarity
                  ? Array.from(totalsByRarity.values()).reduce(
                      (a, b) => a + b,
                      0
                    )
                  : totalCount;
                const percent = totalAvailableGen
                  ? Math.round((totalCount / totalAvailableGen) * 100)
                  : 0;

                return (
                  <div key={gen} className="overflow-hidden">
                    <button
                      onClick={() => toggleGeneration(gen)}
                      className="w-full px-4 py-3 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-slate-900">
                          Generation {gen}
                        </span>
                        <span className="text-sm text-slate-600">
                          {percent}% complete
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {masks.map((m, idx) => (
                                    <CollectionMaskCard
                                      key={m.mask_id}
                                      mask={{
                                        ...m,
                                        name:
                                          maskNameById.get(m.mask_id) ?? m.name,
                                      }}
                                      onEquip={equipAndClear}
                                      equipping={equipping}
                                      onChangeColor={changeColorAndClear}
                                      changing={changing}
                                      currentToaEquipped={currentToaEquipped}
                                      currentTuragaEquipped={
                                        currentTuragaEquipped
                                      }
                                      index={idx}
                                    />
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
              })}
            </div>
          )
        ) : (
          <p className="text-slate-500 text-sm mt-3">Loading...</p>
        )}
      </section>

      {(equipError || changeError) && (
        <p className="text-rose-700 text-sm">{equipError || changeError}</p>
      )}

      {/* Optional full collection view: small thumbnails of all unlocked colors */}
      <FullCollectionSection masks={me?.collection ?? []} />
    </div>
  );
}

function FullCollectionToggle() {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="px-4 py-2 rounded-full bg-white/70 hover:bg-white/80 text-slate-900 border border-slate-200/70 shadow-sm transition"
    >
      {open ? "Hide Full Collection" : "View Full Collection"}
    </button>
  );
}

function FullCollectionSection({ masks }: { masks: CollectionMask[] }) {
  const [visible, setVisible] = useState(false);
  // Sync with toggle via a simple event approach could be done; for simplicity keep local toggle here
  return (
    <section className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Full Collection
        </h2>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/80 text-slate-900 border border-slate-200/70 shadow-sm text-sm"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {visible && (
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-4">
          {masks.flatMap((m) =>
            (m.unlocked_colors.length
              ? m.unlocked_colors
              : [m.equipped_color]
            ).map((color) => (
              <div
                key={`${m.mask_id}-${color}`}
                className="flex flex-col items-center gap-2"
              >
                <HeroImage
                  maskId={m.mask_id}
                  alt={m.name}
                  size="sm"
                  color={color}
                  transparent={m.transparent}
                  showBaseHead={false}
                />
                <div className="text-[11px] text-slate-600">{m.name}</div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

