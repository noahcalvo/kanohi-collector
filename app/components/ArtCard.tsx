"use client";

import { useRef, useState, type ReactNode } from "react";

export function ArtCard({
  badge,
  popover,
  children,
  visible = true,
  popoverWidthClass = "w-80",
  index,
}: {
  badge?: ReactNode;
  popover: ReactNode;
  children: ReactNode;
  visible?: boolean;
  popoverWidthClass?: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const positionClasses =
    index < 1
      ? "top-full mt-3"
      : index < 3
      ? "bottom-full md:top-full md:mt-3"
      : "bottom-full mb-3";

  return (
    <div
      ref={cardRef}
      className={
        "relative z-0 hover:z-50 focus-within:z-50 transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none")
      }
    >
      <div
        tabIndex={0}
        className="group relative z-0 hover:z-50 focus-within:z-50 rounded-3xl p-5 bg-white/60 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 focus-within:shadow-md focus-within:-translate-y-0.5"
      >
        {badge}
        {children}

        <div
          ref={popoverRef}
          className={
            "absolute left-1/2 " +
            positionClasses +
            " " +
            popoverWidthClass +
            " -translate-x-1/2 opacity-0 scale-95 pointer-events-none transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto z-[100]"
          }
        >
          {popover}
        </div>
      </div>
    </div>
  );
}
