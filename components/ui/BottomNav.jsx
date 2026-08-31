import NavButton from "./NavButton";

// Posición del centro de cada marco (en % del ancho/alto de la imagen),
// medida directamente sobre public/nav/marcos-botones.png (2400x927px):
// Vestidor centrado en (14.3%, 55.3%), Hábitos en (49.9%, 43.2%),
// Tienda en (85.5%, 55.3%). glassWidth/glassHeight son el tamaño del
// relleno de vidrio interno, ~82% del marco medido para que quede
// encajado dentro del trazo sin taparlo. Ninguno de estos valores
// cambió en este ajuste de color/brillo.
const NAV_ITEMS = [
  {
    key: "characters",
    icon: "🐷",
    label: "Vestidor",
    top: "55.3%",
    left: "14.3%",
    width: "23%",
    glassWidth: "19%",
    glassHeight: "37%",
  },
  {
    key: "habits",
    icon: "⭐",
    label: "Hábitos",
    sublabel: "⭐ 1",
    top: "43.2%",
    left: "49.9%",
    width: "35%",
    glassWidth: "30%",
    glassHeight: "49%",
    size: "lg",
  },
  {
    key: "shop",
    icon: "👜",
    label: "Tienda",
    top: "55.3%",
    left: "85.5%",
    width: "23%",
    glassWidth: "19%",
    glassHeight: "37%",
  },
];

// Único elemento visual de la botonera: la imagen con los 3 marcos
// dibujados. Ninguna forma (cápsula, borde, sombra) se genera con CSS —
// los botones son overlays transparentes posicionados sobre esta imagen.
// El trazo del PNG está recoloreado a blanco puro directamente en el
// archivo (no vía filter:invert() en tiempo de ejecución — ese filtro,
// combinado con drop-shadow, renderizaba mal en este entorno). El
// drop-shadow blanco sigue siendo un filtro CSS normal para el resplandor.
export default function BottomNav({ activeModal, onSelect }) {
  return (
    <div className="relative w-full">
      <img
        src="/nav/marcos-botones.png"
        alt=""
        draggable={false}
        className="pointer-events-none block w-full select-none drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]"
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
          glassWidth={item.glassWidth}
          glassHeight={item.glassHeight}
          active={activeModal === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </div>
  );
}
