"use client";

export function MythicCounter({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 bg-radial-gradient from-blue-200/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-3 relative z-10">
        Mythic Masks
      </div>
      <div className="text-6xl font-black bg-gradient-to-br from-slate-700 to-slate-500 bg-clip-text text-transparent relative z-10">
        {count}
      </div>
      <div className="text-sm text-slate-500 mt-2 relative z-10 font-light">
        {percentage}% complete
      </div>
      
      {total > 0 && (
        <div className="mt-4 relative z-10">
          <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-slate-600 to-slate-400 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-2 text-center">
            {count} of {total} collected
          </div>
        </div>
      )}
    </div>
  );
}
