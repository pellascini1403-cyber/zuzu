import NavButton from "./NavButton";
import { GLASS_BG } from "@/lib/glass";

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

// Recorte de cada marco (bounding box en % del contenedor), medido con
// scipy.ndimage.label sobre el canal alfa de marcos-botones.png para
// obtener los 3 componentes conectados exactos (más preciso que escanear
// una banda de ancho asumido, que había recortado ~1% de cada lado y
// dejaba un hueco visible entre el relleno y el borde). mask-size/
// mask-position son una técnica de "sprite": muestran la máscara completa
// (marcos-fill-mask.png) a la escala real del contenedor pero recortada a
// la ventana de este botón, para que CADA marco tenga su propia pieza de
// vidrio independiente — y por lo tanto su propio box-shadow inset (el
// inset superior y la sombra cálida inferior no se pueden repartir
// correctamente en un solo div que cubra los 3 marcos, ya que el inset
// shadow sigue el rectángulo del elemento, no la silueta enmascarada).
const GLASS_FRAMES = [
  {
    key: "characters",
    left: "2.583%",
    top: "32.686%",
    width: "23.375%",
    height: "45.307%",
    maskSize: "427.81% 220.72%",
    maskPosition: "3.37% 59.76%",
  },
  {
    key: "habits",
    left: "31.292%",
    top: "13.376%",
    width: "37.167%",
    height: "59.655%",
    maskSize: "269.06% 167.63%",
    maskPosition: "49.80% 33.15%",
  },
  {
    key: "shop",
    left: "73.792%",
    top: "32.686%",
    width: "23.375%",
    height: "45.307%",
    maskSize: "427.81% 220.72%",
    maskPosition: "96.30% 59.76%",
  },
];

// Mismos valores de sombra/fondo que LevelBar.jsx y ThemeBar.jsx: base
// blanca translúcida sutil (GLASS_BG) con un inset oscuro arriba (en vez
// del brillo blanco original) que oscurece el centro del botón para que
// el texto blanco resalte, más la sombra cálida inferior que le da
// volumen 3D. El borde blanco translúcido del botón lo
// aporta la imagen del marco (marcos-botones.png), no un border CSS acá.
const GLASS_SHADOW =
  `${GLASS_BG} shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25)] backdrop-blur-md drop-shadow-[0_6px_12px_rgba(0,0,0,0.06)]`;

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
