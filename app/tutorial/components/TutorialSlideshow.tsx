"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TutorialCopyBlock } from "@/lib/tutorial/copy";

type TutorialSlide = NonNullable<TutorialCopyBlock["slides"]>[number];

type SwipeState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  didSwipe: boolean;
};

function createInitialSwipeState(): SwipeState {
  return {
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    didSwipe: false,
  };
}

function getPointerClientXY(e: React.PointerEvent) {
  return { x: e.clientX, y: e.clientY };
}

const SWIPE_MIN_DISTANCE_PX = 44;
const SWIPE_HORIZONTAL_RATIO = 1.2;
const TAP_MAX_MOVEMENT_PX = 14;

function isInteractiveEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a,button,input,textarea,select,summary,[role='button'],[role='link']",
    ),
  );
}

export function TutorialSlideshow(props: {
  stepKey: string;
  stepLabel: string;
  copy: TutorialCopyBlock;
  reviewMode: boolean;
  error?: string | null;
  busy?: boolean;
  onCompleteRecord: () => void;
}) {
  const busy = props.busy;
  const onCompleteRecord = props.onCompleteRecord;

  // Used to give immediate UX feedback when the last slide advances the server step.
  const [finishingStep, setFinishingStep] = useState(false);

  const slides = useMemo<TutorialSlide[]>(() => {
    const incoming = props.copy.slides ?? [];
    return incoming.length
      ? incoming
      : [{ quote: "", source: "", body: "" } satisfies TutorialSlide];
  }, [props.copy.slides]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    setFinishingStep(false);
  }, [props.stepKey]);

  useEffect(() => {
    if (!props.error) return;
    setFinishingStep(false);
  }, [props.error]);

  const safeIndex = Math.min(index, Math.max(0, slides.length - 1));
  const isLast = safeIndex >= slides.length - 1;
  const current =
    slides[safeIndex] ??
    slides[slides.length - 1] ??
    ({ quote: "", source: "", body: "" } satisfies TutorialSlide);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    if (busy || finishingStep) return;
    if (!isLast) {
      setIndex((i) => Math.min(slides.length - 1, i + 1));
      return;
    }

    setFinishingStep(true);
    onCompleteRecord();
  }, [busy, finishingStep, isLast, onCompleteRecord, slides.length]);

  const [overlaySwipe, setOverlaySwipe] = useState<SwipeState>(() =>
    createInitialSwipeState(),
  );
  const [cardSwipe, setCardSwipe] = useState<SwipeState>(() =>
    createInitialSwipeState(),
  );

  const handleSwipePointerDown = useCallback(
    (
      e: React.PointerEvent,
      setSwipe: React.Dispatch<React.SetStateAction<SwipeState>>,
    ) => {
      const { x, y } = getPointerClientXY(e);

      setSwipe({
        pointerId: e.pointerId,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        didSwipe: false,
      });

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore - pointer capture isn't always available
      }
    },
    [],
  );

  const handleSwipePointerMove = useCallback(
    (
      e: React.PointerEvent,
      swipe: SwipeState,
      setSwipe: React.Dispatch<React.SetStateAction<SwipeState>>,
    ) => {
      if (swipe.pointerId == null || e.pointerId !== swipe.pointerId) return;
      const { x, y } = getPointerClientXY(e);
      setSwipe((prev) => ({ ...prev, lastX: x, lastY: y }));
    },
    [],
  );

  const handleSwipePointerUp = useCallback(
    (
      e: React.PointerEvent,
      swipe: SwipeState,
      setSwipe: React.Dispatch<React.SetStateAction<SwipeState>>,
      behavior: "tap-advances" | "tap-ignored",
    ) => {
      if (swipe.pointerId == null || e.pointerId !== swipe.pointerId) return;
      const dx = swipe.lastX - swipe.startX;
      const dy = swipe.lastY - swipe.startY;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const isHorizontalSwipe =
        absDx >= SWIPE_MIN_DISTANCE_PX &&
        absDx >= absDy * SWIPE_HORIZONTAL_RATIO;

      if (isHorizontalSwipe) {
        setSwipe((prev) => ({ ...prev, didSwipe: true }));
        if (dx < 0) goNext();
        else goBack();
      } else if (behavior === "tap-advances") {
        const isTapLike =
          absDx <= TAP_MAX_MOVEMENT_PX && absDy <= TAP_MAX_MOVEMENT_PX;
        if (isTapLike && !isInteractiveEventTarget(e.target)) goNext();
      }

      setSwipe(createInitialSwipeState());
    },
    [goBack, goNext],
  );

  const handleSwipePointerCancel = useCallback(
    (
      e: React.PointerEvent,
      swipe: SwipeState,
      setSwipe: React.Dispatch<React.SetStateAction<SwipeState>>,
    ) => {
      if (swipe.pointerId == null || e.pointerId !== swipe.pointerId) return;
      setSwipe(createInitialSwipeState());
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingContext =
        tag === "input" ||
        tag === "textarea" ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (isTypingContext) return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        goNext();
        return;
      }

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNext();
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext]);

  const footerCta = isLast
    ? (props.copy.finalCta ?? "Click to continue")
    : "Click to continue";

  const footerHint = isLast
    ? "\u2190 Back / \u2192 Continue"
    : "\u2190 Back / \u2192 Next";

  return (
    <div
      className="fixed inset-0 z-50 h-[100dvh] w-[100dvw] select-none"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => handleSwipePointerDown(e, setOverlaySwipe)}
      onPointerMove={(e) =>
        handleSwipePointerMove(e, overlaySwipe, setOverlaySwipe)
      }
      onPointerUp={(e) =>
        handleSwipePointerUp(e, overlaySwipe, setOverlaySwipe, "tap-advances")
      }
      onPointerCancel={(e) =>
        handleSwipePointerCancel(e, overlaySwipe, setOverlaySwipe)
      }
      aria-label="Tutorial slideshow"
    >
      <div className="relative flex h-full w-full flex-col px-5 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-12">
        <div className="mx-auto grid h-full w-full max-w-2xl grid-rows-[auto,minmax(0,1fr),auto]">
          <header className="space-y-1 flex flex-col items-center md:block">
            <div className="text-xs uppercase tracking-widest text-slate-300/70">
              Tutorial • {props.stepLabel}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white text-center md:text-left">
              {props.copy.heading}
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

            {props.error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
                {props.error}
              </div>
            ) : null}
          </header>

          <div className="min-h-0 flex items-center py-6">
            <div className="relative min-h-0 w-full max-h-[calc(100dvh-220px)] overflow-y-scroll">
              <AnimatePresence mode="wait">
                <motion.div
                  key={safeIndex}
                  initial={{
                    opacity: 0,
                    y: 18,
                    filter: "blur(6px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: -12,
                    filter: "blur(8px)",
                  }}
                  transition={{
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className="relative w-full max-h-full overflow-auto overscroll-contain rounded-3xl p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-9"
                  style={{ touchAction: "pan-y" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handleSwipePointerDown(e, setCardSwipe);
                  }}
                  onPointerMove={(e) => {
                    e.stopPropagation();
                    handleSwipePointerMove(e, cardSwipe, setCardSwipe);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    handleSwipePointerUp(
                      e,
                      cardSwipe,
                      setCardSwipe,
                      "tap-advances",
                    );
                  }}
                  onPointerCancel={(e) => {
                    e.stopPropagation();
                    handleSwipePointerCancel(e, cardSwipe, setCardSwipe);
                  }}
                >
                  <div className="space-y-6">
                    <figure className="space-y-4">
                      <motion.blockquote
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.8 }}
                        className="tutorial-drift text-lg italic tracking-wide text-slate-100"
                      >
                        “{current.quote}”
                      </motion.blockquote>

                      <figcaption className="text-xs text-slate-300/70">
                        {current.source}
                      </figcaption>
                    </figure>

                    {current.body ? (
                      <div className="border-t border-white/10 pt-6">
                        <div
                          className="text-lg leading-relaxed text-slate-100/60 [&_p]:mb-3 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={{ __html: current.body }}
                        />
                      </div>
                    ) : null}
                  </div>

                  {(busy || finishingStep) && isLast ? (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl bg-black/25 backdrop-blur-[1px] flex items-center justify-center"
                      aria-hidden
                    >
                      <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-3 text-sm text-white/90">
                        <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                        <div className="font-medium tracking-tight">
                          Continuing…
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
              {current.imagesrc && (
                <div
                  className={`gap-x-2 p-4 ${
                    current.imageFill
                      ? "flex flex-col"
                      : "flex flex-row items-start"
                  }`}
                >
                  {current.imageFill ? (
                    // FULL-WIDTH IMAGE (fill)
                    <div className="relative w-full aspect-[3/1]">
                      <Image
                        src={current.imagesrc}
                        alt={current.imageDescription ?? current.imagesrc}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    // SIDE-BY-SIDE IMAGE (fixed size)
                    <Image
                      src={current.imagesrc}
                      alt={current.imageDescription ?? current.imagesrc}
                      width={128}
                      height={128}
                      sizes="128px"
                      className="object-contain shrink-0"
                    />
                  )}{" "}
                  {current.imageDescription && (
                    <div
                      className="text-white/70 text-sm gap-y-4 flex flex-col max-w-sm text-pretty p-2"
                      dangerouslySetInnerHTML={{
                        __html: current.imageDescription,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-y-4 md:flex-row items-center justify-between text-xs text-slate-300/70">
            <div>
              {Array.from({ length: slides.length }).map((_, i) => (
                <span
                  key={i}
                  className={
                    "inline-block h-1.5 w-1.5 rounded-full mr-1.5 " +
                    (i === safeIndex ? "bg-white/70" : "bg-white/20")
                  }
                />
              ))}
            </div>
            <div
              className={busy || finishingStep ? "opacity-80" : "animate-pulse"}
            >
              {busy || finishingStep ? "Continuing…" : footerCta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
