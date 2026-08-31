// Estilo exacto para las cápsulas laterales (Vestidor y Tienda)
const glassCapsuleStyle =
  "bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_8px_20px_rgba(215,180,140,0.25),_inset_0_2px_4px_rgba(255,255,255,0.9)] rounded-[32px] transition-transform active:scale-95";

// Estilo exacto para la cápsula central (Hábitos / Estrella)
const mainGlassStyle =
  "bg-white/60 backdrop-blur-3xl border-2 border-white shadow-[0_12px_28px_rgba(245,158,11,0.25),_inset_0_2px_6px_rgba(255,255,255,1)] rounded-[36px] -translate-y-3 transition-transform active:scale-95";

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
        className={`flex h-28 flex-1 flex-col items-center justify-center gap-1 ${mainGlassStyle} ${activeRing}`}
      >
        <span className="flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-2 text-3xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)]">
          {icon}
        </span>
        <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
          {label}
        </span>
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
      className={`flex h-20 flex-1 flex-col items-center justify-center gap-1 ${glassCapsuleStyle} ${activeRing}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
        {label}
      </span>
    </button>
  );
}
