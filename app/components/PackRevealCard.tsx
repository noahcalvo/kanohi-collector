"use client";

import type { EquipSlot, DrawResultItem } from "../../lib/types";
import { HeroImage } from "./HeroImage";

function rarityClasses(rarity: DrawResultItem["rarity"]) {
  switch (rarity) {
    case "MYTHIC":
      return {
        ring: "ring-2 ring-emerald-200/70",
        badge: "bg-emerald-50/80 text-emerald-700 border-emerald-200/70",
      };
    case "RARE":
      return {
        ring: "ring-2 ring-sky-200/70",
        badge: "bg-sky-50/80 text-sky-700 border-sky-200/70",
      };
    default:
      return {
        ring: "ring-1 ring-slate-200/60",
        badge: "bg-white/60 text-slate-700 border-slate-200/70",
      };
  }
}

function colorDotClass(color: string) {
  const c = color.toLowerCase();
  if (c.includes("blue")) return "bg-sky-400";
  if (c.includes("red")) return "bg-rose-400";
  if (c.includes("green")) return "bg-emerald-400";
  if (c.includes("purple")) return "bg-violet-400";
  if (c.includes("yellow") || c.includes("gold")) return "bg-amber-400";
  if (c.includes("black")) return "bg-slate-700";
  if (c.includes("white")) return "bg-slate-200";
  return "bg-slate-300";
}

export function PackRevealCard(props: {
  item: DrawResultItem;
  emphasis?: "focused" | "grid";
  visible?: boolean;
  showFlare?: boolean;
  onEquip?: (maskId: string, slot: EquipSlot) => void;
  equipping?: string | null;
  onClose?: () => void;
  canClose?: boolean;
  useFinalState?: boolean;
}) {
  const { item, emphasis = "grid", visible = true, showFlare = false, onEquip, equipping, onClose, canClose, useFinalState = false } = props;

  const rarity = rarityClasses(item.rarity);
  const equipLabel = (maskId: string, slot: EquipSlot) => `${maskId}-${slot}`;

  // Use final state when showing side-by-side, individual state when revealing one at a time
  const displayLevel = useFinalState ? item.final_level_after : item.level_after;
  const displayEssence = useFinalState ? item.final_essence_remaining : item.essence_remaining;

  return (
    <div
      className={
        "relative transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none") +
        (showFlare ? " animate-flare-in" : "")
      }
    >
      {showFlare && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-200/40 via-sky-200/30 to-amber-200/40 blur-xl animate-pulse-slow pointer-events-none" />
      )}
      <div
        className={
          "rounded-3xl bg-white/70 border border-slate-200/60 shadow-sm p-6 relative z-10 " +
          rarity.ring +
          " " +
          (emphasis === "focused" ? "md:p-8" : "") +
          (showFlare ? " ring-4 ring-emerald-200/70 shadow-lg" : "")
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={
                  "text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border " +
                  rarity.badge
                }
              >
                {item.rarity}
              </div>
              {item.is_new && (
                <div className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 text-emerald-700">
                  New
                </div>
              )}
            </div>
            <div
              className={
                "mt-2 font-semibold text-slate-900 tracking-tight " +
                (emphasis === "focused" ? "text-xl" : "text-base")
              }
            >
              {item.name}
            </div>
          </div>

          {onClose && (
            <button
              className="button-secondary text-xs"
              onClick={onClose}
              disabled={!canClose}
            >
              Close
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="pack-hero">
            <HeroImage
              maskId={item.mask_id}
              alt={item.name}
              color={item.color}
            />
          </div>
        </div>

        {/* Essence Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold relative inline-block min-w-[60px]">
              {displayLevel > item.level_before ? (
                <>
                  <span
                    className="absolute left-0 top-0"
                    style={{
                      animation: "slide-up-out 0.6s ease-out forwards",
                      animationDelay: "1s",
                    }}
                  >
                    Level {item.level_before}
                  </span>
                  <span
                    className="inline-block"
                    style={{
                      animation: "slide-up-in 0.6s ease-out forwards",
                      animationDelay: "1s",
                      opacity: 0,
                    }}
                  >
                    Level {displayLevel}
                  </span>
                </>
              ) : (
                <span>Level {displayLevel}</span>
              )}
            </span>
            <span>
              {item.essence_awarded > 0
                ? `+${item.essence_awarded} essence`
                : ""}
            </span>
          </div>
          <div className="relative h-2 bg-slate-200/70 rounded-full overflow-hidden">
            {(() => {
              // Calculate progress percentage towards next level
              const baseEssence =
                item.rarity === "COMMON"
                  ? 5
                  : item.rarity === "RARE"
                  ? 25
                  : 200;
              const requiredForNextLevel = baseEssence * displayLevel;
              const progressPercent =
                requiredForNextLevel > 0
                  ? Math.min((displayEssence / requiredForNextLevel) * 100, 100)
                  : 0;

              const leveledUp = displayLevel > item.level_before;

              return (
                <>
                  {item.essence_awarded > 0 && (
                    <>
                      {/* Fill to 100% first if leveled up */}
                      {leveledUp && (
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                          style={
                            {
                              animation: "fill-progress 1s ease-out forwards",
                              "--progress-width": "100%",
                            } as React.CSSProperties
                          }
                        />
                      )}
                      {/* Then show new progress after level up, or just show progress if no level up */}
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                        style={
                          leveledUp
                            ? ({
                                animation:
                                  "fill-progress 0.6s ease-out forwards",
                                animationDelay: "1s",
                                "--progress-width": `${progressPercent}%`,
                                opacity: 0,
                              } as React.CSSProperties)
                            : ({
                                animation: "fill-progress 1s ease-out forwards",
                                "--progress-width": `${progressPercent}%`,
                              } as React.CSSProperties)
                        }
                      />
                    </>
                  )}
                  {item.essence_awarded === 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {onEquip && (
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              className="button-primary text-xs"
              onClick={() => onEquip(item.mask_id, "TOA")}
              disabled={equipping === equipLabel(item.mask_id, "TOA")}
            >
              {equipping === equipLabel(item.mask_id, "TOA")
                ? "Equipping..."
                : "Equip Toa"}
            </button>
            <button
              className="button-secondary text-xs"
              onClick={() => onEquip(item.mask_id, "TURAGA")}
              disabled={equipping === equipLabel(item.mask_id, "TURAGA")}
            >
              {equipping === equipLabel(item.mask_id, "TURAGA")
                ? "Equipping..."
                : "Equip Turaga"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
