import { useState } from "react";
import { CollectionMask } from "../../../lib/types";
import { HeroImage } from "../../components/HeroImage";

export default function FullCollectionSection({ masks }: { masks: CollectionMask[] }) {
  const [visible, setVisible] = useState(false);
  // Sync with toggle via a simple event approach could be done; for simplicity keep local toggle here
  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="w-full px-4 py-3 rounded-xl transition-colors flex items-center justify-between text-left hover:bg-white/50 active:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
      >
        <span className="text-lg font-semibold text-slate-900">Full Collection</span>
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${visible ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {visible && (
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-4">
          {masks.flatMap((m) =>
            (m.unlocked_colors.length
              ? m.unlocked_colors
              : [m.equipped_color]
            ).map((color) => (
              <div
                key={`${m.mask_id}-${color}`}
                className="flex flex-col items-center gap-2"
              >
                <HeroImage
                  maskId={m.mask_id}
                  alt={m.name}
                  size="sm"
                  color={color}
                  transparent={m.transparent}
                />
                <div className="text-[11px] text-slate-600">{m.name}</div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export function FullCollectionToggle() {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="px-4 py-2 rounded-full bg-white/70 hover:bg-white/80 text-slate-900 border border-slate-200/70 shadow-sm transition"
    >
      {open ? "Hide Full Collection" : "View Full Collection"}
    </button>
  );
}
