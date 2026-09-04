"use client";

import { useState } from "react";
import { UI_TEXT_STYLE } from "@/lib/typography";

// Placeholder del contador de tokens — todavía no hay una fuente de
// datos real conectada (eso es Fase 3). Un valor alto a propósito, para
// poder probar el crecimiento hacia la izquierda de la píldora con una
// cifra larga como la del pedido ("1.000.000"). .toLocaleString("es")
// da el separador de miles con puntos.
const TOKEN_COUNT = 1000000;

// Placeholder de jugadores vinculados a esta mascota (1 o 2) — todavía
// sin fuente de datos real (Fase 3) ni fotos subidas. `avatarUrl: null`
// en los 2 es el estado por defecto: PlayerAvatar (abajo) cae a las
// iniciales sobre el degradado rosa (color muestreado de la imagen de
// referencia, rgb(248,180,224)) hasta que haya una URL real que
// mostrar — nunca un ícono de otro botón de la app.
const players = [
  { id: "p1", name: "Jugador 1", initial: "M", avatarUrl: null },
  { id: "p2", name: "Jugador 2", initial: "A", avatarUrl: null },
];

// Aislado a propósito en su propio componente: PlayerAvatar es la ÚNICA
// pieza de la app que lee `players`/`avatarUrl`, así que no hay forma de
// que termine mostrando el ícono de otro botón (como pasó — según
// reportó el usuario — con el ícono de Store, aunque no se encontró tal
// referencia en el código commiteado; probablemente una captura de
// verificación intermedia que se vio por separado). Cada avatar es su
// propio <img> o su propio placeholder, sin compartir el `src` con
// ningún otro componente de la interfaz.
function PlayerAvatar({ player }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white/80">
      {player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt={player.name}
          draggable={false}
          className="h-full w-full select-none object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#ffd6f2] to-[#f8b4e0]">
          <span className={`text-xs ${UI_TEXT_STYLE}`}>{player.initial}</span>
        </span>
      )}
    </span>
  );
}

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
//     El relleno + backdrop-blur de esas dos formas usa un <div> real
//     con `clip-path: path(...)` + `background` + `backdrop-filter` +
//     `isolation: isolate` — backdrop-filter sobre un <path> de SVG
//     puro resultó no ser confiable en todos los casos (mismo tipo de
//     problema que ya resolvimos con feDropShadow vs. filter CSS: en el
//     panel del Dock, aplicarlo directo al <path> lo dejaba sin blur
//     visible pese a estar declarado y computado correctamente). El SVG
//     queda solo para el trazo del bisel y la sombra, apilado encima de
//     ese div.
//
//     clip-path: path(...) usa coordenadas en px fijos — no hay forma
//     de que se extienda con un ancho de viewport variable sin JS. Por
//     eso el panel del Dock (antes 100% de ancho, estirado con
//     preserveAspectRatio="none") pasa a un ancho de referencia fijo de
//     390px, centrado — el mismo ancho contra el que se midió TODA la
//     geometría desde la Fase 1. En los anchos de dispositivo típicos
//     (~360-430px) el desvío es mínimo; si hace falta que cubra el
//     ancho exacto de cada pantalla, la alternativa es medir el ancho
//     real por JS (ResizeObserver) y regenerar el path — no se hizo acá
//     para no introducir esa complejidad sin que se pida explícitamente.
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
// unificó en un solo <path>. Verificado aislado: sin costuras. Ancho
// fijo de 390px (ver comentario más arriba); alto 300px — de sobra para
// cubrir el borde inferior real de cualquier pantalla razonable, el
// resto lo recorta el overflow-hidden del contenedor raíz.
//
// ESTADOS ENCENDIDO/APAGADO — la muesca ya no está fija al centro: hay
// un <path> distinto por cada una de las 3 pestañas (Store/Habits/
// Pets), con el mismo radio/fillet ya validados (R=40, fillet=16) pero
// centrados en la posición horizontal de cada una (cx=88/195/302 — dos
// tercios simétricos del ancho, con margen suficiente para que la
// muesca de las pestañas extremas no choque contra el redondeo de las
// esquinas del dock). Verificados los 3 aislados antes de integrar.
const DOCK_PATHS = {
  store:
    "M0,20 A20,20 0 0 1 20,0 L35.70,0 A16,16 0 0 1 50.65,10.28 A40,40 0 0 0 125.35,10.28 A16,16 0 0 1 140.30,0 L370,0 A20,20 0 0 1 390,20 L390,300 L0,300 Z",
  habits:
    "M0,20 A20,20 0 0 1 20,0 L142.70,0 A16,16 0 0 1 157.65,10.28 A40,40 0 0 0 232.35,10.28 A16,16 0 0 1 247.30,0 L370,0 A20,20 0 0 1 390,20 L390,300 L0,300 Z",
  pets:
    "M0,20 A20,20 0 0 1 20,0 L249.70,0 A16,16 0 0 1 264.65,10.28 A40,40 0 0 0 339.35,10.28 A16,16 0 0 1 354.30,0 L370,0 A20,20 0 0 1 390,20 L390,300 L0,300 Z",
};
const DOCK_TOP = "88.63%"; // borde plano del panel = 748.03px/844

