"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpenResult } from "../../lib/types";
import type { PackOverlayStage } from "../components/PackOpeningModal";
import { ApiError, fetchJson } from "../lib/fetchJson";

export function usePackOpening(args: {
  packReady: boolean;
  refreshStatus: () => void;
  refreshMe: () => void;
}) {
  const { packReady, refreshStatus, refreshMe } = args;

  const [opening, setOpening] = useState(false);
  const [results, setResults] = useState<OpenResult | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const [packOverlayOpen, setPackOverlayOpen] = useState(false);
  const [packOverlayStage, setPackOverlayStage] =
    useState<PackOverlayStage>("idle");
  const [packOverlayAnimationDone, setPackOverlayAnimationDone] =
    useState(false);
  const packOverlayTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>(
    []
  );
  const toastTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const [packError, setPackError] = useState<string | null>(null);

  const closePackOverlay = useCallback(() => {
    const canClose =
      packOverlayStage === "done" || packOverlayStage === "error";
    if (!canClose) return;
    packOverlayTimeoutsRef.current.forEach(clearTimeout);
    packOverlayTimeoutsRef.current = [];
    toastTimeoutsRef.current.forEach(clearTimeout);
    toastTimeoutsRef.current = [];
    setPackOverlayOpen(false);
    setPackOverlayStage("idle");
    setPackOverlayAnimationDone(false);
    // Refresh user data after modal closes to avoid background updates during animation
    refreshMe();
  }, [packOverlayStage, refreshMe]);

  const clearPackError = useCallback(() => {
    setPackError(null);
  }, []);

  const advanceToNextStage = useCallback(() => {
    if (packOverlayStage === "revealing_first") {
      setPackOverlayStage("revealing_second");
      const m = results?.masks[1];
      // Color unlock now uses particles + popup in modal overlay
    } else if (packOverlayStage === "revealing_second") {
      setPackOverlayStage("revealing_both");
    }
  }, [packOverlayStage, results]);

  useEffect(() => {
    if (!results) {
      setRevealedCount(0);
    }
  }, [results]);

  useEffect(() => {
    if (!packOverlayOpen) return;
    if (!packOverlayAnimationDone) return;
    if (!results) return;
    if (packOverlayStage !== "waiting") return;

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    // Auto-show first mask after chest animation
    timeouts.push(
      setTimeout(() => {
        setPackOverlayStage("revealing_first");
      }, 250)
    );

    packOverlayTimeoutsRef.current.push(...timeouts);
  }, [packOverlayAnimationDone, packOverlayOpen, packOverlayStage, results]);

  useEffect(() => {
    if (packOverlayStage === "revealing_both") {
      const timeout = setTimeout(() => {
        setPackOverlayStage("done");
      }, 300);
      packOverlayTimeoutsRef.current.push(timeout);
    }
  }, [packOverlayStage]);

  useEffect(() => {
    const canClose =
      packOverlayStage === "done" || packOverlayStage === "error";
    if (!packOverlayOpen || !canClose) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      closePackOverlay();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePackOverlay, packOverlayOpen, packOverlayStage]);

  useEffect(() => {
    return () => {
      packOverlayTimeoutsRef.current.forEach(clearTimeout);
      packOverlayTimeoutsRef.current = [];
      toastTimeoutsRef.current.forEach(clearTimeout);
      toastTimeoutsRef.current = [];
    };
  }, []);

  const openPack = useCallback(async () => {
    if (!packReady || opening) return;

    // Reset overlay + timers.
    packOverlayTimeoutsRef.current.forEach(clearTimeout);
    packOverlayTimeoutsRef.current = [];
    toastTimeoutsRef.current.forEach(clearTimeout);
    toastTimeoutsRef.current = [];

    setPackOverlayOpen(true);
    setPackOverlayStage("shaking");
    setPackOverlayAnimationDone(false);

    setOpening(true);
    setPackError(null);
    setResults(null);
    setRevealedCount(0);

    packOverlayTimeoutsRef.current.push(
      setTimeout(() => {
        setPackOverlayStage("waiting");
      }, 900)
    );
    packOverlayTimeoutsRef.current.push(
      setTimeout(() => {
        setPackOverlayAnimationDone(true);
      }, 1250)
    );

    try {
      const data = await fetchJson<OpenResult>("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack_id: "free_daily_v1",
          client_request_id: crypto.randomUUID(),
        }),
      });
      setResults(data);
      refreshStatus();
    } catch (err) {
      if (err instanceof ApiError) setPackError(err.message);
      else setPackError(err instanceof Error ? err.message : "Unknown error");
      setPackOverlayStage("error");
    } finally {
      setOpening(false);
    }
    // Don't refresh user data yet - wait until modal closes to avoid background updates
  }, [opening, packReady, refreshStatus]);

  return {
    opening,
    results,
    revealedCount,

    packOverlayOpen,
    packOverlayStage,
    packOverlayAnimationDone,

    packError,
    clearPackError,

    openPack,
    closePackOverlay,
    advanceToNextStage,
  };
}
