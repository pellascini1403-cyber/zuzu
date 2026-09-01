import { UI_TEXT_STYLE } from "@/lib/typography";

// Overlay sobre el marco de BottomNav.jsx: solo ícono y texto, sin
// forma ni relleno propio (el vidrio ahora es una sola pieza a tamaño
// completo en BottomNav.jsx, enmascarada con la silueta real de los 3
// marcos — no hay círculos/burbujas sueltas aquí). Posición y trazo
// blanco no cambian en este ajuste.
export default function NavButton({
  icon,
  iconSrc,
  iconSize,
  iconTop,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
  top,
  left,
  width,
}) {
  const isLg = size === "lg";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ top, left, width }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 bg-transparent transition-transform active:scale-95 ${active ? "scale-110" : ""}`}
    >
      {iconSrc ? (
        <>
          {/* Reserva el mismo espacio vertical que ocupaba el badge
              circular anterior, para que la etiqueta y el contador
              mantengan su posición centrada dentro del marco. */}
          <span aria-hidden="true" className={isLg ? "block h-16 w-16" : "block h-8 w-8"} />
          {/* Asset propio: tamaño (iconSize) y posición vertical (iconTop,
              con -translate-y-1/2) medidos por botón contra la imagen de
              referencia de cada ícono, para calcar su escala/ubicación
              relativa al marco de cristal. El contenedor (este botón y
              BottomNav) no tiene overflow-hidden, así que si el ícono
              sobresale del marco no se recorta. */}
          <img
            src={iconSrc}
            alt=""
            draggable={false}
            style={{ top: iconTop, height: iconSize, width: iconSize }}
            className="pointer-events-none absolute -translate-y-1/2 select-none object-contain drop-shadow-[0_8px_14px_rgba(217,119,6,0.35)]"
          />
        </>
      ) : (
        // Vestidor/Tienda: ícono deshabilitado TEMPORALMENTE, a la espera
        // de sus nuevos assets gráficos. El spacer reserva el mismo alto
        // que ocupaba el ícono anterior para que el texto no se mueva.
        // Restaurar aquí con el mismo patrón que iconSrc (o con
        // <span className="text-2xl">{icon}</span> si vuelve a ser un
        // emoji) cuando lleguen los archivos.
        <span aria-hidden="true" className={isLg ? "block h-16 w-16" : "block h-8 w-8"} />
      )}
      <span className={`text-xs ${UI_TEXT_STYLE}`}>{label}</span>
      {sublabel && <span className={`text-[10px] ${UI_TEXT_STYLE}`}>{sublabel}</span>}
    </button>
  );
}
