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
//     SVG — un `stroke` con el gradiente GLASS_BEVEL_GRADIENT_ID (3
//     paradas: blanco arriba-izquierda → transparente → negro abajo-
//     derecha) para simular a la vez el bisel de luz Y su contrapunto
//     de sombra/refracción, y un <filter> de SVG con <feDropShadow>
//     (atributo `filter="url(#...)"`, NO la propiedad CSS
//     `filter: drop-shadow(...)`: esa depende de que el navegador deje
//     "escapar" el efecto del viewport del <svg> vía overflow:visible, y
//     es justo el tipo de cosa que varía entre motores de renderizado)
//     para la sombra exterior.
//
//     El relleno + backdrop-blur de esas dos formas se resuelven
//     distinto según si el tamaño es fijo o responsive:
//       - Burbuja "Chat Pet" (tamaño fijo, 140x51.33px): un <div> real
//         con `clip-path: path(...)` + `background` + `backdrop-filter`
//         + `isolation: isolate` — backdrop-filter sobre un <path> de
//         SVG puro es menos confiable entre navegadores que sobre un
//         elemento HTML normal recortado con clip-path (mismo tipo de
//         problema que ya resolvimos con feDropShadow vs. filter CSS).
//         El SVG queda solo para el trazo del bisel y la sombra, encima
//         de ese div.
//       - Panel del Dock (ancho responsive, se estira con el viewport):
//         clip-path necesita coordenadas en px fijos, así que no es
//         directamente aplicable sin volver el dock de ancho fijo — se
//         mantiene el fill/backdrop-filter sobre el <path>, con los
//         valores de blur reforzados (25px/200%, igual que el resto).
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
const CHAT_BUBBLE_SHADOW_FILTER_ID = "glass-shadow-bubble";
const DOCK_SHADOW_FILTER_ID = "glass-shadow-dock";

// FONDO DE PRUEBA TEMPORAL — solo para verificar el backdrop-blur/
// transparencia del Liquid Glass; NO es el fondo final de la app (eso
// sigue sin definirse). Un degradado liso no sirve para esto: el blur
// no se nota si no hay detalle de alta frecuencia detrás para
// suavizar, así que son varios blobs radiales de colores saturados con
// el borde bien marcado (transición de solo 1% entre color y
// transparente) — un "wallpaper" con formas, no un gradiente continuo.
// Reemplazar/quitar cuando se defina el fondo real de la app.
const QA_TEST_BACKGROUND = `
  radial-gradient(circle at 18% 12%, #ff2d78 0%, #ff2d78 17%, transparent 18%),
  radial-gradient(circle at 82% 8%, #00e5ff 0%, #00e5ff 14%, transparent 15%),
  radial-gradient(circle at 12% 52%, #ffb020 0%, #ffb020 19%, transparent 20%),
  radial-gradient(circle at 88% 46%, #7c3aed 0%, #7c3aed 21%, transparent 22%),
  radial-gradient(circle at 38% 82%, #22d3a5 0%, #22d3a5 17%, transparent 18%),
  radial-gradient(circle at 92% 88%, #ff2d78 0%, #ff2d78 15%, transparent 16%),
  radial-gradient(circle at 55% 35%, #fde047 0%, #fde047 12%, transparent 13%),
  linear-gradient(135deg, #1a1a2e, #16213e)
`;

export default function MainLayout() {
  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-white"
      style={{ background: QA_TEST_BACKGROUND }}
    >
      {/* Definición compartida del degradado del bisel: blanco 50% en la
          esquina superior-izquierda (el brillo), transparente a mitad de
          camino, negro 50% en la esquina inferior-derecha (el
          contrapunto de sombra/refracción) — misma fuente de luz fija
          arriba-izquierda que el inset blanco/negro de .liquid-glass-btn
          en globals.css. Reutilizada por la burbuja y el panel del Dock. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={GLASS_BEVEL_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
          {/* <feDropShadow> nativo en vez de la propiedad CSS
              filter: drop-shadow(...): esa depende de que el motor de
              renderizado deje "escapar" el efecto del viewport del
              <svg> (vía overflow:visible), algo que varía entre
              navegadores. Con una región de filtro explícita (x/y/
              width/height ampliados al 300%/-100%) el efecto siempre
              tiene espacio de sobra y no depende de ese comportamiento. */}
          <filter id={CHAT_BUBBLE_SHADOW_FILTER_ID} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          <filter id={DOCK_SHADOW_FILTER_ID} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.37" />
          </filter>
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
          mascota, top=28.67%. Contenedor de 140x51.33px (el tamaño ya
          validado en fases anteriores): adentro, un <div> con
          clip-path recortado a la silueta exacta de la cápsula+cola
          (a su tamaño nativo 240x88, achicado con transform:scale al
          tamaño real vía transform-origin top-left) resuelve el fill +
          backdrop-blur; el SVG apilado encima (mismo tamaño, sin fill)
          agrega el trazo del bisel y la sombra proyectada. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <div className="relative" style={{ width: 140, height: 51.33 }}>
          <div
            className="absolute left-0 top-0"
            style={{
              width: 240,
              height: 88,
              transform: `scale(${140 / 240})`,
              transformOrigin: "top left",
              clipPath: `path("${CHAT_BUBBLE_PATH}")`,
              isolation: "isolate",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(25px) saturate(200%)",
              WebkitBackdropFilter: "blur(25px) saturate(200%)",
            }}
          />
          <svg
            viewBox="0 0 240 88"
            width="140"
            height="51.33"
            className="absolute inset-0"
            style={{ overflow: "visible" }}
          >
            <path
              d={CHAT_BUBBLE_PATH}
              fill="none"
              stroke={`url(#${GLASS_BEVEL_GRADIENT_ID})`}
              strokeWidth="1.5"
              filter={`url(#${CHAT_BUBBLE_SHADOW_FILTER_ID})`}
            />
          </svg>
        </div>
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
          fill="rgba(255,255,255,0.12)"
          stroke={`url(#${GLASS_BEVEL_GRADIENT_ID})`}
          strokeWidth="1.5"
          filter={`url(#${DOCK_SHADOW_FILTER_ID})`}
          style={{
            isolation: "isolate",
            backdropFilter: "blur(25px) saturate(200%)",
            WebkitBackdropFilter: "blur(25px) saturate(200%)",
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
