// Overlay sobre el marco de BottomNav.jsx. Posición, forma y trazo blanco
// no cambian en este ajuste — solo se le dio volumen 3D al relleno de
// vidrio: brillo superior + sombra cálida inferior (ambas inset, dentro
// del propio relleno) y una sombra proyectada suave hacia afuera.
// El relleno mide ~82% del marco, así que queda por detrás del trazo.
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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[999px] bg-white/40 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-8px_12px_rgba(255,235,215,0.6)] drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)]"
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
