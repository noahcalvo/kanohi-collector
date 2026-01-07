"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/friends", label: "Friends" },
  { href: "/shop", label: "Shop/Events" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="card p-2 flex items-center gap-2" aria-label="Primary">
      {items.map((item) => {
        const active = pathname === item.href;
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
