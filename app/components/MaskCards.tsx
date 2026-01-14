"use client";

import { useState } from "react";
import {
  buffPercent,
  getBuffDescription,
  LEVEL_BASE_BY_RARITY,
  MAX_LEVEL_BY_RARITY,
} from "../../lib/clientConstants";
import { colorToHex } from "../../lib/colors";
import type { EquipSlot, Rarity } from "../../lib/types";
import type { CollectionMask, DrawResultItem, UserMask } from "../../lib/types";
import { ArtCard } from "./ArtCard";
import EquipMaskPopup from "./EquipMaskPopup";
import { HeroImage } from "./HeroImage";

// Color utilities centralized in lib/colors

// Available palette by rarity (client-side mirror of engine logic)
function getAvailableColors(rarity: Rarity): string[] {
  if (rarity === "MYTHIC") return ["standard"];
  return ["standard", "red", "blue", "green", "brown", "white", "black"];
}

function InlineColorRow({
  unlockedColors,
  currentColor,
  onSelectColor,
  isChanging,
  maskId,
}: {
  unlockedColors: string[];
  currentColor?: string;
  onSelectColor: (maskId: string, color: string) => void;
  isChanging: boolean;
  maskId: string;
}) {
  return (
    <div className="flex gap-2 items-center">
      {unlockedColors.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(maskId, color)}
          disabled={isChanging}
          className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
            currentColor === color
              ? "border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-1"
              : "border-slate-300 hover:border-slate-500"
          }`}
          style={{ backgroundColor: colorToHex(color) }}
          title={color}
        />
      ))}
    </div>
  );
}

// Level and protodermis display component
function LevelEssenceDisplay({
  level,
  essence,
  rarity,
}: {
  level: number;
  essence: number;
  rarity: Rarity;
}) {
  const maxLevel = MAX_LEVEL_BY_RARITY[rarity];
  const essenceForNextLevel =
    level < maxLevel ? LEVEL_BASE_BY_RARITY[rarity] * level : 0;
  const progress =
    essenceForNextLevel > 0 ? (essence / essenceForNextLevel) * 100 : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Level {level}</span>
        {level < maxLevel && (
          <span className="text-slate-500">
            {essence}/{essenceForNextLevel}
          </span>
        )}
        {level >= maxLevel && (
          <span className="text-emerald-600 font-medium">MAX</span>
        )}
      </div>
      {level < maxLevel && (
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Color selector component with visual circles
function ColorSelector({
  colors,
  currentColor,
  onSelectColor,
  isChanging,
  maskId,
}: {
  colors: string[];
  currentColor: string;
  onSelectColor: (maskId: string, color: string) => void;
  isChanging: boolean;
  maskId: string;
}) {
  if (colors.length === 0) return null;

  return (
    <div className="flex gap-2 items-center">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(maskId, color)}
          disabled={isChanging}
          className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
            currentColor === color
              ? "border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-1"
              : "border-slate-300 hover:border-slate-500"
          }`}
          style={{ backgroundColor: colorToHex(color) }}
          title={color}
        />
      ))}
    </div>
  );
}

