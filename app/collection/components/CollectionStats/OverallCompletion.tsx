"use client";

export function OverallCompletion({
  percent,
  owned,
  total,
}: {
  percent: number;
  owned: number;
  total: number;
}) {
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-50/60 to-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-200/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-3 relative z-10">
        Overall Completion
      </div>
      <div className="text-6xl font-black bg-gradient-to-br from-slate-700 to-slate-500 bg-clip-text text-transparent relative z-10">
        {percent}%
      </div>
      <div className="text-sm text-slate-500 mt-2 relative z-10 font-light">
        {owned} of {total} masks
      </div>
      <div className="w-full mt-4 relative z-10">
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-slate-600 to-slate-400 h-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
