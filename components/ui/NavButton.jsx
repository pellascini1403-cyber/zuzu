// La silueta exacta de cada botón vive como marco vectorial en
// public/nav/*.svg (placeholder trazado a mano mientras llegan los
// archivos finales — mismo nombre de archivo, se reemplaza sin tocar
// este componente). Se aplica como máscara CSS: define la forma, este
// componente solo aporta el relleno de vidrio, el resplandor y el
// contenido. No agrega bordes ni distorsiona la proporción del marco
// (mask-size: contain conserva su aspect ratio).
const FRAME_SRC = {
  lg: "/nav/center-frame.svg",
  md: "/nav/side-frame.svg",
};

function frameMask(src) {
  const value = `url(${src}) center / contain no-repeat`;
  return {
    WebkitMaskImage: `url(${src})`,
    WebkitMaskPosition: "center",
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskImage: `url(${src})`,
    mask: value,
  };
}

// Vidrio + resplandor: drop-shadow (filtro) en vez de shadow (box-shadow)
// para la sombra externa, porque box-shadow se recorta con mask-image
// mientras que drop-shadow sí seguirá el contorno de la máscara.
const glassStyle =
  "bg-gradient-to-b from-white/50 via-amber-100/30 to-white/20 backdrop-blur-md shadow-[inset_0_2px_6px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(0,0,0,0.06)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-transform active:scale-95";

const TILT_CLASSES = {
  left: "-rotate-12",
  right: "rotate-12",
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
        style={frameMask(FRAME_SRC.lg)}
        className={`flex h-20 w-36 -translate-y-2 flex-col items-center justify-center gap-1 ${glassStyle} ${activeRing}`}
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
      style={frameMask(FRAME_SRC.md)}
      className={`flex h-16 w-24 translate-y-2 flex-col items-center justify-center gap-1 ${TILT_CLASSES[tilt] ?? ""} ${glassStyle} ${activeRing}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
        {label}
      </span>
    </button>
  );
}
