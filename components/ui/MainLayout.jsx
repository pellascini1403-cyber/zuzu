// FASE 4 — Estilo visual "Liquid Glass" (ver .liquid-glass-btn en
// app/globals.css). Se aplicó a los 9 contenedores maquetados en Fase 1
// (Settings, Perfil, Usuarios, Tokens, Chat Pet, Racha, Inventario, Home
// y el Dock), sin agregar iconos/contenido (Fase 2) ni lógica de
// navegación (Fase 3) — eso sigue pendiente.
//
// Dos tratamientos distintos según la forma:
//   - Formas CSS simples (círculo, píldora — border-radius): usan la
//     clase global `.liquid-glass-btn` (fondo translúcido + backdrop-
//     blur + box-shadow con el inset superior-izquierdo y la sombra
//     exterior). Ver globals.css.
//   - Formas orgánicas hechas con <path> de SVG (burbuja "Chat Pet",
//     panel del Dock con la muesca): box-shadow NO sigue el contorno
//     real de un path cóncavo, así que usan el equivalente nativo de
//     SVG — fill translúcido, `filter: drop-shadow(...)` (sí seguye la
//     silueta real, a diferencia de box-shadow) para la sombra exterior,
//     y un `stroke` con el gradiente GLASS_BEVEL_GRADIENT_ID para el
//     bisel superior-izquierdo (el mismo degradado, aplicado como trazo
//     en vez de inset shadow). Verificado aislado antes de integrar:
//     misma técnica que ya se usó para resolver los arcos/costuras del
//     dock y la cola de la burbuja en fases anteriores.
//
// Medidas/posiciones: sin cambios respecto a Fase 1 (ver historial de
// commits) — este paso es solo estilo visual.
const CHAT_BUBBLE_PATH =
  "M35 0H205C224.33 0 240 15.67 240 35C240 54.33 224.33 70 205 70H118C114 70 109 72 105 78C101 84 96 88 92 88C90 88 91 82 93 76C94.5 71.5 92 70 88 70H35C15.67 70 0 54.33 0 35C0 15.67 15.67 0 35 0Z";

// Panel del Dock: antes eran 3 piezas (2 costados + 1 SVG central)
// unidas con el truco de "todo en un mismo grupo opacity-10 + negro
// opaco" para que no aparecieran costuras entre ellas. Para el acabado
// de vidrio esa unión ya no alcanza (necesitamos fill translúcido real +
// drop-shadow + bisel, no un simple negro plano), así que el panel
// entero — costados, esquinas redondeadas de 20px y la muesca — se
// unificó en un solo <path> (mismos arcos/fillet ya validados en
// DOCK_NOTCH_PATH, con las esquinas exteriores agregadas al mismo path
// en vez de en divs aparte). Verificado aislado: sin costuras.
const DOCK_PATH =
  "M0,20 A20,20 0 0 1 20,0 L142.7,0 A16,16 0 0 1 157.65,11.28 A40,40 0 0 0 232.35,11.28 A16,16 0 0 1 247.3,0 L370,0 A20,20 0 0 1 390,20 L390,1000 L0,1000 Z";
const DOCK_TOP = "88.63%"; // borde plano del panel = 748.03px/844

// Botón Home — sin cambios de geometría (60x60px, independiente del
// panel, 10px de margen limpio en toda la muesca).
const HOME_BUTTON_TOP = "84.60%";

const GLASS_BEVEL_GRADIENT_ID = "glass-bevel";

export default function MainLayout() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
      {/* Definición compartida del degradado del bisel (blanco 60% en la
          esquina superior-izquierda, desvanecido a transparente hacia
          abajo-derecha), reutilizada por la burbuja y el panel del Dock. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={GLASS_BEVEL_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Barra Superior (Header). Medidas de referencia: círculo 40x40px
          en cada esquina (top=1.9%, left/right=4.1%), píldora 70x40px
          debajo de cada uno con 8px de separación (top=7.46%). */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col items-start gap-2">
          {/* Settings */}
          <div className="liquid-glass-btn h-10 w-10 rounded-full" />
          {/* Usuarios */}
          <div className="liquid-glass-btn h-10 w-[70px] rounded-full" />
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Perfil */}
          <div className="liquid-glass-btn h-10 w-10 rounded-full" />
          {/* Tokens */}
          <div className="liquid-glass-btn h-10 w-[70px] rounded-full" />
        </div>
      </div>

      {/* Zona Central: burbuja de diálogo "Chat Pet", centrada sobre la
          mascota, top=28.67%. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <svg viewBox="0 0 240 88" width="140" height="51.33" style={{ overflow: "visible" }}>
          <path
            d={CHAT_BUBBLE_PATH}
            fill="rgba(255,255,255,0.08)"
            stroke={`url(#${GLASS_BEVEL_GRADIENT_ID})`}
            strokeWidth="1.5"
            style={{
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.37))",
            }}
          />
        </svg>
      </div>

      {/* Racha/Inventario: píldora ancha (235x40px) + círculo chico
          (39x40px) a su derecha con 9px de separación, centrados como
          grupo, top=66.35% — justo arriba del dock. Contenido/ícono
          llegan en Fase 2. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className="liquid-glass-btn h-10 w-[235px] rounded-full" />
        <div className="liquid-glass-btn h-10 w-[39px] rounded-full" />
      </div>

      {/* Panel/pestaña inferior (Dock): una sola pieza (ver DOCK_PATH
          arriba) con esquinas superiores redondeadas y la muesca cóncava
          que deja 10px de margen limpio alrededor de donde flota el
          botón Home — sin fusionarse con él. */}
      <svg
        viewBox="0 0 390 1000"
        preserveAspectRatio="none"
        className="absolute inset-x-0 z-20 h-[1000px] w-full"
        style={{ top: DOCK_TOP, overflow: "visible" }}
      >
        <path
          d={DOCK_PATH}
          fill="rgba(255,255,255,0.08)"
          stroke={`url(#${GLASS_BEVEL_GRADIENT_ID})`}
          strokeWidth="1.5"
          style={{
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.37))",
          }}
        />
      </svg>

      {/* Botón Home: círculo independiente (60x60px), sin compartir capa
          ni radio con el panel — flota libre en su hueco. */}
      <div className="absolute inset-x-0 z-30 flex justify-center" style={{ top: HOME_BUTTON_TOP }}>
        <div className="liquid-glass-btn h-[60px] w-[60px] rounded-full" />
      </div>
    </div>
  );
}
