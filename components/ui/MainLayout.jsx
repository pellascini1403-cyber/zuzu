import PetCanvas from "@/components/3d/PetCanvas";

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
// conectados (scipy.ndimage.label sobre el canal alfa) de la imagen de
// referencia de Fase 1 (390x844px, proporción iPhone estándar). El ancho/
// alto de cada caja es un tamaño fijo en px (igual que en la referencia);
// la posición vertical (top) es un % de la altura del viewport, mismo
// criterio que ya usaba el resto de la app para que escale con
// `h-[100dvh]` en cualquier dispositivo.
const PLACEHOLDER = "bg-black/10";

export default function MainLayout() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      {/* Marco central transparente reservado para el modelo 3D. */}
      <PetCanvas />

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

      {/* Fila sin nombrar en el pedido de Fase 1: píldora ancha (235x40px)
          + círculo chico (39x40px) a su derecha con 9px de separación,
          centrados como grupo, top=66.35% — justo arriba del dock. Se
          deja como contenedor vacío a la espera de que se defina su
          función/contenido en una fase posterior. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className={`h-10 w-[235px] rounded-full ${PLACEHOLDER}`} />
        <div className={`h-10 w-[39px] rounded-full ${PLACEHOLDER}`} />
      </div>

      {/* Barra Inferior (Dock). Fondo del dock: ancho completo, desde
          top=88.63% hasta el borde inferior. Botón circular principal
          ("Home"): 84x84px, centrado horizontalmente, top=83.18% — monta
          sobre el borde superior del dock (por eso z-30, un nivel por
          encima del fondo del dock). */}
      <div className={`absolute inset-x-0 bottom-0 top-[88.63%] z-20 ${PLACEHOLDER}`} />
      <div className="absolute inset-x-0 top-[83.18%] z-30 flex justify-center">
        <div className={`h-[84px] w-[84px] rounded-full ${PLACEHOLDER}`} />
      </div>
    </div>
  );
}
