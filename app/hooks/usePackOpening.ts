"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpenResult } from "../../lib/types";
import type { PackOverlayStage } from "../components/PackOpeningModal";

type ToastItem = {
  id: string;
  message: string;
};

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
  const [packOverlayStage, setPackOverlayStage] = useState<PackOverlayStage>("idle");
  const [packOverlayAnimationDone, setPackOverlayAnimationDone] = useState(false);
  const packOverlayTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const toastTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const [packError, setPackError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message }]);
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
    toastTimeoutsRef.current.push(timeout);
  }, []);

  const closePackOverlay = useCallback(() => {
    const canClose = packOverlayStage === "done" || packOverlayStage === "error";
    if (!canClose) return;
    packOverlayTimeoutsRef.current.forEach(clearTimeout);
    packOverlayTimeoutsRef.current = [];
    toastTimeoutsRef.current.forEach(clearTimeout);
    toastTimeoutsRef.current = [];
    setPackOverlayOpen(false);
    setPackOverlayStage("idle");
    setPackOverlayAnimationDone(false);
  }, [packOverlayStage]);

  const clearPackError = useCallback(() => {
    setPackError(null);
  }, []);

  const advanceToNextStage = useCallback(() => {
    if (packOverlayStage === "revealing_first") {
      setPackOverlayStage("revealing_second");
      const m = results?.masks[1];
      if (m && !m.is_new && m.essence_awarded > 0) pushToast(`+${m.essence_awarded} Essence`);
      if (m && m.level_after > m.level_before) pushToast(`${m.name}: Level ${m.level_after}`);
    } else if (packOverlayStage === "revealing_second") {
      setPackOverlayStage("revealing_both");
    }
  }, [packOverlayStage, pushToast, results]);

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
        const m = results.masks[0];
        if (m && !m.is_new && m.essence_awarded > 0) pushToast(`+${m.essence_awarded} Essence`);
        if (m && m.level_after > m.level_before) pushToast(`${m.name}: Level ${m.level_after}`);
      }, 250),
    );

    packOverlayTimeoutsRef.current.push(...timeouts);
  }, [packOverlayAnimationDone, packOverlayOpen, packOverlayStage, pushToast, results]);

  useEffect(() => {
    if (packOverlayStage === "revealing_both") {
      const timeout = setTimeout(() => {
        setPackOverlayStage("done");
      }, 300);
      packOverlayTimeoutsRef.current.push(timeout);
    }
  }, [packOverlayStage]);

  useEffect(() => {
    const canClose = packOverlayStage === "done" || packOverlayStage === "error";
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
    setToasts([]);

    packOverlayTimeoutsRef.current.push(
      setTimeout(() => {
        setPackOverlayStage("waiting");
      }, 900),
    );
    packOverlayTimeoutsRef.current.push(
      setTimeout(() => {
        setPackOverlayAnimationDone(true);
      }, 1250),
    );

    const res = await fetch("/api/packs/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack_id: "free_daily_v1", client_request_id: crypto.randomUUID() }),
    });

    if (!res.ok) {
      setPackError("Pack open failed");
      setOpening(false);
      setPackOverlayStage("error");
      return;
    }

    const data: OpenResult = await res.json();
    setResults(data);
    setOpening(false);
    refreshStatus();
    refreshMe();
  }, [opening, packReady, refreshMe, refreshStatus]);

  return {
    opening,
    results,
    revealedCount,

    packOverlayOpen,
    packOverlayStage,
    packOverlayAnimationDone,

    packError,
    clearPackError,

    toasts,

    openPack,
    closePackOverlay,
    advanceToNextStage,
  };
}
