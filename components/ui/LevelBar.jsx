// Acabado "vidrio real": gradiente de luz superior + reflejo interno +
// sombra de base, compartido con NavButton/TopBar.
const glassStyle =
  "rounded-full bg-gradient-to-b from-white/60 via-white/25 to-white/10 backdrop-blur-2xl border border-white/80 border-b-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),_inset_0_-3px_6px_rgba(0,0,0,0.06),_0_10px_20px_-4px_rgba(0,0,0,0.1)]";

export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div className={`flex h-8 flex-1 items-center gap-2 px-1.5 ${glassStyle}`}>
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
