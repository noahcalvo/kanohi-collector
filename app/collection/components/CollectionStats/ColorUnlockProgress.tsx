"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    standard: "#a3a3a3",
    red: "#ff0000",
    blue: "#2244ff",
    green: "#15973D",
    brown: "#7C2D12",
    white: "#FFFFFF",
    black: "#222222",
    orange: "#ff8c00",
    perriwinkle: "#00b3ff",
    lime: "#a8e62e",
    "light gray": "#c9c9c9",
    "dark gray": "#63635F",
    tan: "#dbb686",
    gold: "#b8860b",
  };
  return colorMap[color.toLowerCase()] || "#a3a3a3";
}

export function ColorUnlockProgress({
  colorStats,
}: {
  colorStats: Record<string, { owned: number; available: number }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedColors = Object.entries(colorStats)
    .filter(([color]) => color !== "standard")
    .sort(([, a], [, b]) => {
      const aPercent = typeof a === "object" ? (a.owned / a.available) * 100 : 0;
      const bPercent = typeof b === "object" ? (b.owned / b.available) * 100 : 0;
      return bPercent - aPercent;
    });

  return (
    <div className="md:col-span-2 lg:col-span-3">
      <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        Color Unlock Progress
      </div>
      <div className="relative">
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${!isExpanded ? "max-h-[380px] overflow-hidden" : ""}`}>
          {sortedColors.map(([color, stats]) => {
            const owned = typeof stats === "object" ? stats.owned : 0;
            const total = typeof stats === "object" ? stats.available : 0;
            const percent = owned > 0 && total > 0 ? (owned / total) * 100 : 0;
            const circumference = 2 * Math.PI * 45;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            return (
              <div key={color} className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    {/* Gradient definition for shine */}
                    <defs>
                      <linearGradient id={`shine-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={getColorHex(color)} stopOpacity="1" />
                        <stop offset="50%" stopColor={getColorHex(color)} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={getColorHex(color)} stopOpacity="1" />
                      </linearGradient>
                      <filter id={`glow-${color}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke={`url(#shine-${color})`}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      filter={`url(#glow-${color})`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xl font-bold text-slate-900">
                      {owned} <span className="text-xs text-slate-500">/ {total}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-700 capitalize text-center">
                  {color}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {Math.round(percent)}%
                </div>
              </div>
            );
          })}
        </div>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent flex items-end justify-center pb-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
            >
              <MoreHorizontal size={20} className="text-slate-600" />
            </button>
          </div>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="mt-4 w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
}
