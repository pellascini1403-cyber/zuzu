// Cápsula translúcida vacía/oscura suave que contiene el relleno de
// progreso (a diferencia del vidrio claro de NavButton/TopBar).
const trackStyle =
  "rounded-full bg-amber-900/10 backdrop-blur-xl border border-white/40 shadow-inner";

export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div
      className={`flex h-8 w-[65%] max-w-[280px] flex-none items-center gap-2 px-1.5 ${trackStyle}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-amber-400 to-orange-500 text-xs font-black text-white shadow-md">
        {level}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 pr-1 text-[10px] font-semibold text-orange-900">
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
