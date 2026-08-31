// Overlay sobre el marco de BottomNav.jsx. La posición/alineación
// (top/left/width) no cambia en este ajuste — solo se agregó el relleno
// de vidrio y se recoloreó el trazo (ver BottomNav.jsx) para que
// combinen con el resto de la interfaz.
export default function NavButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
  top,
  left,
  width,
  glassWidth,
  glassHeight,
}) {
  const isLg = size === "lg";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ top, left, width }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 bg-transparent transition-transform active:scale-95 ${active ? "scale-110" : ""}`}
    >
      {/* Relleno glassmorphism, encajado dentro del marco */}
      <div
        style={{ width: glassWidth, height: glassHeight }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[999px] bg-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur-md"
      />

      {isLg ? (
        <span className="flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-2 text-3xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)]">
          {icon}
        </span>
      ) : (
        <span className="text-2xl">{icon}</span>
      )}
      <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] font-semibold text-amber-600">{sublabel}</span>
      )}
    </button>
  );
}
