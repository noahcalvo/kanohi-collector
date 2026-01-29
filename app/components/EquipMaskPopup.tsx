import { useEffect, useRef } from "react";
import type { EquipSlot, DrawResultItem } from "../../lib/types";
import { HeroImage } from "./HeroImage";

export default function EquipMaskPopup({
  item,
  equipping,
  onEquip,
  onClose,
  currentToaEquipped,
  currentTuragaEquipped,
  above = false,
}: {
  item: DrawResultItem;
  equipping?: string | null;
  onEquip: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => void;
  onClose: () => void;
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
  above?: boolean;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const equipLabel = (maskId: string, slot: EquipSlot) => `${maskId}-${slot}`;

  return (
    <div
      ref={popupRef}
      className={`absolute ${
        above ? "bottom-full mb-2" : "top-full mt-2"
      } left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[252px] z-[80]`}
    >
      <div className="text-xs font-semibold text-slate-700 mb-3 text-center">
        Choose Slot
      </div>
      {/* Clickable options */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="ml-2 text-[10px] uppercase font-semibold text-slate-500">
          Toa
        </div>
        <div className="ml-2 text-[10px] uppercase font-semibold text-slate-500">
          Matoran
        </div>
        <button
          type="button"
          className="group/equip relative overflow-hidden text-center rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 px-2 py-2 transition-colors disabled:opacity-60"
          onClick={() => {
            onEquip(item.mask_id, "TOA", item.color, item.transparent);
            onClose();
          }}
          disabled={equipping === equipLabel(item.mask_id, "TOA")}
        >
          <div className="pointer-events-none absolute inset-0 bg-white/70 backdrop-blur-[2px] opacity-0 group-hover/equip:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="text-slate-900 text-xs font-bold tracking-wide">
              Swap
            </span>
          </div>
          <div className="relative flex justify-center mt-1">
            {currentToaEquipped ? (
              <HeroImage
                maskId={currentToaEquipped.maskId}
                alt={currentToaEquipped.name}
                size="sm"
                color={currentToaEquipped.color}
                transparent={currentToaEquipped.transparent}
                maskOffsetY={(currentToaEquipped.offsetY ?? 0) / 2}
                showBaseHead={true}
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                None
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 font-semibold">
            {equipping === equipLabel(item.mask_id, "TOA")
              ? "Equipping..."
              : currentToaEquipped?.name ?? "None equipped"}
          </div>
        </button>

        <button
          type="button"
          className="group/equip relative overflow-hidden text-center rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 px-3 py-2 transition-colors disabled:opacity-60"
          onClick={() => {
            onEquip(item.mask_id, "TURAGA", item.color, item.transparent);
            onClose();
          }}
          disabled={equipping === equipLabel(item.mask_id, "TURAGA")}
        >
          <div className="pointer-events-none absolute inset-0 bg-white/70 backdrop-blur-[2px] opacity-0 group-hover/equip:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="text-slate-900 text-xs font-bold tracking-wide">
              Swap
            </span>
          </div>
          <div className="relative flex justify-center mt-1">
            {currentTuragaEquipped ? (
              <HeroImage
                maskId={currentTuragaEquipped.maskId}
                alt={currentTuragaEquipped.name}
                size="sm"
                color={currentTuragaEquipped.color}
                transparent={currentTuragaEquipped.transparent}
                maskOffsetY={(currentTuragaEquipped.offsetY ?? 0) / 2}
                showBaseHead={true}
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                None
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 font-semibold">
            {equipping === equipLabel(item.mask_id, "TURAGA")
              ? "Equipping..."
              : currentTuragaEquipped?.name ?? "None equipped"}
          </div>
        </button>
      </div>
    </div>
  );
}
