"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo } from "react";
import { buffPercent } from "../../lib/clientConstants";
import type { EquipSlot, MePayload, StatusPayload } from "../../lib/types";
import { InlineNotice } from "../components/InlineNotice";
import { EquippedMaskCard } from "../components/MaskCards";
import { NakedHead } from "../components/NakedHead";
import { PackOpeningModalLazy } from "../components/PackOpeningModalLazy";
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

// Memoized empty slot card component for better performance
const EmptySlotCard = memo(({ slot }: { slot: "TOA" | "TURAGA" }) => (
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
));

EmptySlotCard.displayName = "EmptySlotCard";

export function HomeClient({
  initialStatus,
  initialMe,
  isGuest,
  tutorialCta,
}: HomeClientProps) {
  const router = useRouter();
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

  const secondsFromServer = currentStatus?.time_to_next_pack ?? currentStatus?.time_to_ready ?? 0;

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
  const combinedError = packOverlayOpen ? null : error ?? equipError ?? changeError;

  const modalActionError = packOverlayOpen ? equipError ?? changeError : null;
  const dismissModalActionError = () => {
    clearEquipError();
    clearChangeError();
  };

  const openPack = useCallback(async () => {
    // Preserve prior behavior: opening a pack clears any existing error.
    clearPackError();
    clearEquipError();
    clearChangeError();
    await openPackInternal();
  }, [clearPackError, clearEquipError, clearChangeError, openPackInternal]);

  const packsAvailable = currentStatus?.stored_packs ?? (currentStatus?.pack_ready ? 1 : 0);
  const packCap = currentStatus?.pack_cap ?? 3;
  const earningPaused = Boolean(currentStatus?.earning_paused);

  const equipAndClear = useCallback(async (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean,
  ) => {
    clearEquipError();
    await equip(maskId, slot, color, transparent);
  }, [clearEquipError, equip]);

  const changeColorAndClear = useCallback(async (maskId: string, color: string) => {
    clearChangeError();
    await changeColor(maskId, color);
  }, [clearChangeError, changeColor]);

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

  const maskBuffBaseValueById = useMemo(
    () =>
      new Map(
        currentMe?.collection?.map(
          (m) => [m.mask_id, m.buff_base_value] as const,
        ) ?? [],
      ),
    [currentMe?.collection],
  );

  const equippedToa =
    currentMe?.equipped.find((m) => m.equipped_slot === "TOA") ?? null;
  const equippedTuraga =
    currentMe?.equipped.find((m) => m.equipped_slot === "TURAGA") ?? null;

  return (
    <div className="">
      <PackOpeningModalLazy
        open={packOverlayOpen}
        stage={packOverlayStage}
        results={results}
        revealedCount={revealedCount}
        packsRemaining={packOverlayStage === "done" ? packsAvailable : 0}
        errorMessage={packError}
        actionErrorMessage={modalActionError}
        onDismissActionError={
          modalActionError ? dismissModalActionError : undefined
        }
        onRetry={openPack}
        retrying={opening}
        onEquip={equipAndClear}
        equipping={equipping}
        onClose={closePackOverlay}
        onOpenNextPack={() => {
          openPack();
        }}
        onExitToCollection={() => {
          closePackOverlay();
          router.push("/collection");
        }}
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
            actionDisabled={statusLoading}
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
            actionDisabled={meLoading}
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
            <Link
              href="/sign-up"
              className="text-slate-900 font-semibold underline text-sm"
            >
              Create Account
            </Link>
          </div>
        )}

        {tutorialCta && (
          <div className="card bg-sky-50 border-sky-200 text-sky-900 flex flex-col items-center">
            <div className="font-semibold text-lg mb-1">Introduction</div>
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

        {!earningPaused && (
          <section className="card">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Next pack
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
        )}

        <section className="flex flex-col items-center gap-3">
          <button
            onClick={openPack}
            disabled={packsAvailable <= 0 || opening || packOverlayOpen}
            className={
              "relative group select-none transition-transform duration-500 ease-out " +
              (packsAvailable > 0 && !opening && !packOverlayOpen
                ? " hover:scale-[1.04] group-active:scale-[0.98]"
                : " opacity-70")
            }
            aria-label="Open pack"
          >
            <div className="relative">
              <Image
                src="/pack/pack.png"
                alt="Pack"
                width={160}
                height={160}
                className="h-auto w-[160px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)] rounded-md shadow-2xl"
                priority
              />

              {packsAvailable > 0 && (
                <div
                  className="absolute -top-[10px] -right-[10px] py-1 px-[10px] rounded-full bg-red-500 text-white text-sm font-bold leading-[20px] text-center shadow-sm"
                  aria-label={`${packsAvailable} packs available`}
                >
                  {packsAvailable}
                </div>
              )}
            </div>
          </button>

          <div className="text-xs text-slate-500">
            Packs:{" "}
            <span className="font-semibold text-slate-700">
              {packsAvailable}
            </span>{" "}
            / {packCap}
            {earningPaused && packsAvailable >= packCap ? (
              <span className="ml-2 text-rose-600 font-semibold">
                Storage full
              </span>
            ) : null}
          </div>
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
                  buffType={
                    maskBuffTypeById.get(equippedToa.mask_id) ?? "VISUAL"
                  }
                  buffBaseValue={
                    maskBuffBaseValueById.get(equippedToa.mask_id) ?? 0
                  }
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
                  rarity={
                    maskRarityById.get(equippedTuraga.mask_id) ?? "COMMON"
                  }
                  transparent={maskTransparentById.get(equippedTuraga.mask_id)}
                  buffType={
                    maskBuffTypeById.get(equippedTuraga.mask_id) ?? "VISUAL"
                  }
                  buffBaseValue={
                    maskBuffBaseValueById.get(equippedTuraga.mask_id) ?? 0
                  }
                  offsetY={maskOffsetYById.get(equippedTuraga.mask_id) ?? 0}
                />
              ) : (
                <EmptySlotCard slot="TURAGA" />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
