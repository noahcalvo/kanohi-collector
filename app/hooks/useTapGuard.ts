"use client";

import { useCallback, useRef } from "react";

type Point = { x: number; y: number };

export function useTapGuard(options?: { thresholdPx?: number }) {
  const thresholdPx = options?.thresholdPx ?? 8;

  const startRef = useRef<Point | null>(null);
  const movedRef = useRef(false);
  const activeRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    activeRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current) return;
      const start = startRef.current;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > thresholdPx) {
        movedRef.current = true;
      }
    },
    [thresholdPx],
  );

  const onPointerCancel = useCallback(() => {
    activeRef.current = false;
    movedRef.current = false;
    startRef.current = null;
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    // On iOS/Safari, a scroll gesture can still emit a click.
    // If we detected movement, treat it as a scroll and swallow the click.
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }

    activeRef.current = false;
    movedRef.current = false;
    startRef.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerCancel,
    onClickCapture,
  };
}
