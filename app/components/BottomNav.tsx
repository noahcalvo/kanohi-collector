"use client";

import {
  Home,
  Package,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/collection", label: "Collection", Icon: Package },
  { href: "/friends", label: "Friends", Icon: Users },
] as const;

const NPE_COLLECTION_TIP_SESSION_KEY = "kc_npe_collection_tip";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const npe = searchParams.get("npe");
  const [showCollectionTip, setShowCollectionTip] = useState(false);

  const hideNav =
    pathname === "/splash" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/tutorial");

  useEffect(() => {
    if (hideNav) {
      setShowCollectionTip(false);
      return;
    }

    if (pathname !== "/") {
      setShowCollectionTip(false);
      try {
        window.sessionStorage.removeItem(NPE_COLLECTION_TIP_SESSION_KEY);
      } catch {
        // ignore
      }
      return;
    }

    const stored = (() => {
      try {
        return (
          window.sessionStorage.getItem(NPE_COLLECTION_TIP_SESSION_KEY) === "1"
        );
      } catch {
        return false;
      }
    })();

    if (npe === "collection-tip") {
      try {
        window.sessionStorage.setItem(NPE_COLLECTION_TIP_SESSION_KEY, "1");
      } catch {
        // ignore
      }
      setShowCollectionTip(true);
      // Clean the URL so refresh/back doesn't keep re-triggering.
      router.replace("/");
      return;
    }

    setShowCollectionTip(stored);
  }, [hideNav, npe, pathname, router]);

  if (hideNav) return null;

  return (
    <nav
      className="opaque-card p-2 flex items-center gap-2 bg-white/100"
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.Icon;

        const showTipForThisItem =
          pathname === "/" && showCollectionTip && item.href === "/collection";

        return (
          <div key={item.href} className="relative flex-1">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                "block text-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 " +
                (active
                  ? "bg-slate-900/90 text-white"
                  : showTipForThisItem ? "bg-white text-slate-900 border border-slate-900 hover:bg-slate-100" : "bg-white/70 text-slate-900 border border-slate-200/70 hover:bg-white/80")
              }
              onClick={() => {
                if (!showTipForThisItem) return;
                setShowCollectionTip(false);
                try {
                  window.sessionStorage.removeItem(
                    NPE_COLLECTION_TIP_SESSION_KEY,
                  );
                } catch {
                  // ignore
                }
              }}
            >
              <Icon className="block md:hidden w-5 h-5 mx-auto" />
              <span className="hidden md:block">{item.label}</span>
            </Link>

            {showTipForThisItem && (
              <div
                role="status"
                aria-live="polite"
                className="absolute -top-20 left-1/2 z-20 w-60 -translate-x-1/2 rounded-2xl border border-sky-600/60 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-900 shadow-[0_-18px_60px_rgba(2,132,199,0.22),0_0_18px_rgba(2,132,199,0.10)]"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 p-2">
                    View your collection to equip your new masks!
                  </div>
                </div>

                <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-sky-600/60 bg-white" />
              </div>
            )}
          </div>
        );
      })}
      <Link
        href="/settings"
        aria-label="Settings"
        className={
          "flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 " +
          (pathname === "/settings"
            ? "bg-slate-900/90 text-white"
            : "bg-white/70 text-slate-900 border border-slate-200/70 hover:bg-white/80")
        }
      >
        <SettingsIcon className="block w-5 h-5 mx-auto" />
      </Link>
    </nav>
  );
}
