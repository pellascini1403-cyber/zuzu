import NavButton from "./NavButton";

// Posición del centro de cada marco (en % del ancho/alto de la imagen),
// medida directamente sobre public/nav/marcos-botones.png (2400x927px):
// izquierda ("Tienda") en (14.3%, 55.3%), Hábitos en (49.9%, 43.2%),
// derecha ("Mascotas") en (85.5%, 55.3%). Estos valores no cambiaron.
const NAV_ITEMS = [
  {
    key: "characters",
    iconSrc: "/nav/bag-red.png",
    iconSize: "52px",
    iconTop: "1px",
    label: "Tienda",
    top: "55.3%",
    left: "14.3%",
    width: "23%",
  },
  {
    key: "habits",
    iconSrc: "/nav/star-pink.png",
    iconSize: "80px",
    iconTop: "16px",
    label: "Hábitos",
    sublabel: "⭐ 1",
    top: "43.2%",
    left: "49.9%",
    width: "35%",
    size: "lg",
  },
  {
    key: "shop",
    iconSrc: "/nav/cat-purple.png",
    iconSize: "51px",
    iconTop: "3px",
    label: "Mascotas",
    top: "55.3%",
    left: "85.5%",
    width: "23%",
  },
];

// aspectRatio fija el alto del contenedor exactamente al del PNG
// (2400x927), así la capa de vidrio (posicionada con inset-0) y el
// trazo (w-full, alto automático) quedan perfectamente alineados.
const FRAME_ASPECT_RATIO = "2400 / 927";

// Recorte de cada marco (bounding box en % del contenedor), medido
// escaneando el canal alfa de marcos-botones.png. mask-size/mask-position
// son una técnica de "sprite": muestran la máscara completa (marcos-fill-mask.png)
// a la escala real del contenedor pero recortada a la ventana de este botón,
// para que CADA marco tenga su propia pieza de vidrio independiente — y por
// lo tanto su propio box-shadow inset (el brillo superior y la sombra
// cálida inferior no se pueden repartir correctamente en un solo div que
// cubra los 3 marcos, ya que el inset shadow sigue el rectángulo del
// elemento, no la silueta enmascarada).
const GLASS_FRAMES = [
  {
    key: "characters",
    left: "2.79%",
    top: "32.69%",
    width: "22.96%",
    height: "45.31%",
    maskSize: "435.54% 220.70%",
    maskPosition: "3.62% 59.77%",
  },
  {
    key: "habits",
    left: "32.38%",
    top: "13.38%",
    width: "34.96%",
    height: "59.65%",
    maskSize: "286.04% 167.64%",
    maskPosition: "49.78% 33.16%",
  },
  {
    key: "shop",
    left: "74.00%",
    top: "32.69%",
    width: "22.96%",
    height: "45.31%",
    maskSize: "435.54% 220.70%",
    maskPosition: "96.05% 59.77%",
  },
];

// Mismos valores de sombra/brillo exactos que LevelBar.jsx y ThemeBar.jsx:
// brillo blanco superior + sombra cálida inferior, para un volumen 3D
// consistente en toda la app.
const GLASS_SHADOW =
  "bg-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-6px_10px_rgba(180,120,70,0.25)] backdrop-blur-md drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)]";

export default function BottomNav({ activeModal, onSelect }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: FRAME_ASPECT_RATIO }}>
      {/* Vidrio: una pieza independiente por marco, cada una recortada a
          su propia silueta exacta (ver GLASS_FRAMES arriba). */}
      {GLASS_FRAMES.map((frame) => (
        <div
          key={frame.key}
          style={{
            left: frame.left,
            top: frame.top,
            width: frame.width,
            height: frame.height,
            maskImage: "url(/nav/marcos-fill-mask.png)",
            WebkitMaskImage: "url(/nav/marcos-fill-mask.png)",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskSize: frame.maskSize,
            WebkitMaskSize: frame.maskSize,
            maskPosition: frame.maskPosition,
            WebkitMaskPosition: frame.maskPosition,
          }}
          className={`absolute ${GLASS_SHADOW}`}
        />
      ))}

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
          iconSrc={item.iconSrc}
          iconSize={item.iconSize}
          iconTop={item.iconTop}
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
