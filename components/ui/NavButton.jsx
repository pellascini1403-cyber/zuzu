export default function NavButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
}) {
  const isLg = size === "lg";
  const activeRing = active ? "ring-2 ring-amber-300" : "";

  if (isLg) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-28 flex-1 -translate-y-2 flex-col items-center justify-center gap-1 rounded-[36px] border-2 border-white/90 bg-gradient-to-b from-white/90 to-white/60 shadow-[0_16px_32px_rgba(255,190,0,0.2)] backdrop-blur-2xl transition-transform active:scale-95 ${activeRing}`}
      >
        <span className="flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-2 text-3xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)]">
          {icon}
        </span>
        <span className="text-xs font-medium text-amber-950/80">{label}</span>
        {sublabel && (
          <span className="text-[10px] font-semibold text-amber-600">{sublabel}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-20 flex-1 flex-col items-center justify-center gap-1 rounded-[28px] border border-t-white/80 border-l-white/80 border-b-white/20 border-r-white/20 bg-gradient-to-b from-white/70 to-white/40 shadow-[0_12px_24px_-6px_rgba(210,160,110,0.25)] backdrop-blur-xl transition-transform active:scale-95 ${activeRing}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-amber-950/80">{label}</span>
    </button>
  );
}
