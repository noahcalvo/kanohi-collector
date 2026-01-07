"use client";

import { useMemo } from "react";
import type { EquipSlot } from "../lib/types";
import { ArtCard } from "./components/ArtCard";
import { EquippedMaskCard } from "./components/MaskCards";
import { PackOpeningModal } from "./components/PackOpeningModal";
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

    toasts,

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
  const combinedError = error ?? equipError;

  const openPack = async () => {
    // Preserve prior behavior: opening a pack clears any existing error.
    clearPackError();
    clearEquipError();
    await openPackInternal();
  };

  const equipAndClear = async (maskId: string, slot: EquipSlot) => {
    clearEquipError();
    await equip(maskId, slot);
  };

  const maskNameById = useMemo(
    () =>
      new Map(me?.collection?.map((m) => [m.mask_id, m.name] as const) ?? []),
    [me?.collection]
  );

  const equippedToa =
    me?.equipped.find((m) => m.equipped_slot === "TOA") ?? null;
  const equippedTuraga =
    me?.equipped.find((m) => m.equipped_slot === "TURAGA") ?? null;

  const EmptySlotCard = ({ slot }: { slot: "TOA" | "TURAGA" }) => (
    <ArtCard
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
        {slot}
      </div>
      <div className="mt-6 flex items-center justify-center py-10 text-sm text-slate-500">
        Empty
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
        toasts={toasts}
        onEquip={equipAndClear}
        equipping={equipping}
        onClose={closePackOverlay}
        onAdvance={advanceToNextStage}
      />

      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Kanohi Collector
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Open packs, collect masks, and equip Toa/Turaga.
          </p>
        </div>
        {me && <div className="text-sm text-slate-600">{me.user.username}</div>}
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
        <div className="text-sm text-slate-600">
          {status
            ? status.pack_ready
              ? "Free pack available"
              : "Not ready yet"
            : "Checking pack timer…"}
        </div>
      </section>

      {me && (
        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Equipped
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Toa slot (100%) and Turaga slot (50%).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {equippedToa ? (
              <EquippedMaskCard
                key={equippedToa.mask_id}
                mask={equippedToa}
                displayName={
                  maskNameById.get(equippedToa.mask_id) ?? equippedToa.mask_id
                }
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
