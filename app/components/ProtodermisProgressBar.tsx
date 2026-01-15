"use client";

import type { DrawResultItem } from "../../lib/types";

export function ProtodermisProgressBar({
  item,
  displayLevel,
  displayEssence,
  mythicHighlight,
}: {
  item: DrawResultItem;
  displayLevel: number;
  displayEssence: number;
  mythicHighlight?: boolean;
}) {
  return (
    <div className="mt-4 space-y-1.5 relative">
      <div
        className={
          "flex items-center justify-between text-xs " +
          (mythicHighlight ? " font-bold text-slate-300" : "text-slate-600")
        }
      >
        <span className="font-semibold relative inline-block min-w-[60px]">
          {displayLevel > item.level_before ? (
            <>
              <span
                className="absolute left-0 top-0"
                style={{
                  animation: "slide-up-out 0.6s ease-out forwards",
                  animationDelay: "1s",
                }}
              >
                Level {item.level_before}
              </span>
              <span
                className="inline-block"
                style={{
                  animation: "slide-up-in 0.6s ease-out forwards",
                  animationDelay: "1s",
                  opacity: 0,
                }}
              >
                Level {displayLevel}
              </span>
            </>
          ) : (
            <span>Level {displayLevel}</span>
          )}
        </span>
        <span>
          {item.essence_awarded > 0
            ? `+${item.essence_awarded} protodermis`
            : ""}
        </span>
      </div>
      <div className="relative h-2 bg-slate-600/70 rounded-full overflow-hidden">
        {(() => {
          // Calculate progress percentage towards next level
          const baseEssence =
            item.rarity === "COMMON" ? 5 : item.rarity === "RARE" ? 25 : 200;
          const requiredForNextLevel = baseEssence * displayLevel;
          const progressPercent =
            requiredForNextLevel > 0
              ? Math.min((displayEssence / requiredForNextLevel) * 100, 100)
              : 0;

          const leveledUp = displayLevel > item.level_before;

          return (
            <>
              {item.essence_awarded > 0 && (
                <>
                  {/* Fill to 100% first if leveled up */}
                  {leveledUp && (
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                      style={
                        {
                          animation: "fill-progress 1s ease-out forwards",
                          "--progress-width": "100%",
                        } as React.CSSProperties
                      }
                    />
                  )}
                  {/* Then show new progress after level up, or just show progress if no level up */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                    style={
                      leveledUp
                        ? ({
                            animation: "fill-progress 0.6s ease-out forwards",
                            animationDelay: "1s",
                            "--progress-width": `${progressPercent}%`,
                            opacity: 0,
                          } as React.CSSProperties)
                        : ({
                            animation: "fill-progress 1s ease-out forwards",
                            "--progress-width": `${progressPercent}%`,
                          } as React.CSSProperties)
                    }
                  />
                </>
              )}
              {item.essence_awarded === 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
