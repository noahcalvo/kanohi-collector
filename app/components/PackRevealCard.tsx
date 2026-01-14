"use client";

import { useState } from "react";
import { uiHex } from "../../lib/colors";
import type { EquipSlot, DrawResultItem } from "../../lib/types";
import EquipMaskPopup from "./EquipMaskPopup";
import { HeroImage } from "./HeroImage";
import { ProtodermisProgressBar } from "./ProtodermisProgressBar";
import SpotlightWrap from "./spotlight";

function rarityClasses(rarity: DrawResultItem["rarity"]) {
  switch (rarity) {
    case "MYTHIC":
      return {
        ring: "ring-2 ring-emerald-200/70",
        badge: "text-emerald-700 ",
      };
    case "RARE":
      return {
        ring: "ring-2 ring-sky-200/70",
        badge: "text-sky-700 ",
      };
    default:
      return {
        ring: "ring-1 ring-slate-200/60",
        badge: "text-slate-800 ",
      };
  }
}

// Color mapping and UI adjustments come from lib/colors

export function PackRevealCard(props: {
  item: DrawResultItem;
  emphasis?: "focused" | "grid";
  visible?: boolean;
  alreadySeen?: boolean;
  onEquip?: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => void;
  equipping?: string | null;
  onClose?: () => void;
  canClose?: boolean;
  useFinalState?: boolean;
  testText?: string;
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
}) {
  const {
    item,
    emphasis = "grid",
    visible = true,
    alreadySeen = false,
    onEquip,
    equipping,
    onClose,
    canClose,
    useFinalState = false,
    currentToaEquipped,
    currentTuragaEquipped,
  } = props;

  const [showEquipPopup, setShowEquipPopup] = useState(false);
  const rarity = rarityClasses(item.rarity);

  // Use final state when showing side-by-side, individual state when revealing one at a time
  const displayLevel = useFinalState
    ? item.final_level_after
    : item.level_after;
  const displayEssence = useFinalState
    ? item.final_essence_remaining
    : item.essence_remaining;

  return (
    <div
      className={
        "relative transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none") +
        (!alreadySeen && (item.is_new || item.was_color_new)
          ? " animate-flare-in"
          : "")
      }
    >
      <div
        className={
          "shadow-sm p-6 relative z-10 " +
          (alreadySeen !== true
            ? "bg-white/0 "
            : "bg-white/70 border rounded-3xl border-slate-200/60 " +
              rarity.ring +
              " " +
              (emphasis === "focused" ? "md:p-8" : "") +
              (!alreadySeen && (item.is_new || item.was_color_new)
                ? " ring-4 ring-emerald-200/70 shadow-lg"
                : ""))
        }
      >
        <div
          className={
            "text-[11px] font-semibold uppercase " +
            rarity.badge +
            (!alreadySeen ? "hidden" : "not")
          }
        >
          {item.rarity}
        </div>
        <div
          className={
            "relative flex items-start " +
            (!alreadySeen ? "justify-center" : "justify-between gap-4")
          }
        >
          <div
            className={
              "font-semibold tracking-tight line-clamp-2 min-h-[2.8rem] font-voya-nui " +
              (!alreadySeen ? "text-center " : "") +
              (emphasis === "focused" ? "text-xl " : "text-base ") +
              (alreadySeen ? " text-slate-900" : "text-slate-300")
            }
          >
            {item.name}
          </div>

          {onClose && (
            <button
              className="button-secondary text-xs absolute right-0 top-0"
              onClick={onClose}
              disabled={!canClose}
            >
              Close
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1 min-h-[28px]">
          {alreadySeen === true && (
            <>
              {item.is_new && (
                <div className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-orange-200/70 bg-white/85 text-orange-700">
                  New Mask
                </div>
              )}
              {item.was_color_new && item.color !== "standard" && (
                <div
                  className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border bg-white/85 relative overflow-hidden"
                  style={{
                    borderColor: uiHex(item.color, "pillText"),
                    color: uiHex(item.color, "pillText"),
                  }}
                >
                  <span className="relative z-10">New Color</span>
                  <span className="shimmer-soft rounded-full"></span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-white/70 blur-2xl mix-blend-screen" />
            </div>
            <SpotlightWrap on={!alreadySeen}>
              <div
                className={
                  "pack-hero relative z-10" +
                  (item.is_new || item.was_color_new
                    ? " animate-pulse-opaque"
                    : "")
                }
              >
                <HeroImage
                  maskId={item.mask_id}
                  alt={item.name}
                  color={item.color}
                  transparent={item.transparent}
                />
              </div>
            </SpotlightWrap>
          </div>
        </div>

        {/* Protodermis Progress Bar */}
        {alreadySeen && (
          <ProtodermisProgressBar
            item={item}
            displayLevel={displayLevel}
            displayEssence={displayEssence}
          />
        )}

        <div className="mt-2">
          {!alreadySeen && item.essence_awarded > 0 && (
            <div className="pointer-events-none" aria-hidden>
              <div
                className="animate-rise-fade text-xs text-slate-300 opacity-0 text-center"
                style={{ animationDelay: "1s" }}
              >
                +{item.essence_awarded} protodermis
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start justify-center mt-3">
          {onEquip && item.is_new ? (
            <div className="flex justify-center relative">
              <button
                className="button-primary text-xs px-6"
                onClick={() => setShowEquipPopup(!showEquipPopup)}
                disabled={!!equipping}
              >
                Equip Mask
              </button>

              {/* Equipment Popup */}
              {showEquipPopup && (
                <EquipMaskPopup
                  item={item}
                  equipping={equipping}
                  onEquip={(maskId, slot, color, transparent) =>
                    onEquip?.(maskId, slot, color, transparent)
                  }
                  onClose={() => setShowEquipPopup(false)}
                  currentToaEquipped={currentToaEquipped}
                  currentTuragaEquipped={currentTuragaEquipped}
                />
              )}
            </div>
          ) : (
            <div className="h-[28px]" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
