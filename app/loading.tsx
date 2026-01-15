function ShimmerBox({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className || ""}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="space-y-6">
      {/* Pack Progress Section */}
      <section className="card">
        <ShimmerBox className="h-7 w-48 rounded mb-3" />
        <div className="mt-3 space-y-2">
          <ShimmerBox className="h-5 w-32 rounded" />
          <ShimmerBox className="h-4 w-40 rounded" />
          <ShimmerBox className="h-4 w-36 rounded" />
        </div>
      </section>

      {/* Open Pack Button */}
      <section className="flex flex-col items-center gap-3">
        <ShimmerBox className="h-14 w-48 rounded-lg" />
      </section>

      {/* Equipped Masks Section */}
      <section className="card">
        <ShimmerBox className="h-7 w-32 rounded mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* TOA Slot */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <ShimmerBox className="h-4 w-24 rounded mb-4" />
            <ShimmerBox className="aspect-square w-32 mx-auto rounded-lg mb-3" />
            <ShimmerBox className="h-7 w-full rounded" />
          </div>
          
          {/* TURAGA Slot */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <ShimmerBox className="h-4 w-24 rounded mb-4" />
            <ShimmerBox className="aspect-square w-32 mx-auto rounded-lg mb-3" />
            <ShimmerBox className="h-7 w-full rounded" />
          </div>
        </div>
      </section>
    </div>
  );
}
