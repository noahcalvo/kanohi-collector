function ShimmerBox({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className || ""}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
    </div>
  );
}

export default function CollectionLoading() {
  return (
    <div className="space-y-6">
      {/* Main Collection Section - All drawers minimized */}
      <section className="card">
        <div className="mt-3 space-y-4">
          {/* Generation Section 1 (minimized) */}
          <div className="flex items-center justify-between cursor-pointer select-none">
            <ShimmerBox className="h-8 w-48 rounded" />
            {/* Drawer toggle icon shimmer */}
            <ShimmerBox className="h-6 w-6 rounded-full" />
          </div>
          {/* Generation Section 2 (minimized) */}
          <div className="flex items-center justify-between cursor-pointer select-none">
            <ShimmerBox className="h-8 w-48 rounded" />
            <ShimmerBox className="h-6 w-6 rounded-full" />
          </div>
          {/* Generation Section 3 (minimized) */}
          <div className="flex items-center justify-between cursor-pointer select-none">
            <ShimmerBox className="h-8 w-48 rounded" />
            <ShimmerBox className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section (minimized) */}
      <section className="card">
        <div className="flex items-center justify-between mb-4 cursor-pointer select-none">
          <ShimmerBox className="h-8 w-40 rounded" />
          <ShimmerBox className="h-6 w-6 rounded-full" />
        </div>
      </section>

      {/* Full Collection Section */}
      <section className="card">
        <ShimmerBox className="h-8 w-48 rounded mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <ShimmerBox key={i} className="aspect-square rounded" />
          ))}
        </div>
      </section>
    </div>
  );
}
