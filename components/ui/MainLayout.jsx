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
