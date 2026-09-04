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

// Burbuja "Chat Pet" — reemplazo directo por el path SVG exacto que pasó
// el usuario (reconstruido: el mensaje se cortó a mitad del último
// comando; el resto se completó seguro porque es la construcción
// estándar de esquina redondeada con Bézier — el offset de control
// 19.33/15.67 es exactamente r*0.5523/r*0.4477 con r=35, la constante
// "kappa" para aproximar un cuarto de círculo — y se confirmó
// renderizando el path aislado contra la imagen de referencia antes de
// integrarlo: coincide). viewBox nativo 240x88 (medido con getBBox, no
// estimado); se muestra a 140px de ancho manteniendo la proporción
// exacta (140 * 88/240 ≈ 51px de alto) para conservar el tamaño/posición
// ya validado en el wireframe.
const CHAT_BUBBLE_PATH =
  "M35 0H205C224.33 0 240 15.67 240 35C240 54.33 224.33 70 205 70H118C114 70 109 72 105 78C101 84 96 88 92 88C90 88 91 82 93 76C94.5 71.5 92 70 88 70H35C15.67 70 0 54.33 0 35C0 15.67 15.67 0 35 0Z";

// Panel/pestaña inferior (Dock) — corrección de capas: el botón Home NO
// forma parte de esta estructura. Antes el panel y el botón compartían
// radio (con solo 1px de diferencia) y un mismo grupo de opacidad para
// que sus bordes se disimularan al tocarse — eso era justamente la
// "fusión" que había que eliminar. Ahora son dos objetos CSS totalmente
// separados: el panel tiene una muesca cóncava con un radio DE VERDAD
// más grande que el del botón (40px vs. 30px, 10px de margen limpio en
// todo el contorno), así que el botón queda flotando libre dentro del
// hueco sin tocar el borde de la muesca en ningún punto — no hace falta
// ningún truco de subpíxel porque no hay ningún borde compartido.
//
// Geometría del panel (sistema de referencia 390x844, centrado en
// x=195/y=744 — el mismo punto donde flota el centro del botón): borde
// plano en y=748.03px (88.63%), muesca de radio 40px con fillet de 16px
// tangente a la línea plana, esquinas superiores externas de 20px. Sus 3
// piezas (costado izquierdo, panel central con la muesca, costado
// derecho) sí van agrupadas con opacity-10 + negro opaco — eso es
// solamente para que el panel no tenga costuras CONSIGO MISMO; el grupo
// no incluye al botón.
const DOCK_TOP = "88.63%"; // borde plano del panel = 748.03px/844
const DOCK_NOTCH_WIDTH = 150; // ancho fijo del panel central, en px
const DOCK_SIDE_WIDTH = "calc(50% - 70px)"; // 5px de solape bajo el panel central
const DOCK_NOTCH_PATH =
  "M0,0 L22.7,0 A16,16 0 0 1 37.65,10.28 A40,40 0 0 0 112.35,10.28 A16,16 0 0 1 127.3,0 L150,0 L150,1000 L0,1000 Z";

// Botón Home — elemento circular independiente, flotando en el hueco del
// panel (no forma parte de su estructura ni comparte grupo de opacidad).
// Tamaño exacto pedido: 60x60px. Centrado en el mismo punto (x=195/y=744)
// que usa la geometría del panel para calcular la muesca, así que top
// = (744-30)px = 714px/844 = 84.60%.
const HOME_BUTTON_TOP = "84.60%";

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
          mascota, top=28.67%. Path SVG exacto pedido (ver CHAT_BUBBLE_PATH
          arriba), no una forma aproximada con CSS. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <svg viewBox="0 0 240 88" width="140" height="51.33">
          <path d={CHAT_BUBBLE_PATH} className="fill-black/10" />
        </svg>
      </div>

      {/* Racha/Inventario: píldora ancha (235x40px) + círculo chico
          (39x40px) a su derecha con 9px de separación, centrados como
          grupo, top=66.35% — justo arriba del dock. Contenedor vacío;
          contenido/ícono llegan en Fase 2. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className={`h-10 w-[235px] rounded-full ${PLACEHOLDER}`} />
        <div className={`h-10 w-[39px] rounded-full ${PLACEHOLDER}`} />
      </div>

      {/* Panel/pestaña inferior (Dock): costados planos con las esquinas
          superiores externas redondeadas + panel central con la muesca
          cóncava (10px de margen limpio alrededor de donde flotará el
          botón — ver comentario de la geometría arriba). Es una capa de
          fondo, separada del botón; va en negro opaco + opacity-10 SOLO
          para que sus propias 3 piezas no tengan costuras entre sí. */}
      <div className="absolute inset-x-0 bottom-0 z-20 opacity-10" style={{ top: DOCK_TOP }}>
        <div
          className="absolute inset-y-0 left-0 rounded-tl-[20px] bg-black"
          style={{ width: DOCK_SIDE_WIDTH }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-tr-[20px] bg-black"
          style={{ width: DOCK_SIDE_WIDTH }}
        />
        <svg
          viewBox={`0 0 ${DOCK_NOTCH_WIDTH} 1000`}
          width={DOCK_NOTCH_WIDTH}
          height={1000}
          className="absolute left-1/2 top-0 -translate-x-1/2"
        >
          <path d={DOCK_NOTCH_PATH} fill="black" />
        </svg>
      </div>

      {/* Botón Home: círculo independiente (60x60px), sin compartir capa,
          grupo ni radio con el panel — flota libre en su hueco. */}
      <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: HOME_BUTTON_TOP }}>
        <div className={`h-[60px] w-[60px] rounded-full ${PLACEHOLDER}`} />
      </div>
    </div>
  );
}
