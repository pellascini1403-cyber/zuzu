// Acabado "vidrio real": gradiente de luz superior + reflejo interno +
// sombra de base, compartido por las 3 cápsulas de navegación.
const glassStyle =
  "bg-gradient-to-b from-white/60 via-white/25 to-white/10 backdrop-blur-2xl border border-white/80 border-b-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),_inset_0_-3px_6px_rgba(0,0,0,0.06),_0_10px_20px_-4px_rgba(0,0,0,0.1)]";

const TILT_CLASSES = {
  left: "-rotate-6",
  right: "rotate-6",
};

export default function NavButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
  tilt = "none",
}) {
  const isLg = size === "lg";
  const activeRing = active ? "ring-2 ring-amber-300" : "";

  if (isLg) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-20 w-36 -translate-y-1.5 flex-col items-center justify-center gap-1 rounded-[32px] ${glassStyle} transition-transform active:scale-95 ${activeRing}`}
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
      className={`flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-[28px] ${TILT_CLASSES[tilt] ?? ""} ${glassStyle} transition-transform active:scale-95 ${activeRing}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
        {label}
      </span>
    </button>
  );
}
