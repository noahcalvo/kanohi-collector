"use client";

export function OpenStarterPackSection(props: {
  reviewMode: boolean;
  starterPackOpenedAt: string | null | undefined;
  advancing?: boolean;
  opening?: boolean;
  onAdvance: () => void;
  onOpenPack: () => void;
}) {
  const { reviewMode, starterPackOpenedAt } = props;
  const busy = Boolean(props.advancing) || Boolean(props.opening);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
      <div>
        <div className="text-xs text-slate-300/70 uppercase tracking-widest">
          Starter pack
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white mt-1">
          Open your first pack
        </h2>
        <div className="text-sm text-slate-200/75 mt-1">
          {reviewMode
            ? "Tutorial pack already collected."
            : "This pack is seeded with commons only."}
        </div>
      </div>

      {reviewMode ? (
        <div className="flex justify-center gap-3 w-full">
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition ease-out hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 active:scale-[0.99]"
            onClick={props.onAdvance}
            disabled={props.advancing}
          >
            {props.advancing ? "Continuing…" : "Continue"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="text-sm text-slate-200/75">
            {starterPackOpenedAt ? "Already opened." : ""}
          </div>
          <div className="flex gap-2 items-center">
            {!starterPackOpenedAt && (
              <button
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                onClick={props.onOpenPack}
                disabled={busy}
              >
                {props.opening ? "Opening…" : "Open pack"}
              </button>
            )}
            {starterPackOpenedAt && (
              <button
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                onClick={props.onAdvance}
                disabled={busy}
              >
                {props.advancing ? "Continuing…" : "Continue"}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
