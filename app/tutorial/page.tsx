"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InlineNotice } from "@/app/components/InlineNotice";
import { PackOpeningModal } from "@/app/components/PackOpeningModal";
import type { PackOverlayStage } from "@/app/components/PackOpeningModal";
import { formatApiErrorMessage } from "@/app/lib/errors";
import { fetchJson } from "@/app/lib/fetchJson";
import { ClaimGreatMaskSection } from "@/app/tutorial/components/ClaimGreatMaskSection";
import { CreateAccountSection } from "@/app/tutorial/components/CreateAccountSection";
import { OpenStarterPackSection } from "@/app/tutorial/components/OpenStarterPackSection";
import { TutorialSlideshow } from "@/app/tutorial/components/TutorialSlideshow";
import type { TutorialStep } from "@/lib/tutorial/constants";
import { TUTORIAL_COPY } from "@/lib/tutorial/copy";
import { STARTER_MASK_IDS } from "@/lib/tutorial/starterMasks";
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
  starter_pack_opened_at: string | null;
  starter_pack_client_request_id: string | null;
  account_prompt_shown_at: string | null;

  starter_mask_ids: string[];
};

export default function TutorialPage() {
  const router = useRouter();

  const [leavingToHome, setLeavingToHome] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [screenBusy, setScreenBusy] = useState(false);
  const [openingStarterPack, setOpeningStarterPack] = useState(false);

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
    try {
      const data = await fetchJson<ProgressResponse>("/api/tutorial/progress");
      setProgress(data);
    } catch (err) {
      setError(formatApiErrorMessage(err, "Failed to load tutorial"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (effectiveStep !== "COMPLETE_REDIRECT") return;
    if (didCompleteRef.current) return;
    didCompleteRef.current = true;

    (async () => {
      let target = "/";
      try {
        const data = await fetchJson<{ first_time_completed?: boolean }>(
          "/api/tutorial/complete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
        );
        if (data?.first_time_completed) target = "/?npe=collection-tip";
      } catch {
        // If completion fails, still redirect to home.
      } finally {
        setLeavingToHome(true);
        if (!prefersReducedMotion) {
          await new Promise((r) => setTimeout(r, 320));
        }
        router.replace(target);
      }
    })();
  }, [effectiveStep, prefersReducedMotion, router]);

  const advance = useCallback(async () => {
    if (screenBusy) return;
    setError(null);
    setScreenBusy(true);
    try {
      await fetchJson("/api/tutorial/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await refresh();
    } catch (err) {
      setError(formatApiErrorMessage(err, "Could not advance tutorial"));
    } finally {
      setScreenBusy(false);
    }
  }, [refresh, screenBusy]);

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
    async (maskId: string): Promise<boolean> => {
      setError(null);
      try {
        await fetchJson("/api/tutorial/claim-rare-mask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection: { maskId } }),
        });
        await refresh();
        return true;
      } catch (err) {
        setError(formatApiErrorMessage(err, "Could not claim mask"));
        return false;
      }
    },
    [refresh],
  );

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
    if (packOverlayStage === "revealing_first")
      setPackOverlayStage("revealing_second");
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
    if (packOverlayOpen) return;
    setError(null);
    setOpeningStarterPack(true);

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

    let data: { opened: boolean; results: OpenResult | null };
    try {
      data = await fetchJson("/api/tutorial/open-starter-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      setPackOverlayStage("error");
      setError(formatApiErrorMessage(err, "Starter pack open failed"));
      setOpeningStarterPack(false);
      return;
    }
    if (!data.opened || !data.results) {
      // Review mode: nothing to show.
      closePackOverlay();
      await advance();
      return;
    }
    setPackResults(data.results);
    await refresh();
    setOpeningStarterPack(false);
  }, [advance, closePackOverlay, packOverlayOpen, refresh]);

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
    effectiveStep === "INTRO_MASKS_PURPOSE"
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
    <main className="fixed inset-0 z-[1000] bg-black text-slate-100">
      <div
        aria-hidden
        className={
          "fixed inset-0 z-[2000] pointer-events-none transition-opacity duration-300 " +
          (leavingToHome ? "opacity-100" : "opacity-0")
        }
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100" />
      </div>

      {screenBusy && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-blur-sm bg-black/50">
          <div className="absolute inset-0" />
          <div className="relative mx-auto w-full max-w-sm rounded-3xl p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-white/15 border-t-white/80 animate-spin" />
            <div className="mt-4 text-base font-semibold tracking-tight text-white">
              Updating…
            </div>
          </div>
        </div>
      )}

      <PackOpeningModal
        open={packOverlayOpen}
        stage={packOverlayStage}
        results={packResults}
        revealedCount={0}
        errorMessage={error}
        onClose={closePackOverlay}
        onAdvance={advancePackOverlay}
      />

      <div className="min-h-full flex items-center justify-center px-6 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {error && (
            <InlineNotice
              tone="error"
              message={error}
              actionLabel={screenBusy ? "Retrying…" : "Retry"}
              actionDisabled={screenBusy}
              onAction={() => {
                refresh();
              }}
            />
          )}

          {error && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold underline underline-offset-2 text-slate-200/80 hover:text-slate-50"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {effectiveStep === "CHOOSE_RARE_MASK" && (
            <ClaimGreatMaskSection
              starterMaskIds={starterMaskIds}
              reviewMode={reviewMode}
              advancing={screenBusy}
              onClaimMask={claimMask}
              onAdvance={advance}
            />
          )}

          {effectiveStep === "OPEN_STARTER_PACK" && (
            <OpenStarterPackSection
              reviewMode={reviewMode}
              starterPackOpenedAt={progress?.starter_pack_opened_at}
              advancing={screenBusy}
              opening={openingStarterPack}
              onAdvance={advance}
              onOpenPack={openStarterPack}
            />
          )}

          {effectiveStep === "ACCOUNT_PROMPT" && (
            <CreateAccountSection
              isGuest={isGuest}
              advancing={screenBusy}
              onAdvance={advance}
            />
          )}
        </div>
      </div>
    </main>
  );
}
