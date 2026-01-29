"use client";

import Link from "next/link";

export function CreateAccountSection(props: {
  isGuest: boolean;
  advancing: boolean;
  onAdvance: () => void;
}) {
  if (!props.isGuest) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            All set.
          </h2>
          <div className="text-sm text-slate-200/75">
            You’re signed in, so we’ll skip account setup.
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={props.onAdvance}
            disabled={props.advancing}
          >
            Continue
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-md space-y-4">
      <div>
        <div className="text-xs text-slate-300/70 uppercase tracking-widest">
          Keep your collection
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white mt-1">
          Create an account?
        </h2>
        <div className="text-sm text-slate-200/75 mt-1">
          Creating an account ties your progress to you, not this device.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end gap-y-4">
        <button
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          onClick={props.onAdvance}
          disabled={props.advancing}
        >
          Not now
        </button>
        <Link
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 text-center"
          href="/sign-up?redirect_url=/api/upgrade-guest"
        >
          Create account
        </Link>
      </div>
    </section>
  );
}
