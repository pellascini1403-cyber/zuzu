export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div className="flex flex-1 items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 shadow-lg backdrop-blur">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white">
        {level}
      </span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
          style={{ width: `${progress}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-orange-900">
          {xp} / {xpToNext}
        </span>
      </div>
    </div>
  );
}
