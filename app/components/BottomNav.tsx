"use client";

import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Settings as SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/collection", label: "Collection", Icon: Package },
  { href: "/friends", label: "Friends", Icon: Users },
  { href: "/shop", label: "Shop/Events", Icon: ShoppingBag },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="opaque-card p-2 flex items-center gap-2 bg-white/100"
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 " +
              (active
                ? "bg-slate-900/90 text-white"
                : "bg-white/70 text-slate-900 border border-slate-200/70 hover:bg-white/80")
            }
          >
            <Icon className="block md:hidden w-5 h-5 mx-auto" />
            <span className="hidden md:block">{item.label}</span>
          </Link>
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
