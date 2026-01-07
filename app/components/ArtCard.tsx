"use client";

import type { ReactNode } from "react";

export function ArtCard({
  badge,
  popover,
  children,
  visible = true,
  popoverWidthClass = "w-80",
}: {
  badge?: ReactNode;
  popover: ReactNode;
  children: ReactNode;
  visible?: boolean;
  popoverWidthClass?: string;
}) {
  return (
    <div
      className={
        "relative z-0 hover:z-50 focus-within:z-50 transition-all duration-500 ease-out " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none")
      }
    >
      <div
        tabIndex={0}
        className="group relative z-0 hover:z-50 focus-within:z-50 rounded-3xl p-5 bg-white/60 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 focus-within:shadow-md focus-within:-translate-y-0.5"
      >
        {badge}
        {children}

        <div
          className={
            "absolute left-1/2 top-full mt-3 " +
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
