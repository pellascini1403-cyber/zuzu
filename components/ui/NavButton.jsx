// La forma, inclinación y curvatura del botón dependen exclusivamente del
// marco vectorial en public/nav/*.svg (placeholder trazado a mano mientras
// llegan los archivos finales — mismo nombre de archivo, se reemplaza sin
// tocar este componente). Nada de border-radius/clip-path aquí: el <img>
// dicta la silueta completa, con su propio aspect ratio intacto.
const FRAME_SRC = {
  center: "/nav/center-frame.svg",
  left: "/nav/left-frame.svg",
  right: "/nav/right-frame.svg",
};

const WIDTH_CLASS = {
  center: "w-36",
  left: "w-24",
  right: "w-24",
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
  const frameKey = isLg ? "center" : tilt === "right" ? "right" : "left";
  const activeRing = active ? "ring-2 ring-amber-300" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 ${WIDTH_CLASS[frameKey]} ${isLg ? "-translate-y-2" : "translate-y-2"} transition-transform active:scale-95 ${activeRing}`}
    >
      {/* Relleno glass, encajado dentro del marco */}
      <div className="absolute inset-[10%] rounded-[999px] bg-white/30 backdrop-blur-sm" />

      {/* Marco vectorial: única fuente de la forma/inclinación/curvatura */}
      <img
        src={FRAME_SRC[frameKey]}
        alt=""
        draggable={false}
        className="pointer-events-none relative block h-auto w-full select-none"
      />

      {/* Icono y texto, centrados sobre el marco */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2">
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
      </div>
    </button>
  );
}