// Botón flotante activo — mismo cy (744) para las 3 pestañas, la
// muesca/burbuja solo se mueve en X. 60x60px, 10px de margen limpio.
const ACTIVE_BUBBLE_TOP = "84.60%";
// Grupo ícono+label de una pestaña inactiva, dentro del cuerpo plano
// del dock (18px debajo del borde superior: (748.03+18)/844).
const INACTIVE_ITEM_TOP = "90.76%";

// Store y Pets: PNGs provistos por el usuario (public/nav/store-icon.png,
// pets-icon.png). Igual que otros assets de este generador en turnos
// anteriores, venían en un lienzo enorme (2560x1440) con el contenido
// real ocupando solo ~21% del ancho — se recortaron al bounding box real
// del canal alfa (+2% de margen) antes de guardarlos, si no el ícono se
// habría visto minúsculo dentro del botón. Object-fit: contain preserva
// su proporción nativa (564x586 y 580x496 respectivamente, no son
// cuadrados) dentro del box cuadrado h-6/h-7 que ya usaban los íconos
// placeholder — mismo tamaño/posición que tenían antes, solo cambia el
// contenido gráfico.
function StoreIcon({ className }) {
  return (
    <img
      src="/nav/store-icon.png"
      alt=""
      draggable={false}
      className={`${className} pointer-events-none select-none object-contain`}
    />
  );
}
function HabitsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M12 3.5 3 11h2.5v8h5v-5.5h3V19h5v-8H21L12 3.5Z" />
    </svg>
  );
}
function PetsIcon({ className }) {
  return (
    <img
      src="/nav/pets-icon.png"
      alt=""
      draggable={false}
      className={`${className} pointer-events-none select-none object-contain`}
    />
  );
}

