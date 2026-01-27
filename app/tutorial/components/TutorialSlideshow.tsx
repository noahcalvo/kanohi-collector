"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TutorialCopyBlock } from "@/lib/tutorial/copy";

type Slide =
  | { kind: "quote"; text: string; source: string }
  | { kind: "text"; text: string };

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

  const slides = useMemo<Slide[]>(() => {
    const result: Slide[] = [];

    const quotes = props.copy.quotes ?? [];
    const body = props.copy.body ?? [];

    let quoteIndex = 0;
    let bodyIndex = 0;

    while (quoteIndex < quotes.length || bodyIndex < body.length) {
      if (quoteIndex < quotes.length) {
        const q = quotes[quoteIndex];
        result.push({ kind: "quote", text: q.text, source: q.source });
        quoteIndex += 1;
      }

      if (bodyIndex < body.length) {
        const paragraph = body[bodyIndex];
        result.push({ kind: "text", text: paragraph });
        bodyIndex += 1;
      }
    }

    return result.length ? result : [{ kind: "text", text: "" }];
  }, [props.copy.body, props.copy.quotes]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [props.stepKey]);

  const safeIndex = Math.min(index, Math.max(0, slides.length - 1));
  const isLast = safeIndex >= slides.length - 1;
  const current =
    slides[safeIndex] ??
    slides[slides.length - 1] ??
    ({ kind: "text", text: "" } satisfies Slide);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    if (busy) return;
    if (!isLast) {
      setIndex((i) => Math.min(slides.length - 1, i + 1));
      return;
    }
    onCompleteRecord();
  }, [busy, isLast, onCompleteRecord, slides.length]);

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

  const footerHint = isLast ? "\u2190 Back / \u2192 Continue" : "\u2190 Back / \u2192 Next";

  return (
    <div
      className="relative h-full w-full select-none"
      onPointerUp={() => goNext()}
      aria-label="Tutorial slideshow"
    >
      <div className="relative h-full w-full px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center">
          <header className="mb-6 space-y-1 flex flex-col items-center md:block">
            <div className="text-xs uppercase tracking-widest text-slate-300/70">
              Tutorial • {props.stepLabel}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              {props.copy.heading}
            </h2>
            {/* {props.copy.subheading ? (
              <div className="text-sm text-slate-200/75">
                {props.copy.subheading}
              </div>
            ) : null} */}

            {props.reviewMode ? (
              <div className="pt-2 text-xs text-slate-300/70">
                Review mode — progress and rewards are not granted.
              </div>
            ) : null}

            {props.error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
                {props.error}
              </div>
            ) : null}
          </header>

          <div className="relative min-h-[120px]">
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
                className="h-60 rounded-3xl p-7 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-9"
              >
                {current.kind === "quote" ? (
                  <figure className="space-y-4">
                    <motion.blockquote
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="tutorial-drift text-lg italic tracking-wide text-slate-100"
                    >
                      “{current.text}”
                    </motion.blockquote>

                    <figcaption className="text-xs text-slate-300/70">
                      {current.source}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="whitespace-pre-line text-lg leading-relaxed text-slate-100" dangerouslySetInnerHTML={{ __html: current.text }}/>
                )}
              </motion.div>
            </AnimatePresence>
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
            <div className="animate-pulse">
              {footerCta} • {footerHint}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
