"use client";

import { useMe } from "../hooks/useMe";

export default function ShopPage() {
  const { me } = useMe();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shop / Events</h1>
          <p className="text-slate-600 text-sm leading-relaxed">Minimal shop/events screen (MVP placeholder).</p>
        </div>
        {me && <div className="text-sm text-slate-600">{me.user.username}</div>}
      </header>

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Coming soon</h2>
        <p className="text-slate-600 text-sm mt-3">
          Shop and events aren’t implemented in this build yet.
        </p>
      </section>
    </div>
  );
}