const NAV_ITEMS = [
  { key: "store", label: "Store", cx: 88, Icon: StoreIcon },
  { key: "habits", label: "Habits", cx: 195, Icon: HabitsIcon },
  { key: "pets", label: "Pets", cx: 302, Icon: PetsIcon },
];

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
  const [activeTab, setActiveTab] = useState("habits");

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
          debajo de cada uno con 8px de separación (top=7.46%). Posición
          confirmada con el usuario (invertía la de Fase 1): Perfil a la
          izquierda, Configuración + Tokens a la derecha. Los 3 PNGs
          (settings/profile/tokens-icon.png) venían con el mismo margen
          transparente enorme que otros assets de este generador — se
          recortaron al bounding box real del canal alfa (+2%) antes de
          guardarlos. object-fit: contain conserva su proporción nativa
          (ninguno de los 3 es cuadrado) dentro del círculo/píldora. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col items-start gap-2">
          {/* Perfil */}
          <div className="liquid-glass-btn flex h-10 w-10 items-center justify-center rounded-full">
            <img
              src="/nav/profile-icon.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-6 w-6 select-none object-contain"
            />
          </div>
          {/* Usuarios: 1 o 2 jugadores (PlayerAvatar, arriba), superpuestos
              (-space-x-2) cuando son 2; un solo círculo centrado cuando
              es 1 (el `flex justify-center` del contenedor lo resuelve
              solo, sin condicional aparte). */}
          <div className="liquid-glass-btn flex h-10 w-[70px] items-center justify-center rounded-full">
            <div className="flex -space-x-2">
              {players.slice(0, 2).map((player) => (
                <PlayerAvatar key={player.id} player={player} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Configuración */}
          <div className="liquid-glass-btn flex h-10 w-10 items-center justify-center rounded-full">
            <img
              src="/nav/settings-icon.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-6 w-6 select-none object-contain"
            />
          </div>
          {/* Tokens: ancho intrínseco (NO fijo) — el ícono va anclado a
              la izquierda del contenido interno, el contador a la
              derecha con su propio padding. El contenedor padre de esta
              columna ya es flex-col items-end, así que el borde derecho
              de la píldora queda anclado (alineado con Configuración,
              arriba) sin código extra: si el contador crece, solo el
              lado izquierdo de la píldora se mueve. whitespace-nowrap +
              padding evita que una cifra larga rompa la forma de la
              cápsula. */}
          <div className="liquid-glass-btn flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-1 pr-3">
            <img
              src="/nav/tokens-icon.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-7 w-7 shrink-0 select-none object-contain"
            />
            <span className={`text-sm ${UI_TEXT_STYLE}`}>{TOKEN_COUNT.toLocaleString("es")}</span>
          </div>
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

      {/* Panel/pestaña inferior (Dock): esquinas superiores redondeadas
          y la muesca cóncava que deja 10px de margen limpio alrededor
          de la pestaña activa — sin fusionarse con ella. Mismo patrón
          que la burbuja: un <div> con clip-path (fill + backdrop-blur
          reales) debajo, un <svg> (solo trazo del bisel + sombra)
          encima — ancho fijo 390px centrado. El path de ambos cambia
          según `activeTab` para que la muesca siga a la pestaña activa
          (DOCK_PATHS arriba). */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{
          top: DOCK_TOP,
          width: 390,
          height: 300,
          clipPath: `path("${DOCK_PATHS[activeTab]}")`,
          isolation: "isolate",
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(25px) saturate(200%)",
          WebkitBackdropFilter: "blur(25px) saturate(200%)",
        }}
      />
      <svg
        viewBox="0 0 390 300"
        width="390"
        height="300"
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: DOCK_TOP, overflow: "visible" }}
      >
        <path
          d={DOCK_PATHS[activeTab]}
          fill="none"
          stroke={`url(#${GLASS_BEVEL_GRADIENT_ID})`}
          strokeWidth="1.5"
          filter={`url(#${DOCK_SHADOW_FILTER_ID})`}
        />
      </svg>

      {/* Store / Habits / Pets — estados Encendido/Apagado:
          - Encendido (activo): el ícono sube y queda encuadrado en la
            burbuja circular flotante (.liquid-glass-btn, 60x60px, misma
            que usaba el botón Home suelto); el label desaparece.
          - Apagado (inactivo): ícono+label planos, dentro del cuerpo
            del dock, sin burbuja alrededor.
          Un solo <button> por pestaña; el contenido (bubble vs.
          ícono+label) cambia según sea la pestaña activa o no. Clic
          para probar los 3 estados — cambia solo `activeTab` (estado
          local), no abre modales ni navega: eso es Fase 3. */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeTab;
        const Icon = item.Icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            aria-label={item.label}
            aria-pressed={isActive}
            className="absolute z-30 -translate-x-1/2"
            style={{ left: item.cx, top: isActive ? ACTIVE_BUBBLE_TOP : INACTIVE_ITEM_TOP }}
          >
            {isActive ? (
              <span className="liquid-glass-btn flex h-[60px] w-[60px] items-center justify-center rounded-full">
                <Icon className="h-7 w-7" />
              </span>
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Icon className="h-6 w-6" />
                <span className={`text-xs ${UI_TEXT_STYLE}`}>{item.label}</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
