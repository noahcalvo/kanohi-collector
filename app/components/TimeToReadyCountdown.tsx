"use client";

import { useEffect, useRef, useState } from "react";

interface TimeToReadyCountdownProps {
  seconds: number;
  onReady?: () => void;
}

export function TimeToReadyCountdown({
  seconds,
  onReady,
}: TimeToReadyCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);
  const hasNotifiedRef = useRef(false);
  const onReadyRef = useRef<TimeToReadyCountdownProps["onReady"]>(undefined);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Sync internal timer with server updates.
  useEffect(() => {
    setRemaining(seconds);
    hasNotifiedRef.current = false;
  }, [seconds]);

  // Tick locally without forcing the whole page to re-render.
  const active = remaining > 0;
  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  // When the countdown hits zero, ask the caller to refresh server state.
  useEffect(() => {
    if (remaining !== 0) return;
    if (hasNotifiedRef.current) return;
    hasNotifiedRef.current = true;
    onReadyRef.current?.();
  }, [remaining]);

  // Format seconds as hh mm ss, always two digits, fixed width
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  // Pad each unit to two digits
  const pad = (n: number) => n.toString().padStart(2, "0");
  // Always show all units for fixed width
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm text-slate-600">
        {remaining <= 0 ? (
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
            </span>
          </>
        )}
      </div>
    </div>
  );
}
