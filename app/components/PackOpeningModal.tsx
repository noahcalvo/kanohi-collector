"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { DrawResultItem, EquipSlot, OpenResult } from "../../lib/types";
import { PackRevealCard } from "./PackRevealCard";

export type PackOverlayStage = "idle" | "shaking" | "waiting" | "revealing_first" | "revealing_second" | "revealing_both" | "done" | "error";

export function PackOpeningModal(props: {
  open: boolean;
  stage: PackOverlayStage;
  results: OpenResult | null;
  revealedCount: number;
  toasts: Array<{ id: string; message: string }>;
  onEquip?: (maskId: string, slot: EquipSlot) => void;
  equipping?: string | null;
  onClose: () => void;
  onAdvance?: () => void;
}) {
  const { open, stage, results, revealedCount, toasts, onEquip, equipping, onClose, onAdvance } = props;

  if (!open) return null;

  const canClose = stage === "done" || stage === "error";

  const showFirstOnly = stage === "revealing_first";
  const showSecondOnly = stage === "revealing_second";
  const showBoth = stage === "revealing_both" || stage === "done";
  const firstMask = results?.masks?.[0] ?? null;
  const secondMask = results?.masks?.[1] ?? null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pack opening"
      onMouseDown={() => {
        if (canClose) onClose();
      }}
    >
      <div
        className="card w-full max-w-xl relative"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {toasts.length > 0 && (
          <div className="absolute right-6 top-6 z-[210] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="px-3 py-2 rounded-2xl bg-white/90 border border-slate-200/70 shadow-sm backdrop-blur-sm text-sm text-slate-900"
              >
                {t.message}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Free Pack</div>
          </div>
          <button className="button-secondary text-xs" onClick={onClose} disabled={!canClose}>
            Close
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center">
          {!showFirstOnly && !showSecondOnly && !showBoth && (
            <>
              <div
                className={
                  "text-slate-800 transition-all duration-500 ease-out " +
                  (stage === "shaking" ? "animate-chest-shake motion-reduce:animate-none" : "")
                }
              >
                <Image src="/chest.svg" alt="Chest" width={140} height={140} priority />
              </div>

              {stage !== "error" && (stage === "shaking" || stage === "waiting") && (
                <div className="mt-4 text-sm text-slate-600">Hold on…</div>
              )}
            </>
          )}

          {stage === "error" && <div className="mt-6 text-sm text-rose-700">Pack open failed</div>}

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
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: ['#fbbf24', '#f59e0b', '#f97316', '#a78bfa', '#8b5cf6'][Math.floor(Math.random() * 5)],
                            animationDelay: `${Math.random() * 0.3}s`,
                            animationDuration: `${1.2 + Math.random() * 0.6}s`,
                            '--drift': `${(Math.random() - 0.5) * 60}px`
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg animate-pop-in">
                        ✨ New mask added to your collection
                      </div>
                    </div>
                  </>
                )}
                <div className="animate-pop-in">
                  <PackRevealCard
                    item={firstMask}
                    emphasis="focused"
                    visible={true}
                    showFlare={firstMask.is_new}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button className="button-primary" onClick={onAdvance}>
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
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: ['#fbbf24', '#f59e0b', '#f97316', '#a78bfa', '#8b5cf6'][Math.floor(Math.random() * 5)],
                            animationDelay: `${Math.random() * 0.3}s`,
                            animationDuration: `${1.2 + Math.random() * 0.6}s`,
                            '--drift': `${(Math.random() - 0.5) * 60}px`
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg animate-pop-in">
                        ✨ New mask added to your collection
                      </div>
                    </div>
                  </>
                )}
                <div className="animate-pop-in">
                  <PackRevealCard
                    item={secondMask}
                    emphasis="focused"
                    visible={true}
                    showFlare={secondMask.is_new}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button className="button-primary" onClick={onAdvance}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {showBoth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {results?.masks.map((m, idx) => (
                <div key={m.mask_id + m.color} className="animate-pop-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <PackRevealCard
                    item={m}
                    emphasis="focused"
                    visible={true}
                    onEquip={onEquip}
                    equipping={equipping}
                    useFinalState={true}
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
