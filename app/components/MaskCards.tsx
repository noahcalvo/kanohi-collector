"use client";

import type { EquipSlot } from "../../lib/types";
import type { CollectionMask, DrawResultItem, UserMask } from "../../lib/types";
import { ArtCard } from "./ArtCard";
import { HeroImage } from "./HeroImage";

export function EquippedMaskCard({
  mask,
  displayName,
}: {
  mask: UserMask;
  displayName: string;
}) {
  return (
    <ArtCard
      popoverWidthClass="w-80"
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Equipped
          </div>
          <div className="text-base font-semibold text-slate-900 mt-1">
            {displayName}
          </div>
          <div className="text-xs text-slate-500 mt-1">{mask.mask_id}</div>
          <div className="text-sm text-slate-700 mt-3">
            Level {mask.level} · Essence {mask.essence}
          </div>
          <div className="text-sm text-slate-700 mt-2">
            Unlocked colors:{" "}
            {mask.unlocked_colors.length
              ? mask.unlocked_colors.join(", ")
              : "None"}
          </div>
        </div>
      }
    >
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">
        {mask.equipped_slot}
      </div>
      <div className="mt-4 flex items-center justify-center">
        <HeroImage
          maskId={mask.mask_id}
          alt={displayName}
          color={mask.unlocked_colors[0]}
        />
      </div>
    </ArtCard>
  );
}

export function CollectionMaskCard({
  mask,
  onEquip,
  equipping,
}: {
  mask: CollectionMask;
  onEquip: (maskId: string, slot: EquipSlot) => void;
  equipping: string | null;
}) {
  const equipLabel = (maskId: string, slot: EquipSlot) => `${maskId}-${slot}`;

  return (
    <ArtCard
      badge={
        mask.equipped_slot !== "NONE" ? (
          <div className="absolute right-4 top-4 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70 bg-emerald-50/80 px-2 py-0.5 rounded-full">
            Equipped
          </div>
        ) : null
      }
      popoverWidthClass="w-80"
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Mask
          </div>
          <div className="text-base font-semibold text-slate-900 mt-1">
            {mask.name}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {mask.rarity} · {mask.mask_id}
          </div>

          <div className="text-sm text-slate-700 mt-3">
            Owned {mask.owned_count} · Level {mask.level} · Essence{" "}
            {mask.essence}
          </div>

          <div className="text-sm text-slate-700 mt-2">
            Unlocked colors:{" "}
            {mask.unlocked_colors.length
              ? mask.unlocked_colors.join(", ")
              : "None"}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="button-primary text-xs"
              onClick={() => onEquip(mask.mask_id, "TOA")}
              disabled={equipping === equipLabel(mask.mask_id, "TOA")}
            >
              {equipping === equipLabel(mask.mask_id, "TOA")
                ? "Equipping..."
                : "Equip Toa"}
            </button>
            <button
              className="button-secondary text-xs"
              onClick={() => onEquip(mask.mask_id, "TURAGA")}
              disabled={equipping === equipLabel(mask.mask_id, "TURAGA")}
            >
              {equipping === equipLabel(mask.mask_id, "TURAGA")
                ? "Equipping..."
                : "Equip Turaga"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex items-center justify-center py-6">
        <HeroImage
          maskId={mask.mask_id}
          alt={mask.name}
          color={mask.unlocked_colors[0]}
        />
      </div>
    </ArtCard>
  );
}

export function LastOpenMaskCard({
  item,
  visible,
}: {
  item: DrawResultItem;
  visible: boolean;
}) {
  return (
    <ArtCard
      visible={visible}
      badge={
        item.is_new ? (
          <div className="absolute left-4 top-4 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70 bg-emerald-50/80 px-2 py-0.5 rounded-full">
            New
          </div>
        ) : null
      }
      popoverWidthClass="w-72"
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Mask details
          </div>
          <div className="text-sm text-slate-900 mt-1">{item.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            {item.rarity} · {item.color} · {item.mask_id}
          </div>
          <div className="text-sm text-slate-700 mt-3">
            Essence +{item.essence_awarded} · Level {item.level_before} →{" "}
            {item.level_after}
          </div>
          <div className="text-sm text-slate-700 mt-2">
            Unlocked colors:{" "}
            {item.unlocked_colors.length
              ? item.unlocked_colors.join(", ")
              : "None"}
          </div>
        </div>
      }
    >
      <div className="flex items-center justify-center py-6">
        <HeroImage maskId={item.mask_id} alt={item.name} color={item.color} />
      </div>
    </ArtCard>
  );
}
