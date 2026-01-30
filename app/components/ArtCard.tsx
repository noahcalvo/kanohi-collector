"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, a, input, select, textarea, [role='button'], [role='link'], [contenteditable='true']",
    ),
  );
}

export function ArtCard({
  badge,
  popover,
  children,
  visible = true,
}: {
  badge?: ReactNode;
  popover: ReactNode;
  children: ReactNode;
  visible?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [suppressPopover, setSuppressPopover] = useState(false);
  const [touchMode, setTouchMode] = useState(false);
  const [touchPopoverOpen, setTouchPopoverOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);

  const isSuppressedTarget = useCallback((target: EventTarget | null) => {
    const targetNode = target instanceof Node ? target : null;
    // If the pointer/focus is inside the popover content, keep the popover usable.
    // (Buttons/inputs inside the popover are part of its UI.)
    if (targetNode && popoverRef.current?.contains(targetNode)) return false;

    if (!(target instanceof Element)) return false;
    return (
      Boolean(target.closest('[data-popover-suppress="true"]')) ||
      isInteractiveTarget(target)
    );
  }, []);

  const updateSuppressionFromTarget = useCallback(
    (target: EventTarget | null) => {
      setSuppressPopover(isSuppressedTarget(target));
    },
    [isSuppressedTarget],
  );

  const handleBlurCapture = useCallback(() => {
    // Wait for focus to settle, then re-check where it landed.
    queueMicrotask(() => {
      const active = document.activeElement;
      updateSuppressionFromTarget(active);
    });
  }, [updateSuppressionFromTarget]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Update suppression immediately (important for mouse clicks, not just hover).
      updateSuppressionFromTarget(e.target);

      if (e.pointerType !== "touch") return;
      setTouchMode(true);
      touchStartRef.current = { x: e.clientX, y: e.clientY };
      touchMovedRef.current = false;
    },
    [updateSuppressionFromTarget],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    const start = touchStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > 8) {
      touchMovedRef.current = true;
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    touchStartRef.current = null;
    touchMovedRef.current = false;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const moved = touchMovedRef.current;
      touchStartRef.current = null;
      touchMovedRef.current = false;
      if (moved) return;

      // Don't toggle when interacting with controls or inside the popover.
      if (isSuppressedTarget(e.target)) return;
      const targetNode = e.target instanceof Node ? e.target : null;
      if (targetNode && popoverRef.current?.contains(targetNode)) return;

      setTouchPopoverOpen((v) => !v);
    },
    [isSuppressedTarget],
  );

  useEffect(() => {
    if (!touchMode || !touchPopoverOpen) return;

    const onDocPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (cardRef.current?.contains(target)) return;
      setTouchPopoverOpen(false);
    };

    document.addEventListener("pointerdown", onDocPointerDown, {
      capture: true,
    });
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, {
        capture: true,
      } as any);
    };
  }, [touchMode, touchPopoverOpen]);

  useEffect(() => {
    if (suppressPopover && touchPopoverOpen) setTouchPopoverOpen(false);
  }, [suppressPopover, touchPopoverOpen]);

  return (
    <div
      ref={cardRef}
      className={
        "relative h-full z-0 hover:z-50 focus-within:z-50 transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none")
      }
    >
      <div
        tabIndex={0}
        onMouseMove={(e) => updateSuppressionFromTarget(e.target)}
        onMouseLeave={() => setSuppressPopover(false)}
        onFocusCapture={(e) => updateSuppressionFromTarget(e.target)}
        onBlurCapture={handleBlurCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={touchMode ? { touchAction: "pan-y" } : undefined}
        className={
          "group relative h-full z-0 hover:z-50 rounded-3xl p-5 bg-white/60 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5" +
          (touchMode
            ? ""
            : " focus-within:z-50 focus-within:shadow-md focus-within:-translate-y-0.5")
        }
      >
        {badge}
        {children}

        <div
          ref={popoverRef}
          className={(() => {
            const base =
              "absolute top-0 left-0 right-0 opacity-0 pointer-events-none transition-all duration-200 ease-out z-[100] rounded-t-3xl overflow-hidden flex items-center justify-center h-56 md:h-[240px] overflow-y-auto bg-white/90 rounded-3xl backdrop-blur-sm";

            const open = touchMode
              ? touchPopoverOpen
                ? " opacity-100 pointer-events-auto"
                : ""
              : " group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto";

            const suppressed = suppressPopover
              ? " !opacity-0 !pointer-events-none"
              : "";

            return base + open + suppressed;
          })()}
        >
          <div className="w-full flex items-center justify-center">
            {popover}
          </div>
        </div>
      </div>
    </div>
  );
}
