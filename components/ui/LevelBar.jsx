export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div className="flex h-8 flex-1 items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 shadow-sm backdrop-blur-md">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white">
        {level}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-orange-900">
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
