"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColoredMaskWithGlow } from "@/app/components/ColoredMaskWithGlow";
import { PackOpeningModal } from "@/app/components/PackOpeningModal";
import type { PackOverlayStage } from "@/app/components/PackOpeningModal";
import { TutorialSlideshow } from "@/app/tutorial/components/TutorialSlideshow";
import type { TutorialStep } from "@/lib/tutorial/constants";
import { TUTORIAL_COPY } from "@/lib/tutorial/copy";
import {
  getStarterMaskRenderInfo,
  isStarterMaskId,
  STARTER_MASK_IDS,
} from "@/lib/tutorial/starterMasks";
import type { OpenResult } from "@/lib/types";

type ProgressResponse = {
  user_id: string;
  is_guest: boolean;
  tutorial_key: string;

  current_step: TutorialStep;
  effective_step: TutorialStep;
  review_mode: boolean;

  completed_at: string | null;
  rare_mask_granted_at: string | null;
  rare_mask_mask_id: string | null;
  starter_pack_granted_at: string | null;
  starter_pack_opened_at: string | null;
  starter_pack_client_request_id: string | null;
  account_prompt_shown_at: string | null;

  starter_mask_ids: string[];
};

export default function TutorialPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  // Pack opening overlay (reusing existing modal)
  const [packOverlayOpen, setPackOverlayOpen] = useState(false);
  const [packOverlayStage, setPackOverlayStage] =
    useState<PackOverlayStage>("idle");
  const [packOverlayAnimationDone, setPackOverlayAnimationDone] =
    useState(false);
  const [packResults, setPackResults] = useState<OpenResult | null>(null);
  const packOverlayTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>(
    [],
  );

  const effectiveStep = progress?.effective_step ?? "INTRO_BIONICLE";
  const isGuest = Boolean(progress?.is_guest);
  const reviewMode = Boolean(progress?.review_mode);

  const didCompleteRef = useRef(false);

  const refresh = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/tutorial/progress", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      setLoading(false);
      setError("Failed to load tutorial");
      return;
    }
    const data: ProgressResponse = await res.json();
    setProgress(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (effectiveStep !== "COMPLETE_REDIRECT") return;
    if (didCompleteRef.current) return;
    didCompleteRef.current = true;

    (async () => {
      try {
        await fetch("/api/tutorial/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } finally {
        router.replace("/");
      }
    })();
  }, [effectiveStep, router]);

  const advance = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/tutorial/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError("Could not advance tutorial");
      return;
    }
    await refresh();
  }, [refresh]);

  const [advancingIntro, setAdvancingIntro] = useState(false);

  const advanceIntroRecord = useCallback(async () => {
    if (advancingIntro) return;
    setAdvancingIntro(true);
    try {
      await advance();
    } finally {
      setAdvancingIntro(false);
    }
  }, [advance, advancingIntro]);

  const claimMask = useCallback(
    async (maskId: string) => {
      setError(null);
      const res = await fetch("/api/tutorial/claim-rare-mask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection: { maskId } }),
      });
      if (!res.ok) {
        setError("Could not claim mask");
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const grantStarterPack = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/tutorial/grant-starter-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError("Could not grant starter pack");
      return;
    }
    await refresh();
  }, [refresh]);

  const closePackOverlay = useCallback(() => {
    const canClose = packOverlayStage === "done" || packOverlayStage === "error";
    if (!canClose) return;
    packOverlayTimeoutsRef.current.forEach(clearTimeout);
    packOverlayTimeoutsRef.current = [];
    setPackOverlayOpen(false);
    setPackOverlayStage("idle");
    setPackOverlayAnimationDone(false);
  }, [packOverlayStage]);

  const advancePackOverlay = useCallback(() => {
    if (packOverlayStage === "revealing_first") setPackOverlayStage("revealing_second");
    else if (packOverlayStage === "revealing_second")
      setPackOverlayStage("revealing_both");
  }, [packOverlayStage]);

  useEffect(() => {
    if (packOverlayStage === "revealing_both") {
      const t = setTimeout(() => setPackOverlayStage("done"), 300);
      packOverlayTimeoutsRef.current.push(t);
    }
  }, [packOverlayStage]);

  useEffect(() => {
    if (!packOverlayOpen) return;
    if (!packOverlayAnimationDone) return;
    if (!packResults) return;
    if (packOverlayStage !== "waiting") return;
    const t = setTimeout(() => setPackOverlayStage("revealing_first"), 250);
    packOverlayTimeoutsRef.current.push(t);
  }, [packOverlayAnimationDone, packOverlayOpen, packOverlayStage, packResults]);

  const openStarterPack = useCallback(async () => {
    // Ensure pack was granted first.
    if (!progress?.starter_pack_granted_at) {
      await grantStarterPack();
    }

    // Reset overlay.
    packOverlayTimeoutsRef.current.forEach(clearTimeout);
    packOverlayTimeoutsRef.current = [];
    setPackResults(null);

    setPackOverlayOpen(true);
    setPackOverlayStage("shaking");
    setPackOverlayAnimationDone(false);

    packOverlayTimeoutsRef.current.push(
      setTimeout(() => setPackOverlayStage("waiting"), 900),
    );
    packOverlayTimeoutsRef.current.push(
      setTimeout(() => setPackOverlayAnimationDone(true), 1250),
    );

    const res = await fetch("/api/tutorial/open-starter-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      setPackOverlayStage("error");
      setError("Starter pack open failed");
      return;
    }

    const data: { opened: boolean; results: OpenResult | null } =
      await res.json();
    if (!data.opened || !data.results) {
      // Review mode: nothing to show.
      closePackOverlay();
      await advance();
      return;
    }
    setPackResults(data.results);
    await refresh();
  }, [advance, closePackOverlay, grantStarterPack, progress, refresh]);

  const starterMaskIds = useMemo(
    () => progress?.starter_mask_ids ?? STARTER_MASK_IDS,
    [progress?.starter_mask_ids],
  );

  if (loading) {
    return (
      <main className="fixed inset-0 z-[1000] bg-black text-slate-100 flex items-center justify-center p-8">
        <div className="text-slate-200/80 animate-pulse">Loading tutorial…</div>
      </main>
    );
  }

  if (
    effectiveStep === "INTRO_BIONICLE" ||
    effectiveStep === "INTRO_MASKS_PURPOSE" ||
    effectiveStep === "INTRO_GAME_USAGE"
  ) {
    return (
      <main className="fixed inset-0 z-[1000] bg-black text-slate-100">
        <TutorialSlideshow
          stepKey={effectiveStep}
          stepLabel={effectiveStep.replaceAll("_", " ")}
          copy={TUTORIAL_COPY[effectiveStep]}
          reviewMode={reviewMode}
          error={error}
          busy={advancingIntro}
          onCompleteRecord={advanceIntroRecord}
        />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[1000] bg-black text-slate-100 px-6 py-10 sm:py-14 overflow-y-auto">
      <PackOpeningModal
        open={packOverlayOpen}
        stage={packOverlayStage}
        results={packResults}
        revealedCount={0}
        onClose={closePackOverlay}
        onAdvance={advancePackOverlay}
      />

      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <div className="text-xs text-slate-300/70 uppercase tracking-widest">
            Tutorial • Bionicle Origins
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Bionicle Origins
          </h1>
          {reviewMode && (
            <div className="text-sm text-slate-200/75">
              Welcome back. This is a non-rewarding review run.
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-950/40 text-rose-100 p-4">
            {error}
          </div>
        )}

        {effectiveStep === "CHOOSE_RARE_MASK" && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
            <div>
              <div className="text-xs text-slate-300/70 uppercase tracking-widest">
                Choose your starter mask
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Claim a Great Mask (Rare)
              </h2>
              <div className="text-sm text-slate-200/75 mt-1">
                Pick one of the original six Great Masks, in its original color.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {starterMaskIds.map((maskId) => {
                if (!isStarterMaskId(maskId)) return null;
                const info = getStarterMaskRenderInfo(maskId);
                return (
                  <button
                    key={maskId}
                    className={
                      "rounded-2xl border p-4 text-left transition bg-black/30 backdrop-blur-sm shadow-sm " +
                      (reviewMode
                        ? "border-white/10 opacity-60 cursor-not-allowed"
                        : "border-white/10 hover:border-white/20")
                    }
                    disabled={reviewMode}
                    onClick={() => claimMask(maskId)}
                  >
                    <div className="flex items-center gap-4">
                      <ColoredMaskWithGlow
                        maskId={maskId}
                        color={info.originalColor}
                        transparent={info.transparent}
                        className="w-16 h-16"
                        alt={`${info.name} mask`}
                      />

                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {info.name}
                        </div>
                        <div className="text-sm text-slate-200/75">
                          Original color: {info.originalColor}
                          {info.origin ? ` • ${info.origin}` : ""}
                        </div>
                      </div>

                      {!reviewMode && (
                        <div className="text-xs text-slate-300/70">Select</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {reviewMode && (
              <div className="text-sm text-slate-200/75">
                Tutorial already completed — masks are shown as examples.
              </div>
            )}
          </section>
        )}

        {effectiveStep === "OPEN_STARTER_PACK" && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
            <div>
              <div className="text-xs text-slate-300/70 uppercase tracking-widest">
                Starter pack
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Open your first pack
              </h2>
              <div className="text-sm text-slate-200/75 mt-1">
                This pack is seeded with commons only.
              </div>
            </div>

            {reviewMode ? (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-200/75">
                  Review run — no pack will be created.
                </div>
                <button className="button-primary" onClick={advance}>
                  Continue
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="text-sm text-slate-200/75">
                  {progress?.starter_pack_opened_at
                    ? "Already opened."
                    : progress?.starter_pack_granted_at
                      ? "Ready when you are."
                      : "Preparing your pack…"}
                </div>
                <div className="flex gap-2">
                  {!progress?.starter_pack_granted_at && (
                    <button
                      className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      onClick={grantStarterPack}
                    >
                      Grant pack
                    </button>
                  )}
                  {!progress?.starter_pack_opened_at && (
                    <button
                      className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      onClick={openStarterPack}
                    >
                      Open pack
                    </button>
                  )}
                  {progress?.starter_pack_opened_at && (
                    <button
                      className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      onClick={advance}
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {effectiveStep === "ACCOUNT_PROMPT" && isGuest && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
            <div>
              <div className="text-xs text-slate-300/70 uppercase tracking-widest">
                Keep your collection
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white mt-1">
                Create an account?
              </h2>
              <div className="text-sm text-slate-200/75 mt-1">
                Creating an account ties your progress to you, not this device.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                onClick={advance}
              >
                Not now
              </button>
              <Link
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-center"
                href="/sign-up?redirect_url=/api/upgrade-guest"
              >
                Create account
              </Link>
            </div>
          </section>
        )}

        {effectiveStep === "ACCOUNT_PROMPT" && !isGuest && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                All set.
              </h2>
              <div className="text-sm text-slate-200/75">
                You’re signed in, so we’ll skip account setup.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                onClick={advance}
              >
                Continue
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
