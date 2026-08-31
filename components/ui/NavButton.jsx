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
        className={`flex h-28 flex-1 -translate-y-2 flex-col items-center justify-center gap-1 rounded-[36px] border-2 border-white/70 bg-white/45 shadow-[0_10px_40px_0_rgba(255,200,0,0.15)] backdrop-blur-2xl transition-transform active:scale-95 ${activeRing}`}
      >
        <span className="text-4xl">{icon}</span>
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
      className={`flex h-20 flex-1 flex-col items-center justify-center gap-1 rounded-[28px] border border-white/50 bg-white/35 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] backdrop-blur-xl transition-transform active:scale-95 ${activeRing}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-amber-950/80">{label}</span>
    </button>
  );
}
