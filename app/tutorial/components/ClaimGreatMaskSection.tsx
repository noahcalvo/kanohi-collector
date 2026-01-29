"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ColoredMaskWithGlow } from "@/app/components/ColoredMaskWithGlow";
import {
  getStarterMaskRenderInfo,
  isStarterMaskId,
  type StarterMaskId,
} from "@/lib/tutorial/starterMasks";

function rarityBadgeClassName(rarity: string) {
  switch (rarity) {
    case "COMMON":
      return "border-white/10 bg-white/10 text-slate-100";
    case "RARE":
      return "border-sky-400/30 bg-sky-500/15 text-sky-100";
    case "MYTHIC":
      return "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
    default:
      return "border-white/10 bg-white/10 text-slate-100";
  }
}

export function ClaimGreatMaskSection(props: {
  starterMaskIds: readonly string[];
  reviewMode: boolean;
  advancing?: boolean;
  onClaimMask: (maskId: string) => Promise<boolean>;
  onAdvance: () => void;
}) {
  const [selectedMaskId, setSelectedMaskId] = useState<StarterMaskId | null>(
    null,
  );
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(true);
  const [claiming, setClaiming] = useState(false);

  const selectedInfo = useMemo(() => {
    if (!selectedMaskId) return null;
    return getStarterMaskRenderInfo(selectedMaskId);
  }, [selectedMaskId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (props.reviewMode) {
      setSelectedMaskId(null);
      setClaiming(false);
    }
  }, [props.reviewMode]);

  const busy = claiming || Boolean(props.advancing);

  useEffect(() => {
    if (!selectedMaskId) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setSelectedMaskId(null);
    };
    window.addEventListener("keydown", onKeyDown);

    // Give the dialog a moment to mount before focusing.
    const t = window.setTimeout(() => {
      if (!busy) pickButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, selectedMaskId]);

  return (
    <section className="fixed inset-0 z-50 h-[100dvh] w-[100dvw] select-none">
      <div className="relative flex h-full w-full flex-col px-5 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-12">
        <div className="mx-auto grid h-full w-full max-w-2xl grid-rows-[auto,minmax(0,1fr),auto]">
          <header className="space-y-1 flex flex-col items-center md:block">
            <div className="text-xs uppercase tracking-widest text-slate-300/70">
              Choose your starter mask
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white text-center md:text-left">
              Claim a Great Mask
            </h2>
            {/* {props.copy.subheading ? (
              <div className="text-sm text-slate-200/75">
                {props.copy.subheading}
              </div>
            ) : null} */}

            {props.reviewMode ? (
              <div className="pt-2 text-xs text-slate-300/70">
                Review mode — rewards are not granted.
              </div>
            ) : null}

          </header>

      <div id="contents" className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center">
          {props.starterMaskIds.map((maskId) => {
            if (!isStarterMaskId(maskId)) return null;
            const info = getStarterMaskRenderInfo(maskId);
            return (
              <div
                key={maskId}
                onClick={() => {
                  if (busy) return;
                  setSelectedMaskId(maskId);
                }}
                className={
                  "transition duration-300 ease-in-out " +
                  (busy
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:scale-125")
                }
              >
                <ColoredMaskWithGlow
                  maskId={maskId}
                  color={info.originalColor}
                  transparent={info.transparent}
                  className="w-24 h-24 transition duration-300 ease-in-out animate-pulse-opaque"
                  alt={`${info.name} mask`}
                />
              </div>
            );
          })}
        </div>

      {selectedInfo && !props.reviewMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (claiming) return;
              setSelectedMaskId(null);
            }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="starter-mask-dialog-title"
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md text-white"
          >
            <div className="absolute right-3 top-3">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-100 hover:border-white/20 disabled:opacity-50 disabled:hover:border-white/10"
                disabled={claiming}
                onClick={() => {
                  if (claiming) return;
                  setSelectedMaskId(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-4 pr-14">
              <ColoredMaskWithGlow
                maskId={selectedInfo.maskId}
                color={selectedInfo.originalColor}
                transparent={selectedInfo.transparent}
                className="w-24 h-24"
                alt={`${selectedInfo.name} mask`}
              />
              <div className="min-w-0">
                <h3
                  id="starter-mask-dialog-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  {selectedInfo.name}
                </h3>
                <dl className="mt-2 grid grid-cols-1 items-start gap-y-1 text-sm sm:grid-cols-[auto,1fr] sm:items-center sm:gap-x-3 sm:gap-y-2">
                  <dt className="text-[11px] uppercase tracking-wider text-slate-200/70">
                    Original bearer
                  </dt>
                  <dd className="min-w-0 truncate font-medium text-slate-50">
                    {selectedInfo.origin}
                  </dd>

                  <dt className="text-[11px] uppercase tracking-wider text-slate-200/70">
                    Rarity
                  </dt>
                  <dd className="min-w-0">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${rarityBadgeClassName(
                        selectedInfo.baseRarity,
                      )}`}
                    >
                      {selectedInfo.baseRarity}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-200/75">
              {selectedInfo.description}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                ref={pickButtonRef}
                type="button"
                className="rounded-2xl border border-white/10 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-70"
                disabled={claiming}
                onClick={async () => {
                  if (claiming) return;
                  setClaiming(true);
                  const ok = await props.onClaimMask(selectedInfo.maskId);
                  if (!ok && mountedRef.current) setClaiming(false);
                  // On success, we keep the loading screen up until the parent refresh
                  // advances the tutorial step and unmounts this section.
                }}
              >
                {claiming ? "Claiming…" : "Pick this mask"}
              </button>
            </div>

            {claiming && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                <div className="relative mx-auto w-full max-w-80 rounded-3xl border border-white/10 bg-white/[0.10] p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md">
                  <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/15 border-t-white/80 animate-spin" />
                  <div className="mt-4 text-base font-semibold tracking-tight">
                    Claiming your mask…
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {props.reviewMode && (
        <div className="mt-8 flex flex-col items-center text-center">
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition ease-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 active:scale-[0.99]"
            onClick={props.onAdvance}
            disabled={props.advancing}
          >
            {props.advancing ? "Continuing…" : "Continue"}
          </button>
        </div>
      )}
      </div>
      </div>
      </div>
    </section>
  );
}
