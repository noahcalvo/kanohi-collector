"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

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

  const isSuppressedTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('[data-popover-suppress="true"]'));
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
        className="group relative h-full z-0 hover:z-50 focus-within:z-50 rounded-3xl p-5 bg-white/60 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 focus-within:shadow-md focus-within:-translate-y-0.5"
      >
        {badge}
        {children}

        <div
          ref={popoverRef}
          className={
            "absolute top-0 left-0 right-0 opacity-0 pointer-events-none transition-all duration-200 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto z-[100] rounded-t-3xl overflow-hidden flex items-center justify-center h-56 md:h-[240px] overflow-y-auto bg-white/90 rounded-3xl backdrop-blur-sm" +
            (suppressPopover ? " !opacity-0 !pointer-events-none" : "")
          }
        >
          <div className="w-full flex items-center justify-center">
            {popover}
          </div>
        </div>
      </div>
    </div>
  );
}
