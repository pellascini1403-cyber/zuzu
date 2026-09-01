import NavButton from "./NavButton";

// Posición del centro de cada marco (en % del ancho/alto de la imagen),
// medida directamente sobre public/nav/marcos-botones.png (2400x927px):
// Vestidor centrado en (14.3%, 55.3%), Hábitos en (49.9%, 43.2%),
// Tienda en (85.5%, 55.3%). Estos valores no cambiaron en este ajuste.
const NAV_ITEMS = [
  { key: "characters", icon: "🐷", label: "Vestidor", top: "55.3%", left: "14.3%", width: "23%" },
  {
    key: "habits",
    icon: "⭐",
    label: "Hábitos",
    sublabel: "⭐ 1",
    top: "43.2%",
    left: "49.9%",
    width: "35%",
    size: "lg",
  },
  { key: "shop", icon: "👜", label: "Tienda", top: "55.3%", left: "85.5%", width: "23%" },
];

// aspectRatio fija el alto del contenedor exactamente al del PNG
// (2400x927), así la capa de vidrio (posicionada con inset-0) y el
// trazo (w-full, alto automático) quedan perfectamente alineados.
const FRAME_ASPECT_RATIO = "2400 / 927";

export default function BottomNav({ activeModal, onSelect }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: FRAME_ASPECT_RATIO }}>
      {/* Vidrio: llena exactamente la silueta de los 3 marcos, recortado
          con la misma imagen (rellena a sólido) como máscara de opacidad
          — ver public/nav/marcos-fill-mask.png. Nada de círculos/burbujas
          sueltas: es una sola pieza de cristal por marco. */}
      <div
        style={{
          maskImage: "url(/nav/marcos-fill-mask.png)",
          WebkitMaskImage: "url(/nav/marcos-fill-mask.png)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
        className="absolute inset-0 bg-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-8px_12px_rgba(255,235,215,0.6)] backdrop-blur-md drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)]"
      />

      {/* Trazo blanco (marco), recoloreado directamente en el archivo. */}
      <img
        src="/nav/marcos-botones.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 block h-full w-full select-none drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
      />

      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          sublabel={item.sublabel}
          size={item.size}
          top={item.top}
          left={item.left}
          width={item.width}
          active={activeModal === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </div>
  );
}
