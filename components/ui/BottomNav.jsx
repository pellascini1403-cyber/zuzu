import NavButton from "./NavButton";

// Posición del centro de cada marco (en % del ancho/alto de la imagen),
// medida directamente sobre public/nav/marcos-botones.png (2400x927px):
// Vestidor centrado en (14.3%, 55.3%), Hábitos en (49.9%, 43.2%),
// Tienda en (85.5%, 55.3%).
const NAV_ITEMS = [
  {
    key: "characters",
    icon: "🐷",
    label: "Vestidor",
    top: "55.3%",
    left: "14.3%",
    width: "23%",
  },
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
  {
    key: "shop",
    icon: "👜",
    label: "Tienda",
    top: "55.3%",
    left: "85.5%",
    width: "23%",
  },
];

// Único elemento visual de la botonera: la imagen con los 3 marcos
// dibujados. Ninguna forma (cápsula, borde, sombra) se genera con CSS —
// los botones son overlays transparentes posicionados sobre esta imagen.
export default function BottomNav({ activeModal, onSelect }) {
  return (
    <div className="relative w-full">
      <img
        src="/nav/marcos-botones.png"
        alt=""
        draggable={false}
        className="pointer-events-none block w-full select-none"
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
