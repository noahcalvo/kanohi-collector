"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { buffPercent } from "../../lib/clientConstants";
import type { EquipSlot, MePayload, StatusPayload } from "../../lib/types";
import { InlineNotice } from "../components/InlineNotice";
import { EquippedMaskCard } from "../components/MaskCards";
import { NakedHead } from "../components/NakedHead";
import { PackOpeningModal } from "../components/PackOpeningModal";
import { useColorPicker } from "../hooks/useColorPicker";
import { useEquipMask } from "../hooks/useEquipMask";
import { useMe } from "../hooks/useMe";
import { usePackOpening } from "../hooks/usePackOpening";
import { useStatus } from "../hooks/useStatus";
import { EquippedCard } from "./EquippedCard";
import { TimeToReadyCountdown } from "./TimeToReadyCountdown";

interface HomeClientProps {
  initialStatus: StatusPayload;
  initialMe: MePayload;
  isGuest?: boolean;
  tutorialCta?: "start" | "resume" | null;
}

export function HomeClient({
  initialStatus,
  initialMe,
  isGuest,
  tutorialCta,
}: HomeClientProps) {
  // Use hooks for real-time updates, but start with server data
  const {
    status,
    refreshStatus,
    loading: statusLoading,
    error: statusError,
    clearError: clearStatusError,
  } = useStatus({ initialStatus });
  const {
    me,
    refreshMe,
    loading: meLoading,
    error: meError,
    clearError: clearMeError,
  } = useMe({ initialMe });

  const currentStatus = status ?? initialStatus;
  const currentMe = me ?? initialMe;

  const secondsFromServer = currentStatus?.time_to_ready ?? 0;

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
    packReady: Boolean(currentStatus?.pack_ready),
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
    transparent?: boolean,
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
      new Map(
        currentMe?.collection?.map((m) => [m.mask_id, m.name] as const) ?? [],
      ),
    [currentMe?.collection],
  );

  const maskRarityById = useMemo(
    () =>
      new Map(
        currentMe?.collection?.map((m) => [m.mask_id, m.rarity] as const) ?? [],
      ),
    [currentMe?.collection],
  );

  const maskTransparentById = useMemo(
    () =>
      new Map(
        currentMe?.collection?.map(
          (m) => [m.mask_id, m.transparent] as const,
        ) ?? [],
      ),
    [currentMe?.collection],
  );

  const maskBuffTypeById = useMemo(
    () =>
      new Map(
        currentMe?.collection?.map((m) => [m.mask_id, m.buff_type] as const) ??
          [],
      ),
    [currentMe?.collection],
  );

  const maskOffsetYById = useMemo(
    () =>
      new Map(
        currentMe?.collection?.map(
          (m) => [m.mask_id, m.offsetY ?? 0] as const,
        ) ?? [],
      ),
    [currentMe?.collection],
  );

  const equippedToa =
    currentMe?.equipped.find((m) => m.equipped_slot === "TOA") ?? null;
  const equippedTuraga =
    currentMe?.equipped.find((m) => m.equipped_slot === "TURAGA") ?? null;

  const EmptySlotCard = ({ slot }: { slot: "TOA" | "TURAGA" }) => (
    <EquippedCard
      popover={
        <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {slot} slot
          </div>
          <div className="text-sm text-slate-700 mt-2">Nothing equipped.</div>
          <Link href="/collection" className="text-sm text-slate-700 mt-2">
            Equip a mask from Collection
            <ArrowRight size={16} className="inline-block ml-1 mb-[3px]" />
          </Link>
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
    </EquippedCard>
  );

  return (
    <div className="overflow-hidden">
      <PackOpeningModal
        open={packOverlayOpen}
        stage={packOverlayStage}
        results={results}
        revealedCount={revealedCount}
        errorMessage={packError}
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

      <div className="space-y-6">
      {combinedError && (
        <InlineNotice
          tone="error"
          message={combinedError}
          actionLabel="Dismiss"
          onAction={() => {
            clearPackError();
            clearEquipError();
            clearChangeError();
          }}
        />
      )}

      {statusError && (
        <InlineNotice
          tone="error"
          message={statusError}
          actionLabel={statusLoading ? "Retrying…" : "Retry"}
          onAction={() => {
            clearStatusError();
            refreshStatus();
          }}
        />
      )}

      {meError && (
        <InlineNotice
          tone="error"
          message={meError}
          actionLabel={meLoading ? "Retrying…" : "Retry"}
          onAction={() => {
            clearMeError();
            refreshMe();
          }}
        />
      )}

      {isGuest && (
        <div className="card bg-yellow-50 border-yellow-200 text-yellow-900 flex flex-col items-center">
          <div className="mb-2 text-xs text-yellow-800 text-pretty">
            Your progress is saved locally. Create an account to save your
            collection and play across devices.
          </div>
          <Link href="/sign-up" className="text-slate-900 font-semibold underline text-sm">
            Create Account
          </Link>
        </div>
      )}

      {tutorialCta && (
        <div className="card bg-sky-50 border-sky-200 text-sky-900 flex flex-col items-center">
          <div className="font-semibold text-lg mb-1">
            Introduction
          </div>
          <div className="mb-2 text-sm text-sky-800 text-pretty">
            {tutorialCta === "start"
              ? "Learn how masks work and claim your starter rewards."
              : "Continue the tutorial and claim your starter rewards."}
          </div>
          <Link href="/tutorial" className="button-primary mt-2">
            {tutorialCta === "start" ? "Start Tutorial" : "Resume Tutorial"}
          </Link>
        </div>
      )}

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Pack cooldown
        </h2>
        {currentStatus ? (
          <TimeToReadyCountdown
            seconds={secondsFromServer}
            onReady={refreshStatus}
          />
        ) : (
          <p className="text-slate-500 text-sm mt-3">Loading...</p>
        )}
      </section>

      <section className="flex flex-col items-center gap-3">
        <button
          className="button-primary text-lg px-10 py-4"
          onClick={openPack}
          disabled={!currentStatus?.pack_ready || opening}
        >
          {opening
            ? "Opening..."
            : currentStatus?.pack_ready
              ? "Open Pack"
              : "Not ready"}
        </button>
      </section>

      {currentMe && (
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
                rarity={maskRarityById.get(equippedToa.mask_id) ?? "COMMON"}
                transparent={maskTransparentById.get(equippedToa.mask_id)}
                buffType={maskBuffTypeById.get(equippedToa.mask_id) ?? "VISUAL"}
                offsetY={maskOffsetYById.get(equippedToa.mask_id) ?? 0}
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
                rarity={maskRarityById.get(equippedTuraga.mask_id) ?? "COMMON"}
                transparent={maskTransparentById.get(equippedTuraga.mask_id)}
                buffType={
                  maskBuffTypeById.get(equippedTuraga.mask_id) ?? "VISUAL"
                }
                offsetY={maskOffsetYById.get(equippedTuraga.mask_id) ?? 0}
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
    </div>
  );
}
