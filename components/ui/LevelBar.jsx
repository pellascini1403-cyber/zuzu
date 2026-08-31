// Estilo para la barra de racha y botón de comida
const streakGlassStyle =
  "bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_6px_16px_rgba(215,180,140,0.2)] rounded-full";

export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div className={`flex h-8 flex-1 items-center gap-2 px-1.5 ${streakGlassStyle}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-amber-400 to-orange-500 text-xs font-black text-white shadow-md">
        {level}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_2px_6px_rgba(245,158,11,0.4)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="shrink-0 pr-1 text-[10px] font-semibold text-orange-900">
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
