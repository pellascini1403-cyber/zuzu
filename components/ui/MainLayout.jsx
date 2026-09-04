// FASE 1 — Maquetación base (wireframe de posiciones). Rediseño desde
// cero: se descartó toda la UI de cristal anterior (TopBar/BottomNav/
// NavButton/LevelBar/ThemeBar/PetStage/SpeechBubble/BackgroundLayer, ver
// commit de este cambio). Por ahora todos los contenedores son cajas
// vacías con el mismo fondo gris neutro de baja opacidad — sin iconos,
// sin texto, sin efecto de cristal ni lógica de navegación. Eso llega en
// fases posteriores:
//   Fase 2 — iconografía/símbolos/contenido interno.
//   Fase 3 — modales, pestañas y lógica de navegación.
//   Fase 4 — estilo visual final (Liquid Glass, transparencias, blur).
//
// Medidas: cada caja está ubicada según el análisis de componentes
// conectados (scipy.ndimage.label) sobre la imagen de referencia de Fase 1
// (390x844px, proporción iPhone estándar; primero sobre el canal alfa de
// la versión casi transparente, y luego reconfirmado con la versión de
// fondo negro/alto contraste — ambas coinciden en las mismas posiciones).
// El ancho/alto de cada caja es un tamaño fijo en px (igual que en la
// referencia); la posición vertical (top) es un % de la altura del
// viewport, mismo criterio que ya usaba el resto de la app para que
// escale con `h-[100dvh]` en cualquier dispositivo.
//
// El modelo 3D se removió por completo de esta fase (pedido explícito):
// el área central queda vacía/transparente, sin ningún contenedor —
// nada más se posiciona relativo a ella.
const PLACEHOLDER = "bg-black/10";

// Recorte del dock — corregido dos veces: (1) el intento con mask-image
// circular dejaba un "moat"/hueco vacío entre el botón y el borde del
// recorte; (2) el primer intento en SVG con 4 piezas independientes
// (costados + panel + relleno inferior) eliminaba el hueco pero dejaba
// una costura de 1px entre piezas — dos formas traslúcidas (bg-black/10)
// que se solapan o casi-tocan no se funden en una sola, se OSCURECEN al
// superponerse (alpha compositing), así que cualquier desajuste de
// subpíxel entre un ancho en % y uno en px quedaba visible como una
// línea. La solución real es dibujar el dock ENTERO —costados, esquinas
// redondeadas y la muesca que abraza el botón— como un único <path>, sin
// piezas separadas que puedan desalinearse.
//
// Geometría (calculada una sola vez, sistema de referencia 390x844):
// botón R=42px centrado en x=195/y=744; borde plano del dock en y=748.03;
// fillet (transición cóncava tangente entre la línea plana y el círculo
// del botón) de radio 18px; esquinas superiores externas con radio 24px.
// El viewBox usa ancho=390 (mapeado a 100% via preserveAspectRatio="none"
// para que escale con el viewport real — solo estira levemente el ancho,
// el alto no se toca) y un alto fijo bien generoso (1000 unidades = 1000px
// reales, sin escalar) para que el rectángulo inferior del dock llegue de
// sobra hasta el borde de cualquier pantalla; lo que sobra lo recorta el
// overflow-hidden del contenedor raíz.
const DOCK_VIEWBOX = "0 0 390 1000";
const DOCK_PATH =
  "M0,72.03 A24,24 0 0 1 24,48.03 L136.65,48.03 A18,18 0 0 0 154.15,34.22 A42,42 0 0 1 235.85,34.22 A18,18 0 0 0 253.35,48.03 L366,48.03 A24,24 0 0 1 390,72.03 L390,1000 L0,1000 Z";
const DOCK_TOP = "82.94%"; // el y=0 local del viewBox corresponde a global 700px/844

export default function MainLayout() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      {/* Barra Superior (Header). Medidas de referencia: círculo 40x40px
          en cada esquina (top=1.9%, left/right=4.1%), píldora 70x40px
          debajo de cada uno con 8px de separación (top=7.46%). */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col items-start gap-2">
          {/* Settings */}
          <div className={`h-10 w-10 rounded-full ${PLACEHOLDER}`} />
          {/* Usuarios */}
          <div className={`h-10 w-[70px] rounded-full ${PLACEHOLDER}`} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Perfil */}
          <div className={`h-10 w-10 rounded-full ${PLACEHOLDER}`} />
          {/* Tokens */}
          <div className={`h-10 w-[70px] rounded-full ${PLACEHOLDER}`} />
        </div>
      </div>

      {/* Zona Central: burbuja de diálogo "Chat Pet", centrada sobre la
          mascota. Medida de referencia: 118x48px, top=28.67% — corregida
          para incluir el pico/puntero triangular apuntando hacia abajo
          (hacia el modelo 3D), no una píldora plana. El pico es el truco
          clásico de borde CSS (div de 0x0 con borde transparente a los
          costados y borde sólido arriba); -mt-px lo pega al cuerpo de la
          burbuja sin dejar costura. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <div className="relative">
          <div className={`h-[48px] w-[118px] rounded-2xl ${PLACEHOLDER}`} />
          <div className="absolute left-1/2 top-full -mt-px h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-black/10" />
        </div>
      </div>

      {/* Racha/Inventario: píldora ancha (235x40px) + círculo chico
          (39x40px) a su derecha con 9px de separación, centrados como
          grupo, top=66.35% — justo arriba del dock. Contenedor vacío;
          contenido/ícono llegan en Fase 2. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className={`h-10 w-[235px] rounded-full ${PLACEHOLDER}`} />
        <div className={`h-10 w-[39px] rounded-full ${PLACEHOLDER}`} />
      </div>

      {/* Barra Inferior (Dock): una sola pieza (ver DOCK_PATH arriba) con
          esquinas superiores redondeadas y la muesca que abraza el botón
          Home sin hueco. Botón circular "Home" (84x84px, top=83.18%, sin
          cambios) va por encima (z-30) y su mitad inferior queda
          visualmente incrustada en la muesca. */}
      <svg
        viewBox={DOCK_VIEWBOX}
        preserveAspectRatio="none"
        className="absolute inset-x-0 z-20 h-[1000px] w-full"
        style={{ top: DOCK_TOP }}
      >
        <path d={DOCK_PATH} className="fill-black/10" />
      </svg>
      <div className="absolute inset-x-0 top-[83.18%] z-30 flex justify-center">
        <div className={`h-[84px] w-[84px] rounded-full ${PLACEHOLDER}`} />
      </div>
    </div>
  );
}
