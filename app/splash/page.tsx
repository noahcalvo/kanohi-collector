"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ParallaxState = {
  bg: number;
  mid: number;
  fg: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function SplashPage() {
  const [parallax, setParallax] = useState<ParallaxState>({
    bg: 0,
    mid: 0,
    fg: 0,
  });

  const layers = useMemo(
    () => ({
      background: "/splash/bionicle-background.png",
      poster: "/splash/kanohi-poster.png",
      pack: "/splash/mask-pack.jpg",
      tahu: "/splash/tahu-mask.webp",
    }),
    [],
  );

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop || 0;
      const capped = clamp(scrollTop, 0, 1200);
      setParallax({
        bg: capped * 0.08,
        mid: capped * 0.16,
        fg: capped * 0.28,
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="relative">
      {/* Background layers (fixed to viewport for true parallax) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(0, ${-parallax.bg}px, 0)`,
          }}
        >
          <Image
            src={layers.background}
            alt=""
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/70 via-slate-50/40 to-slate-50" />
        </div>

        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(0, ${-parallax.mid}px, 0)`,
          }}
        >
          <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[min(720px,92vw)] aspect-[3/4] opacity-30">
            <Image
              src={layers.poster}
              alt=""
              fill
              className="object-contain drop-shadow-[0_26px_60px_rgba(2,132,199,0.14)]"
            />
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            transform: `translate3d(0, ${-parallax.fg}px, 0)`,
          }}
        >
          <div className="absolute -right-10 top-56 w-[min(520px,75vw)] aspect-[1/1] opacity-90">
            <Image
              src={layers.tahu}
              alt=""
              fill
              className="object-contain drop-shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
            />
          </div>
          <div className="absolute -left-14 bottom-12 w-[min(520px,78vw)] aspect-[4/3] opacity-80 rotate-[-6deg]">
            <Image
              src={layers.pack}
              alt=""
              fill
              className="object-contain rounded-3xl drop-shadow-[0_24px_55px_rgba(15,23,42,0.18)]"
            />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-4">
          <div className="flex justify-end gap-2 w-full">
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-full text-sm font-semibold border border-slate-200/80 bg-white hover:bg-white transition"
            >
              Sign in
            </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-10 pb-10">
        <div className="opaque-card p-7 md:p-10 bg-white/75 border border-slate-200/70">
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Premium collectible album
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Open packs. Collect masks. Level up.
          </h1>
          <p className="mt-3 text-slate-700 text-base md:text-lg max-w-2xl">
            A lightweight, cozy collection game with deterministic server-side
            draws, rarity tiers, and a clean album-style UI.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/tutorial" className="button-primary text-center">
              Enter tutorial
            </Link>
            <Link
              href="/sign-in"
              className="px-5 py-3 rounded-full text-center font-semibold bg-white/85 border border-slate-200/70 text-slate-900 hover:bg-white transition"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Tip: you can start with the tutorial and play as a guest without creating an account.
          </div>
        </div>
      </section>

      {/* Scroll content to showcase parallax */}
      <section className="space-y-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="opaque-card p-5 bg-white/70 border border-slate-200/70">
            <div className="text-sm font-semibold text-slate-900">
              Two pulls per pack
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Quick opens with clear rarity reveals.
            </div>
          </div>
          <div className="opaque-card p-5 bg-white/70 border border-slate-200/70">
            <div className="text-sm font-semibold text-slate-900">
              Pity protection
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Better drops after a streak of bad luck.
            </div>
          </div>
          <div className="opaque-card p-5 bg-white/70 border border-slate-200/70">
            <div className="text-sm font-semibold text-slate-900">
              Upgrades from duplicates
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Duplicates become protodermis for leveling.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
