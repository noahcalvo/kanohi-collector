"use client";

import Image from "next/image";
import { useEffect } from "react";
import { colorToHex } from "../../lib/colors";
import type { EquipSlot, OpenResult } from "../../lib/types";
import { InlineNotice } from "./InlineNotice";
import { PackRevealCard } from "./PackRevealCard";

export type PackOverlayStage =
  | "idle"
  | "shaking"
  | "waiting"
  | "revealing_first"
  | "revealing_second"
  | "revealing_both"
  | "done"
  | "error";

export function PackOpeningModal(props: {
  open: boolean;
  stage: PackOverlayStage;
  results: OpenResult | null;
  revealedCount: number;
  errorMessage?: string | null;
  actionErrorMessage?: string | null;
  onDismissActionError?: () => void;
  onRetry?: () => void;
  retrying?: boolean;
  onEquip?: (
    maskId: string,
    slot: EquipSlot,
    color?: string,
    transparent?: boolean
  ) => void;
  equipping?: string | null;
  onClose: () => void;
  onAdvance?: () => void;
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
    open,
    stage,
    results,
    errorMessage,
    actionErrorMessage,
    onDismissActionError,
    onRetry,
    retrying,
    onEquip,
    equipping,
    onClose,
    onAdvance,
    currentToaEquipped,
    currentTuragaEquipped,
  } = props;

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevHtmlOverflow = html.style.overflow;

    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    // Prevent background scroll (including iOS overscroll) while the modal is open.
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      body.style.paddingRight = prevBodyPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault();

      // If we can advance, do that
      if (stage === "revealing_first" || stage === "revealing_second") {
        onAdvance?.();
      }
      // If we're done or in error state, close
      else if (stage === "done" || stage === "error") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, stage, onAdvance, onClose]);

  if (!open) return null;

  const canClose = stage === "done" || stage === "error";

  const showFirstOnly = stage === "revealing_first";
  const showSecondOnly = stage === "revealing_second";
  const showBoth = stage === "revealing_both" || stage === "done";
  const firstMask = results?.masks?.[0] ?? null;
  const secondMask = results?.masks?.[1] ?? null;

  // Color utilities centralized in lib/colors

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black backdrop-blur-sm overflow-hidden h-[100dvh]"
      role="dialog"
      aria-modal="true"
      aria-label="Pack opening"
      onMouseDown={() => {
        if (canClose) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl relative"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {actionErrorMessage && stage !== "error" && (
          <div className="mb-4">
            <InlineNotice
              tone="error"
              message={actionErrorMessage}
              actionLabel={onDismissActionError ? "Dismiss" : undefined}
              onAction={onDismissActionError}
            />
          </div>
        )}

        {showBoth && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide"></div>
            </div>
            <button
              className="button-secondary text-xs"
              onClick={onClose}
              disabled={!canClose}
            >
              Close
            </button>
          </div>
        )}

        <div className="flex flex-col items-center pb-4">
          {!showFirstOnly && !showSecondOnly && !showBoth && (
            <>
              {stage === "waiting" ? (
                <div className="relative h-[280px] w-[140px] flex flex-col items-center justify-center">
                  <div
                    className="absolute top-0 animate-pack-top-separate"
                    style={{ transformOrigin: "center bottom" }}
                  >
                    <Image
                      src="/pack/pack-top.png"
                      alt="Pack top"
                      width={140}
                      height={140}
                      priority
                    />
                  </div>
                  <div
                    className="absolute top-[140px] animate-pack-bottom-stay"
                    style={{ transformOrigin: "center top" }}
                  >
                    <Image
                      src="/pack/pack-bottom.png"
                      alt="Pack bottom"
                      width={140}
                      height={140}
                      priority
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={
                    "text-slate-200 transition-all duration-500 ease-out transform-gpu will-change-transform " +
                    (stage === "shaking"
                      ? "animate-pack-wiggle motion-reduce:animate-pulse"
                      : "")
                  }
                >
                  <Image
                    src="/pack/pack.png"
                    alt="Pack"
                    width={140}
                    height={140}
                    priority
                  />
                </div>
              )}

              {stage !== "error" &&
                (stage === "shaking" || stage === "waiting") && (
                  <div className="mt-4 text-sm text-slate-300">Hold on…</div>
                )}
            </>
          )}

          {stage === "error" && (
            <div className="mt-6 w-full max-w-md rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <div className="font-semibold">Pack open failed</div>
              <div className="mt-1 text-rose-800/90">
                {errorMessage ?? "Something went wrong."}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                {onRetry && (
                  <button
                    type="button"
                    className="button-primary text-sm"
                    onClick={onRetry}
                    disabled={Boolean(retrying)}
                  >
                    {retrying ? "Retrying…" : "Retry"}
                  </button>
                )}
                <button
                  type="button"
                  className="button-secondary text-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showFirstOnly && firstMask && (
            <div className="w-full max-w-md mx-auto space-y-4">
              <div className="relative">
                {firstMask.is_new && (
                  <>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="particle"
                          style={
                            {
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              background: [
                                "#fbbf24",
                                "#f59e0b",
                                "#f97316",
                                "#a78bfa",
                                "#8b5cf6",
                              ][Math.floor(Math.random() * 5)],
                              animationDelay: `${Math.random() * 0.3}s`,
                              animationDuration: `${
                                1.2 + Math.random() * 0.6
                              }s`,
                              "--drift": `${(Math.random() - 0.5) * 60}px`,
                            } as React.CSSProperties
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
                {firstMask.was_color_new && firstMask.color !== "standard" && (
                  <>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="particle"
                          style={
                            {
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              background: colorToHex(firstMask.color),
                              animationDelay: `${Math.random() * 0.2}s`,
                              animationDuration: `${
                                1.2 + Math.random() * 0.6
                              }s`,
                              "--drift": `${(Math.random() - 0.5) * 60}px`,
                            } as React.CSSProperties
                          }
                        />
                      ))}
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="px-4 py-1.5 rounded-full bg-white/90 border border-sky-200/60 text-sky-700 text-sm font-semibold shadow-sm animate-pop-expand-fade">
                        Color unlocked
                      </div>
                    </div>
                  </>
                )}
                <div className="animate-pop-in">
                  <PackRevealCard
                    item={firstMask}
                    emphasis="focused"
                    visible={true}
                    alreadySeen={false}
                    currentToaEquipped={currentToaEquipped}
                    currentTuragaEquipped={currentTuragaEquipped}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  className="text-slate-300 font-bold animate-pulse"
                  onClick={onAdvance}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {showSecondOnly && secondMask && (
            <div className="w-full max-w-md mx-auto space-y-4">
              <div className="relative">
                {secondMask.is_new && (
                  <>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="particle"
                          style={
                            {
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                              background: [
                                "#fbbf24",
                                "#f59e0b",
                                "#f97316",
                                "#a78bfa",
                                "#8b5cf6",
                              ][Math.floor(Math.random() * 5)],
                              animationDelay: `${Math.random() * 0.3}s`,
                              animationDuration: `${
                                1.2 + Math.random() * 0.6
                              }s`,
                              "--drift": `${(Math.random() - 0.5) * 60}px`,
                            } as React.CSSProperties
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
                {secondMask.was_color_new &&
                  secondMask.color !== "standard" && (
                    <>
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        {[...Array(16)].map((_, i) => (
                          <div
                            key={i}
                            className="particle"
                            style={
                              {
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: colorToHex(secondMask.color),
                                animationDelay: `${Math.random() * 0.2}s`,
                                animationDuration: `${
                                  1.2 + Math.random() * 0.6
                                }s`,
                                "--drift": `${(Math.random() - 0.5) * 60}px`,
                              } as React.CSSProperties
                            }
                          />
                        ))}
                      </div>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="px-4 py-1.5 rounded-full bg-white/90 border border-sky-200/60 text-sky-700 text-sm font-semibold shadow-sm animate-pop-expand-fade">
                          Color unlocked
                        </div>
                      </div>
                    </>
                  )}
                <div className="animate-pop-in">
                  <PackRevealCard
                    item={secondMask}
                    emphasis="focused"
                    visible={true}
                    alreadySeen={false}
                    currentToaEquipped={currentToaEquipped}
                    currentTuragaEquipped={currentTuragaEquipped}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  className="text-slate-300 font-bold animate-pulse"
                  onClick={onAdvance}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {showBoth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {results?.masks.map((m, idx) => (
                <div
                  key={m.mask_id + m.color}
                  className="animate-pop-in"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <PackRevealCard
                    item={m}
                    emphasis="focused"
                    visible={true}
                    alreadySeen={true}
                    onEquip={onEquip}
                    equipping={equipping}
                    useFinalState={true}
                    currentToaEquipped={currentToaEquipped}
                    currentTuragaEquipped={currentTuragaEquipped}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
