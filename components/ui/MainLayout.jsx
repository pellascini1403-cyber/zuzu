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

// Muesca del dock — la hendidura cóncava clásica de iOS. Historial de los
// dos errores previos, para no repetirlos:
//   1. mask-image con un círculo más grande: dejaba un hueco/"moat" entre
//      el botón y el borde del recorte.
//   2. Arcos de transición (fillet) con el centro POR ENCIMA de la línea
//      del dock: eso hacía que el borde SUBIERA antes de encontrarse con
//      el botón — la "deformación hacia arriba". La curva correcta tiene
//      el centro del fillet POR DEBAJO de la línea, así el borde BAJA
//      hacia adentro del material y el botón encaja en la hendidura.
//
// Geometría (resuelta analíticamente, sistema de referencia 390x844):
// botón R=42px centrado en x=195/y=744; borde plano del dock en y=748.03;
// fillet de radio 18px tangente a la vez a la línea plana y al círculo del
// botón (sin hueco ni salto); esquinas superiores externas de 20px. La
// hendidura baja 37.97px por debajo de la línea del dock y el botón
// sobresale 46px por encima.
//
// El dock se arma en 3 piezas (costado izquierdo plano, panel central con
// la hendidura, costado derecho plano) + el botón, TODAS dentro de un
// grupo con opacity-10 y pintadas en negro opaco. Ese detalle importa:
// dos formas traslúcidas que se solapan no se funden, se OSCURECEN
// (alpha compositing), y si en cambio se las hace apenas tocar, cualquier
// desajuste de subpíxel deja una costura de 1px. Con la transparencia
// aplicada una sola vez al grupo, las piezas pueden solaparse sin
// artefactos — por eso los costados se meten 5px por debajo del panel
// central. Además el panel central tiene ancho FIJO (no se estira con el
// viewport), así la hendidura calza exacto con el botón en cualquier
// ancho de pantalla; sólo los costados planos escalan.
// El grupo arranca en el borde superior del botón (top=83.18%) y de ahí
// para abajo todo se mide en px fijos: así la relación botón/hendidura/
// dock no depende de la altura del dispositivo.
const DOCK_GROUP_TOP = "83.18%"; // borde superior del botón = 702px/844
const DOCK_BAR_OFFSET = "46px"; // del borde del botón al borde plano del dock (748.03-702)
const DOCK_NOTCH_WIDTH = 130; // ancho fijo del panel central, en px
const DOCK_SIDE_WIDTH = "calc(50% - 60px)"; // 5px de solape bajo el panel central
// Coordenadas locales del panel: x = global - 130, y = global - 748.03. El
// arco de la hendidura usa radio 41 (1px menos que el botón) a propósito:
// con radios idénticos los dos bordes coinciden exacto y el antialiasing
// de cada uno no llega a sumar cobertura completa, dejando un hilo blanco
// visible; con 1px de menos el botón pisa ese borde y, al estar todo en
// el mismo grupo de opacidad, el solape no oscurece nada.
const DOCK_NOTCH_PATH =
  "M0,0 L10.27,0 A18,18 0 0 1 26.97,11.28 A41,41 0 0 0 103.03,11.28 A18,18 0 0 1 119.73,0 L130,0 L130,1000 L0,1000 Z";

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

      {/* Barra Inferior (Dock) + botón Home. Todo el grupo va en negro
          opaco con opacity-10 (ver comentario de la geometría arriba):
          costados planos con las esquinas superiores externas
          redondeadas, panel central con la hendidura cóncava, y el botón
          circular encajado en el centro de esa hendidura, sobresaliendo
          por arriba. */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 opacity-10"
        style={{ top: DOCK_GROUP_TOP }}
      >
        <div
          className="absolute bottom-0 left-0 rounded-tl-[20px] bg-black"
          style={{ top: DOCK_BAR_OFFSET, width: DOCK_SIDE_WIDTH }}
        />
        <div
          className="absolute bottom-0 right-0 rounded-tr-[20px] bg-black"
          style={{ top: DOCK_BAR_OFFSET, width: DOCK_SIDE_WIDTH }}
        />
        <svg
          viewBox={`0 0 ${DOCK_NOTCH_WIDTH} 1000`}
          width={DOCK_NOTCH_WIDTH}
          height={1000}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: DOCK_BAR_OFFSET }}
        >
          <path d={DOCK_NOTCH_PATH} fill="black" />
        </svg>
        {/* Botón Home: 84x84px, encajado en el centro de la hendidura. */}
        <div className="absolute left-1/2 top-0 h-[84px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}
