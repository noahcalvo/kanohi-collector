"use client";
import { useEffect, useState } from "react";

interface TimeToReadyCountdownProps {
  initialSeconds: number;
}

export function TimeToReadyCountdown({ initialSeconds }: TimeToReadyCountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  // Format seconds as hh mm ss, always two digits, fixed width
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Pad each unit to two digits
  const pad = (n: number) => n.toString().padStart(2, "0");
  // Always show all units for fixed width
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(secs)}s`;

  return (
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
  );
}
