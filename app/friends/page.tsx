"use client";

export default function FriendsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Friends
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Minimal friends UI (MVP placeholder).
          </p>
        </div>
      </header>

      <section className="card">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Coming soon
        </h2>
        <p className="text-slate-600 text-sm mt-3">
          Friends aren’t implemented in this build yet.
        </p>
      </section>
    </div>
  );
}