export function EquippedMaskCard({
  mask,
  displayName,
  onChangeColor,
  changing,
  showColorPicker = true,
  rarity,
  transparent,
  buffType,
  description,
}: {
  mask: UserMask;
  displayName: string;
  onChangeColor?: (maskId: string, color: string) => void;
  changing?: string | null;
  showColorPicker?: boolean;
  rarity: Rarity;
  transparent?: boolean;
  buffType?: string;
  description?: string;
}) {
  const palette = getAvailableColors(rarity).filter((c) => c !== "standard");
  const lockedColors = palette.filter((c) => !mask.unlocked_colors.includes(c));
  const count = lockedColors.length;

  return (
    <ArtCard
      index={0}
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
            Level {mask.level} · Protodermis {mask.essence}
          </div>
          <div className="text-sm text-slate-700 mt-3">
            Owned {mask.owned_count} · Level {mask.level} · Protodermis{" "}
            {mask.essence}
          </div>

          {buffType && (
            <div className="mt-3 pt-3 border-t border-slate-200/70">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Buff: {buffType.replace("_", " ")}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {getBuffDescription(buffType as any)}
              </div>
            </div>
          )}

          {description && (
            <div className="mt-3 pt-3 border-t border-slate-200/70">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Description
              </div>
              <div className="text-sm text-slate-600 mt-1 italic">
                &quot;{description}&quot;
              </div>
            </div>
          )}

          {showColorPicker && mask.unlocked_colors.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                Select color
              </div>
              <ColorSelector
                colors={mask.unlocked_colors}
                currentColor={mask.equipped_color}
                onSelectColor={onChangeColor || (() => {})}
                isChanging={changing === mask.mask_id}
                maskId={mask.mask_id}
              />
            </div>
          )}
        </div>
      }
    >
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">
        {mask.equipped_slot} {buffPercent(mask.equipped_slot)}
      </div>
      <div className="mt-4 flex items-center justify-center">
        <HeroImage
          maskId={mask.mask_id}
          alt={displayName}
          color={mask.equipped_color}
          transparent={transparent}
          maskOffsetY={-10}
        />
      </div>
      <div className="mt-3 px-2">
        <LevelEssenceDisplay
          level={mask.level}
          essence={mask.essence}
          rarity={rarity}
        />
      </div>
      {count > 0 && (
        <div className="relative h-6 cursor-default text-slate-400">
          +{count}
        </div>
      )}

      {showColorPicker && (
        <div className="mt-3 flex justify-center">
          {mask.unlocked_colors.length > 0 ? (
            <ColorSelector
              colors={mask.unlocked_colors}
              currentColor={mask.equipped_color}
              onSelectColor={onChangeColor || (() => {})}
              isChanging={changing === mask.mask_id}
              maskId={mask.mask_id}
            />
          ) : (
            <div className="h-6" />
          )}
        </div>
      )}
    </ArtCard>
  );
}

export function CollectionMaskCard({
  mask,
  onEquip,
  equipping,
  onChangeColor,
  changing,
  currentToaEquipped,
  currentTuragaEquipped,
  index,
}: {
  mask: CollectionMask;
  onEquip: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => void;
  equipping: string | null;
  onChangeColor?: (maskId: string, color: string) => void;
  changing?: string | null;
  currentToaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
  } | null;
  currentTuragaEquipped?: {
    maskId: string;
    name: string;
    color?: string;
    transparent?: boolean;
  } | null;
  index: number;
}) {
  const [showEquipPopup, setShowEquipPopup] = useState(false);

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
      index={index}
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {mask.rarity}
          </div>
          <div className="text-base font-semibold text-slate-900 mt-1">
            {mask.name}
          </div>
          <div className="text-sm text-slate-700 mt-3">
            Owned: {mask.owned_count}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Buff: {mask.buff_type.replace("_", " ")}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {getBuffDescription(mask.buff_type)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Description
            </div>
            <div className="text-sm text-slate-600 mt-1 italic">
              &quot;{mask.description}&quot;
            </div>
            <div className="text-sm text-slate-600">
              Originally worn by{" "}
              <span className="text-sm text-slate-600 italic">
                {mask.origin}
              </span>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex items-center justify-center py-6">
        <HeroImage
          maskId={mask.mask_id}
          alt={mask.name}
          color={(mask as any).equipped_color || mask.unlocked_colors[0]}
          transparent={mask.transparent}
          showBaseHead={false}
        />
      </div>
      <div className="mt-3 px-3">
        <LevelEssenceDisplay
          level={mask.level}
          essence={mask.essence}
          rarity={mask.rarity}
        />
      </div>
      {/* Inline unlocked color picker with undiscovered indicator */}
      <div className="mt-3 flex justify-center">
        <InlineColorRow
          unlockedColors={mask.unlocked_colors}
          currentColor={(mask as any).equipped_color}
          onSelectColor={onChangeColor || (() => {})}
          isChanging={changing === mask.mask_id}
          maskId={mask.mask_id}
        />
      </div>

      {/* Equip button */}
      <div className="mt-4 relative">
        <button
          type="button"
          className="w-full button-primary text-sm py-2"
          onClick={() => setShowEquipPopup(!showEquipPopup)}
        >
          Equip Mask
        </button>

        {showEquipPopup && (
          <EquipMaskPopup
            item={
              {
                mask_id: mask.mask_id,
                name: mask.name,
                color: (mask as any).equipped_color || mask.unlocked_colors[0],
                transparent: mask.transparent,
              } as DrawResultItem
            }
            equipping={equipping}
            onEquip={onEquip}
            onClose={() => setShowEquipPopup(false)}
            currentToaEquipped={currentToaEquipped}
            currentTuragaEquipped={currentTuragaEquipped}
          />
        )}
      </div>
    </ArtCard>
  );
}