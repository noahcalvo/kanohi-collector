"use client";

import { useMemo } from "react";
import { buffPercent } from "../lib/clientConstants";
import type { EquipSlot } from "../lib/types";
import { ArtCard } from "./components/ArtCard";
import { EquippedMaskCard } from "./components/MaskCards";
import { NakedHead } from "./components/NakedHead";
import { PackOpeningModal } from "./components/PackOpeningModal";
import { useColorPicker } from "./hooks/useColorPicker";
import { useEquipMask } from "./hooks/useEquipMask";
import { useMe } from "./hooks/useMe";
import { usePackOpening } from "./hooks/usePackOpening";
import { useStatus } from "./hooks/useStatus";

export default function Home() {
  const { status, refreshStatus } = useStatus();
  const { me, refreshMe } = useMe();

  const {
    opening,
    results,
    revealedCount,

    packOverlayOpen,
    packOverlayStage,

    packError,
    clearPackError,

    openPack: openPackInternal,
    closePackOverlay,
    advanceToNextStage,
  } = usePackOpening({
    packReady: Boolean(status?.pack_ready),
    refreshStatus,
    refreshMe,
  });

  const error = packError;

  const { equip, equipping, equipError, clearEquipError } = useEquipMask({
    refreshMe,
  });
  const { changeColor, changing, changeError, clearChangeError } =
    useColorPicker({
      refreshMe,
    });
  const combinedError = error ?? equipError ?? changeError;

  const openPack = async () => {
    // Preserve prior behavior: opening a pack clears any existing error.
    clearPackError();
    clearEquipError();
    clearChangeError();
    await openPackInternal();
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

  const maskRarityById = useMemo(
    () =>
      new Map(me?.collection?.map((m) => [m.mask_id, m.rarity] as const) ?? []),
    [me?.collection]
  );

  const maskTransparentById = useMemo(
    () =>
      new Map(
        me?.collection?.map((m) => [m.mask_id, m.transparent] as const) ?? []
      ),
    [me?.collection]
  );

  const maskBuffTypeById = useMemo(
    () =>
      new Map(
        me?.collection?.map((m) => [m.mask_id, m.buff_type] as const) ?? []
      ),
    [me?.collection]
  );

  const maskDescriptionById = useMemo(
    () =>
      new Map(
        me?.collection?.map((m) => [m.mask_id, m.description] as const) ?? []
      ),
    [me?.collection]
  );

  const equippedToa =
    me?.equipped.find((m) => m.equipped_slot === "TOA") ?? null;
  const equippedTuraga =
    me?.equipped.find((m) => m.equipped_slot === "TURAGA") ?? null;

  const EmptySlotCard = ({ slot }: { slot: "TOA" | "TURAGA" }) => (
    <ArtCard
      index={0}
      popoverWidthClass="w-72"
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {slot} slot
          </div>
          <div className="text-sm text-slate-700 mt-2">Nothing equipped.</div>
          <div className="text-sm text-slate-700 mt-2">
            Equip a mask from Collection.
          </div>
        </div>
      }
    >
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">
        {slot} <span className="lowercase">{buffPercent(slot)}</span>
      </div>
      <div
        className="mt-4 flex items-center justify-center"
        style={{
          filter:
            "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3)) drop-shadow(0 6px 6px rgba(0, 0, 0, 0.23))",
        }}
      >
        <NakedHead size="md" eyeColor="#FF0000" />
      </div>
      <div className="mt-3 px-2">
        <div className="h-[28px]"></div>
      </div>
    </ArtCard>
  );

  return (
    <div className="space-y-6">
      <PackOpeningModal
        open={packOverlayOpen}
        stage={packOverlayStage}
        results={results}
        revealedCount={revealedCount}
        onEquip={equipAndClear}
        equipping={equipping}
        onClose={closePackOverlay}
        onAdvance={advanceToNextStage}
        currentToaEquipped={
          equippedToa
            ? {
                maskId: equippedToa.mask_id,
                name:
                  maskNameById.get(equippedToa.mask_id) ?? equippedToa.mask_id,
                color: equippedToa.equipped_color,
                transparent: maskTransparentById.get(equippedToa.mask_id),
              }
            : null
        }
        currentTuragaEquipped={
          equippedTuraga
            ? {
                maskId: equippedTuraga.mask_id,
                name:
                  maskNameById.get(equippedTuraga.mask_id) ??
                  equippedTuraga.mask_id,
                color: equippedTuraga.equipped_color,
                transparent: maskTransparentById.get(equippedTuraga.mask_id),
              }
            : null
        }
      />

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 tracking-tight font-voya-nui">
            Kanohi Collector
          </h1>
        </div>
      </header>

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Timers / Pack progress
        </h2>
        {status ? (
          <div className="mt-3 space-y-2">
            <div className="text-sm text-slate-600">
              {status.pack_ready
                ? "Ready now"
                : `Ready in ${status.time_to_ready}s`}
            </div>
            <div className="text-xs text-slate-500">
              Fractional units: {status.fractional_units}
            </div>
            <div className="text-xs text-slate-500">
              Pity counter: {status.pity_counter}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm mt-3">Loading...</p>
        )}
      </section>

      <section className="flex flex-col items-center gap-3">
        <button
          className="button-primary text-lg px-10 py-4"
          onClick={openPack}
          disabled={!status?.pack_ready || opening}
        >
          {opening
            ? "Opening..."
            : status?.pack_ready
            ? "Open Pack"
            : "Not ready"}
        </button>
      </section>

      {me && (
        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Equipped
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {equippedToa ? (
              <EquippedMaskCard
                key={equippedToa.mask_id}
                mask={equippedToa}
                displayName={
                  maskNameById.get(equippedToa.mask_id) ?? equippedToa.mask_id
                }
                onChangeColor={changeColorAndClear}
                changing={changing}
                showColorPicker={false}
                rarity={maskRarityById.get(equippedToa.mask_id) ?? "COMMON"}
                transparent={maskTransparentById.get(equippedToa.mask_id)}
                buffType={maskBuffTypeById.get(equippedToa.mask_id) ?? "VISUAL"}
                description={maskDescriptionById.get(equippedToa.mask_id) ?? ""}
              />
            ) : (
              <EmptySlotCard slot="TOA" />
            )}

            {equippedTuraga ? (
              <EquippedMaskCard
                key={equippedTuraga.mask_id}
                mask={equippedTuraga}
                displayName={
                  maskNameById.get(equippedTuraga.mask_id) ??
                  equippedTuraga.mask_id
                }
                onChangeColor={changeColorAndClear}
                changing={changing}
                showColorPicker={false}
                rarity={maskRarityById.get(equippedTuraga.mask_id) ?? "COMMON"}
                transparent={maskTransparentById.get(equippedTuraga.mask_id)}
                buffType={
                  maskBuffTypeById.get(equippedTuraga.mask_id) ?? "VISUAL"
                }
                description={
                  maskDescriptionById.get(equippedTuraga.mask_id) ?? ""
                }
              />
            ) : (
              <EmptySlotCard slot="TURAGA" />
            )}
          </div>
        </section>
      )}

      {combinedError && (
        <p className="text-rose-700 text-sm">{combinedError}</p>
      )}
    </div>
  );
}
