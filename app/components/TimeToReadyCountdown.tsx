"use client";
import { useEffect, useState } from "react";

interface TimeToReadyCountdownProps {
  seconds: number;
}

export function TimeToReadyCountdown({ seconds }: TimeToReadyCountdownProps) {
  // Format seconds as hh mm ss, always two digits, fixed width
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Pad each unit to two digits
  const pad = (n: number) => n.toString().padStart(2, "0");
  // Always show all units for fixed width
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm text-slate-600">
        {seconds <= 0 ? (
          <div className="text-sm text-slate-600">Ready now</div>
        ) : (
          <>
            <span
              className="inline-block text-3xl font-bold text-slate-800 pl-4 py-2 font-mono"
              style={{
                minWidth: "15ch",
                textAlign: "center",
                letterSpacing: "0.08em",
              }}
            >
              {formatted}
            </span>{" "}
            until next pack is ready
          </>
        )}
      </div>
    </div>
  );
}
