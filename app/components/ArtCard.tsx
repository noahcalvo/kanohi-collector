"use client";

import { useRef, type ReactNode } from "react";

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
        className="group relative h-full z-0 hover:z-50 focus-within:z-50 rounded-3xl p-5 bg-white/60 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 focus-within:shadow-md focus-within:-translate-y-0.5"
      >
        {badge}
        {children}

        <div
          ref={popoverRef}
          className="absolute top-0 left-0 right-0 opacity-0 pointer-events-none transition-all duration-200 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto z-[100] rounded-t-3xl overflow-hidden flex items-center justify-center h-56 md:h-[240px] overflow-y-auto bg-white/90 rounded-3xl backdrop-blur-sm"
        >
          <div className="w-full flex items-center justify-center">
            {popover}
          </div>
        </div>
      </div>
    </div>
  );
}
