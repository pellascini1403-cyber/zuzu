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

// Recorte del dock: la referencia de fondo negro muestra que el fondo del
// dock NO es un rectángulo sólido — tiene las esquinas superiores
// redondeadas (~8px, medido por fila hasta que el borde izquierdo/derecho
// llega a x=0/x=390) y un recorte circular en el centro (~58px de radio,
// centrado en x=50%, con el centro del círculo ~7px por encima del borde
// superior del dock) donde se integra el botón Home. Los valores salen de
// ajustar por mínimos cuadrados un círculo a los píxeles de borde del
// recorte (scan fila por fila del canal de brillo). mask-image con un
// radial-gradient de 2 stops reproduce ese recorte sin necesitar un SVG.
const DOCK_NOTCH_MASK = "radial-gradient(circle at 50% -7px, transparent 58px, black 59px)";

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

      {/* Zona Central: caja "Chat Pet", centrada sobre la mascota.
          Medida de referencia: 118x48px, top=28.67%. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <div className={`h-[48px] w-[118px] rounded-2xl ${PLACEHOLDER}`} />
      </div>

      {/* Racha/Inventario: píldora ancha (235x40px) + círculo chico
          (39x40px) a su derecha con 9px de separación, centrados como
          grupo, top=66.35% — justo arriba del dock. Contenedor vacío;
          contenido/ícono llegan en Fase 2. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className={`h-10 w-[235px] rounded-full ${PLACEHOLDER}`} />
        <div className={`h-10 w-[39px] rounded-full ${PLACEHOLDER}`} />
      </div>

      {/* Barra Inferior (Dock): ancho completo desde top=88.63% hasta el
          borde inferior, con esquinas superiores redondeadas y un recorte
          circular (DOCK_NOTCH_MASK) donde se integra el botón Home — ya
          no un bloque rectangular sólido. Botón circular principal
          ("Home"): 84x84px, centrado horizontalmente, top=83.18%, por
          encima del dock (z-30) para quedar parcialmente incrustado en
          el recorte, igual que en la referencia. */}
      <div
        className={`absolute inset-x-0 bottom-0 top-[88.63%] z-20 rounded-t-[8px] ${PLACEHOLDER}`}
        style={{ maskImage: DOCK_NOTCH_MASK, WebkitMaskImage: DOCK_NOTCH_MASK }}
      />
      <div className="absolute inset-x-0 top-[83.18%] z-30 flex justify-center">
        <div className={`h-[84px] w-[84px] rounded-full ${PLACEHOLDER}`} />
      </div>
    </div>
  );
}
