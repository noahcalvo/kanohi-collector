"use client";

import { useState, type CSSProperties } from "react";
import type { EquipSlot, DrawResultItem } from "../../lib/types";
import EquipMaskPopup from "./EquipMaskPopup";
import { HeroImage } from "./HeroImage";
import { ProtodermisProgressBar } from "./ProtodermisProgressBar";
import SpotlightWrap from "./spotlight";

const MYTHIC_STAR_RAIN = [
  { left: 6, delay: -3.2, dur: 7, size: 10, drift: -8, alpha: 0.7 },
  { left: 12, delay: -18.6, dur: 8, size: 12, drift: 10, alpha: 0.75 },
  { left: 18, delay: -9.4, dur: 6, size: 9, drift: 14, alpha: 0.65 },
  { left: 24, delay: -25.1, dur: 8, size: 13, drift: -16, alpha: 0.8 },
  { left: 29, delay: -13.8, dur: 7, size: 11, drift: 6, alpha: 0.75 },
  { left: 35, delay: -21.7, dur: 8, size: 10, drift: 18, alpha: 0.7 },
  { left: 41, delay: -6.1, dur: 6, size: 14, drift: -10, alpha: 0.85 },
  { left: 46, delay: -16.9, dur: 8, size: 9, drift: 12, alpha: 0.65 },
  { left: 52, delay: -27.4, dur: 7, size: 12, drift: -18, alpha: 0.8 },
  { left: 58, delay: -11.2, dur: 7, size: 10, drift: 8, alpha: 0.7 },
  { left: 63, delay: -23.9, dur: 8, size: 13, drift: 16, alpha: 0.8 },
  { left: 69, delay: -7.7, dur: 6, size: 11, drift: -12, alpha: 0.75 },
  { left: 74, delay: -19.8, dur: 7, size: 9, drift: 10, alpha: 0.65 },
  { left: 79, delay: -14.5, dur: 7, size: 14, drift: -6, alpha: 0.85 },
  { left: 84, delay: -28.8, dur: 8, size: 10, drift: 14, alpha: 0.7 },
  { left: 90, delay: -4.9, dur: 7, size: 12, drift: -14, alpha: 0.75 },
  { left: 95, delay: -22.3, dur: 8, size: 9, drift: 6, alpha: 0.65 },
] as const;

const MYTHIC_STAR_BURST = [
  { dx: -124, dy: -78, delay: -0.2, dur: 2.9, size: 10, alpha: 0.9 },
  { dx: -78, dy: -124, delay: -1.4, dur: 3.4, size: 12, alpha: 0.85 },
  { dx: -14, dy: -146, delay: -2.1, dur: 3.1, size: 9, alpha: 0.9 },
  { dx: 62, dy: -132, delay: -0.8, dur: 3.6, size: 13, alpha: 0.85 },
  { dx: 128, dy: -76, delay: -2.7, dur: 3.2, size: 11, alpha: 0.9 },

  { dx: -146, dy: -10, delay: -1.9, dur: 3.8, size: 10, alpha: 0.8 },
  { dx: 152, dy: -8, delay: -0.6, dur: 3.6, size: 10, alpha: 0.8 },

  { dx: -126, dy: 64, delay: -2.4, dur: 3.9, size: 12, alpha: 0.75 },
  { dx: 130, dy: 66, delay: -1.1, dur: 3.9, size: 12, alpha: 0.75 },
  { dx: -76, dy: 116, delay: -0.9, dur: 3.5, size: 9, alpha: 0.7 },
  { dx: 80, dy: 120, delay: -2.9, dur: 3.5, size: 9, alpha: 0.7 },
  { dx: -10, dy: 136, delay: -1.7, dur: 3.7, size: 10, alpha: 0.7 },

  { dx: -112, dy: -36, delay: -3.1, dur: 3.3, size: 10, alpha: 0.85 },
  { dx: 118, dy: -40, delay: -1.3, dur: 3.3, size: 10, alpha: 0.85 },
  { dx: -58, dy: -86, delay: -2.6, dur: 3.0, size: 11, alpha: 0.8 },
  { dx: 60, dy: -90, delay: -0.4, dur: 3.0, size: 11, alpha: 0.8 },
  { dx: -40, dy: 92, delay: -2.0, dur: 3.4, size: 10, alpha: 0.75 },
  { dx: 44, dy: 96, delay: -0.7, dur: 3.4, size: 10, alpha: 0.75 },
] as const;

function rarityClasses(rarity: DrawResultItem["rarity"]) {
  switch (rarity) {
    case "MYTHIC":
      return {
        ring: "ring-2 ring-emerald-200/70",
        badge: "text-white ",
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
  const showMythicRain = alreadySeen === true && item.rarity === "MYTHIC";
  const showMythicBurst =
    visible === true && alreadySeen === false && item.rarity === "MYTHIC";

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
          ? "opacity-100 translate-y-0 "
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
            : showMythicRain
            ? "bg-white/0 border rounded-3xl border-slate-200/60"
            : "bg-white/70 border rounded-3xl border-slate-200/60 " +
              rarity.ring +
              " " +
              (emphasis === "focused" ? "md:p-8" : "") +
              (!alreadySeen && (item.is_new || item.was_color_new)
                ? " ring-4 ring-emerald-200/70 shadow-lg"
                : ""))
        }
      >
        {showMythicRain && (
          <div className="mythic-star-rain" aria-hidden>
            {MYTHIC_STAR_RAIN.map((s, i) => (
              <span
                key={i}
                className="mythic-star"
                style={
                  {
                    ["--left" as any]: `${s.left}%`,
                    ["--delay" as any]: `${s.delay}s`,
                    ["--dur" as any]: `${s.dur}s`,
                    ["--size" as any]: `${s.size}px`,
                    ["--drift" as any]: `${s.drift}px`,
                    ["--alpha" as any]: `${s.alpha}`,
                  } as CSSProperties
                }
              >
                <span className="mythic-star-inner" />
              </span>
            ))}
          </div>
        )}

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
              (!alreadySeen || showMythicRain ? "text-center " : "") +
              (emphasis === "focused" ? "text-xl " : "text-base ") +
              (alreadySeen && !showMythicRain
                ? " text-slate-900"
                : "text-slate-300")
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
                <div className="animate-pulse-opaque text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-gray-700">
                  New Mask
                </div>
              )}
              {item.was_color_new && item.color !== "standard" && (
                <div className="bg-white text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full">
                  <span className="new-color-text relative z-20 text-shadow-lg/60 font-extrabold contrast-200">
                    Color Unlocked
                  </span>
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

            {showMythicBurst && (
              <div className="mythic-star-burst" aria-hidden>
                {MYTHIC_STAR_BURST.map((s, i) => (
                  <span
                    key={i}
                    className="mythic-burst-star"
                    style={
                      {
                        ["--dx" as any]: `${s.dx}px`,
                        ["--dy" as any]: `${s.dy}px`,
                        ["--delay" as any]: `${s.delay}s`,
                        ["--dur" as any]: `${s.dur}s`,
                        ["--size" as any]: `${s.size}px`,
                        ["--alpha" as any]: `${s.alpha}`,
                      } as CSSProperties
                    }
                  >
                    <span className="mythic-star-inner" />
                  </span>
                ))}
              </div>
            )}

            <SpotlightWrap on={!alreadySeen} className="z-10">
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
            mythicHighlight={showMythicRain}
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
                  above={true}
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
