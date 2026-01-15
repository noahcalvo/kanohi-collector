"use client";

import { Rarity } from "../../../../lib/types";

export function RarityBreakdown({
  rarityStats,
  rarityOrder,
}: {
  rarityStats: Map<Rarity, { owned: number; total: number }>;
  rarityOrder: Rarity[];
}) {
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50/60 to-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient from-cyan-200/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />

      <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-4 relative z-10">
        Rarity Breakdown
      </div>
      <div className="space-y-4 relative z-10">
        {rarityOrder.map((rarity) => {
          const stats = rarityStats.get(rarity);
          if (!stats || stats.total === 0) return null;
          const percent = Math.round((stats.owned / stats.total) * 100);
          const colors: Record<Rarity, string> = {
            MYTHIC: "from-amber-300 to-amber-400",
            RARE: "from-purple-300 to-purple-400",
            COMMON: "from-slate-400 to-slate-500",
          };
          return (
            <div key={rarity}>
              <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{rarity}</span>
                  <span className="text-slate-600 font-light">•</span>
                  <span className="font-bold text-slate-700">{percent}%</span>
                </div>
                <span className="text-xs text-slate-500 font-light">{stats.owned}/{stats.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${colors[rarity]} h-full transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
