"use client";

import { useState } from "react";
import { UI_TEXT_STYLE } from "@/lib/typography";
import usePetStats from "@/hooks/usePetStats";

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

// Nombre único (no genérico, para no pisar ningún @keyframes de otro
// componente si en algún momento se declara otro inline como este) del
// keyframe que anima la entrada del mensaje de la burbuja. Es una
// `animation`, no una `transition`: una transition no dispara sola al
// montar, y remontar el <span> del mensaje (vía key={message} en
// ChatBubble) en cada cambio de texto sí — así el mismo efecto cubre
// tanto un mensaje nuevo como la apertura inicial de la app, sin JS
// aparte para diferenciar los dos casos.
const CHAT_BUBBLE_ANIMATION_NAME = "zuzu-bubble-message-in";
const CHAT_BUBBLE_KEYFRAMES = `
  @keyframes ${CHAT_BUBBLE_ANIMATION_NAME} {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Burbuja de diálogo "Chat Pet": el mensaje llega por prop (`message`,
// con default "¡Hello!" en MainLayout más abajo) en vez de vivir
// hardcodeado en el JSX — así, cuando haya diálogo real (reacciones a
// hábitos, IA, etc. — Fase 3), alimentarlo es solo pasar un `message`
// distinto, sin tocar este componente.
// El texto vive DENTRO del mismo <div> que ya dibuja el fill/blur de la
// cápsula+cola (clip-path + backdrop-filter — ver comentario grande de
// FASE 4 más abajo), así queda recortado a esa silueta como cualquier
// otro contenido; un <div> interno de solo 70 de los 88px de alto del
// path lo centra en la zona de la cápsula, sin invadir la cola (que no
// tiene espacio para texto). Ese <div> exterior ya lleva
// `transform: scale(140/240)` para ir de las coordenadas nativas del
// path a su tamaño real en pantalla, así que el tamaño de fuente
// también se escribe en esas coordenadas nativas (22px) y termina
// rindiendo a ~13px reales — mismo criterio que el resto de la geometría
// de esta burbuja.
function ChatBubble({ message }) {
  return (
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
      >
        <div className="flex h-[70px] w-full items-center justify-center px-4">
          <span
            key={message}
            style={{ fontSize: 22, lineHeight: 1.1, animation: `${CHAT_BUBBLE_ANIMATION_NAME} 280ms ease-out` }}
            className={`text-center ${UI_TEXT_STYLE}`}
          >
            {message}
          </span>
        </div>
      </div>
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
  );
}

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

// Mismo tono/contenido que ShopModal.jsx (huérfano desde el reset de
// Fase 1: seguía el sistema de diseño anterior, tarjeta blanca opaca en
// vez de Liquid Glass) — sigue siendo la descripción correcta de la
// sección, todavía sin fuente de datos real (Fase 3, más allá de abrir/
// cerrar).
const STORE_SHEET_TEXT =
  "Aquí podrás canjear monedas por comida, ropa, accesorios y skins para Zuzu. Próximamente.";

const GLASS_BEVEL_GRADIENT_ID = "glass-bevel";
const CHAT_BUBBLE_SHADOW_FILTER_ID = "glass-shadow-bubble";
const DOCK_SHADOW_FILTER_ID = "glass-shadow-dock";

// StoreSheet: hoja modal con forma de "etiqueta de tienda" (boceto
// provisto por el usuario) — EXCLUSIVA de la pestaña Store, no un
// patrón genérico reusado por Habits/Pets (esas dos vuelven a su
// comportamiento de antes: tocarlas solo cambia `activeTab`, sin abrir
// ninguna hoja — ver handleTabClick en MainLayout).
//
// Geometría medida directo sobre el boceto de referencia (lienzo
// 390x844, misma proporción que nuestro viewport): caja en
// left=11%/right=11.3%/top=16.7%/bottom=18.6%, esquinas inferiores y
// superior-izquierda con radio estándar (20px), superior-derecha
// hiperredondeada (80px), ojal centrado a (38.5, 38.5) del propio
// borde superior-izquierdo de la tarjeta.
//
// MARCO vs. RELLENO — el marco de cristal (<div> exterior) rodea un
// relleno gris sólido y plano (<div> interior, inset FRAME_WIDTH=6px,
// mismo radio por esquina menos ese inset): fondo #7f7f7f opaco, SIN
// `.liquid-glass-btn`, que deja ver el marco solo como el anillo de
// ~6px alrededor.
//
// PROFUNDIDAD DEL OJAL Y EL CORDÓN — el cordón debe pasar POR DETRÁS
// del marco (para que la parte que cruza el anillo de cristal salga
// desenfocada por su backdrop-filter) y el ojal debe ser un agujero
// real (no un círculo relleno) por el que se ve/asoma la punta del
// cordón sin ningún desenfoque encima. Orden de pintado, de atrás
// hacia adelante, todo dentro de un mismo <div> ancla (mismas
// coordenadas left/top/bottom/right que antes tenía el propio marco,
// para no tener que recalcular nada):
//   1. Cordón (<svg>, solo trazo — una curva abierta no se hace con
//      CSS): al fondo del todo. Al quedar detrás del marco, la parte
//      que el marco cubre se ve a través de su backdrop-filter
//      (desenfocada); la parte que cae fuera de la tarjeta (el rulo de
//      arriba) queda nítida, tal como en el boceto.
//   2. Marco (<div>, `.liquid-glass-btn`): encima del cordón. Lleva un
//      `mask-image` (radial-gradient sólido con un corte duro, no un
//      degradado real: transparente adentro del radio del ojal, opaco
//      inmediatamente después) que le recorta un agujero circular
//      exacto en (38.5, 38.5) — con la máscara, el propio
//      backdrop-filter del marco NO se aplica ahí (no hay caja que
//      filtre), así que el cordón se ve a través sin filtro alguno.
//   3. Relleno gris, hijo del marco, con el mismo truco de
//      mask-image — mismo agujero, pero centrado en (32.5, 32.5)
//      porque el relleno ya está inset FRAME_WIDTH (6px) respecto al
//      marco, así que su propio origen local está corrido esos 6px.
//      Sin este segundo agujero el gris opaco taparía el del marco.
//   4. Anillo del ojal: encima de todo, un <circle> de SVG (fill=none,
//      con el mismo stroke en gradiente + <feDropShadow> que ya usan
//      la burbuja/dock para simular el bisel/sombra de refracción de
//      un Liquid Glass sobre una forma que backdrop-filter no puede
//      seguir de forma confiable) — es decir, un trazo, no una caja
//      con backdrop-filter, así que no vuelve a desenfocar el agujero
//      que las máscaras de los pasos 2-3 dejaron limpio.
//
// Fondo oscurecido + deslizamiento: el backdrop y la propia tarjeta
// (ahora el <div> ancla completo: cordón + marco + ojal, para que se
// desplacen juntos como una sola pieza) quedan siempre montados (nunca
// `{open && ...}`) para poder animar tanto la entrada como la salida
// con una simple `transition` de Tailwind — desmontar en `open=false`
// mataría la animación de salida. Cerrada, se traslada
// `translateY(100vh)` — no un % de la propia altura (100%/130%,
// probado y descartado): la tarjeta ya arranca con un hueco debajo
// (bottom: 18.6%, para dejar ver el Dock) y el cordón sobresale por
// encima de su borde superior, así que un % de su propia altura no
// alcanzaba a sacarla del todo de la pantalla — 100vh desde donde sea
// que esté en reposo sí, sin depender de su geometría interna.
const FRAME_WIDTH = 6;
const OJAL_CENTER = 38.5;
const OJAL_RADIUS = 9.5;
// Corte duro (transparente -> opaco de un salto, sin degradado real)
// en vez de un radial-gradient "suave": un agujero tiene un borde
// neto, no un desvanecido.
function ojalMask(center) {
  return `radial-gradient(circle at ${center}px ${center}px, transparent ${OJAL_RADIUS}px, black ${OJAL_RADIUS + 0.5}px)`;
}

function StoreSheet({ open, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-label="Store"
        aria-hidden={!open}
        className={`absolute z-50 transition-transform duration-300 ease-out ${
          open ? "" : "pointer-events-none"
        }`}
        style={{
          top: "16.7%",
          bottom: "18.6%",
          left: "11%",
          right: "11.3%",
          transform: open ? "translateY(0)" : "translateY(100vh)",
        }}
      >
        {/* Cordón: al fondo, para que el marco lo desenfoque al pasar
            por detrás — ver comentario grande de arriba. <svg> sin
            escalar (viewBox en px reales; agrandado de 60x80 a 120x140
            para que entre el asa completa, bastante más grande que el
            intento anterior).
            Asa ovalada continua e inclinada, no un garabato/rulo chico:
            una <ellipse> real (no una <path> a mano — un óvalo cerrado
            de verdad, sin coserlo a ojo con curvas bezier) con el ojal
            (38.5, 38.5 real = 60,84 en el viewBox propio) como uno de
            los dos vértices de su eje mayor y un punto bien por encima
            y a la izquierda de la esquina de la tarjeta (medido sobre
            el boceto de referencia) como el otro — de ahí salen el
            centro (20.75, 42.25), el radio mayor (57.3) y el ángulo de
            inclinación (46.8°) de abajo. Al ser una elipse cerrada,
            "sale" del ojal por una hebra y "entra" por la otra —ambos
            vértices del eje menor (las dos hebras cruzando cerca de la
            esquina) caen fuera de la tarjeta, verificado— formando la
            asa de una sola pieza que pide el boceto, sin acercarse a
            mano cada punto de control. Grosor fino (2px, blanco sólido)
            en vez del hilo de 4px del intento anterior: esto es un
            hilo, no una cinta. */}
        <svg
          viewBox="0 0 120 140"
          width="120"
          height="140"
          className="pointer-events-none absolute"
          style={{ left: OJAL_CENTER - 60, top: OJAL_CENTER - 84, overflow: "visible" }}
        >
          <ellipse
            cx="20.75"
            cy="42.25"
            rx="57.3"
            ry="16"
            transform="rotate(46.8 20.75 42.25)"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
        {/* Marco: `.liquid-glass-btn` con la geometría completa de la
            etiqueta + el agujero del ojal recortado vía mask-image. */}
        <div
          className="liquid-glass-btn absolute inset-0"
          style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 80,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            maskImage: ojalMask(OJAL_CENTER),
            WebkitMaskImage: ojalMask(OJAL_CENTER),
          }}
        >
          {/* Relleno: gris sólido y plano, sin cristal — mismo agujero
              que el marco, pero centrado FRAME_WIDTH más cerca (este
              <div> ya está inset esos 6px). */}
          <div
            className="absolute bg-[#7f7f7f]"
            style={{
              inset: FRAME_WIDTH,
              borderTopLeftRadius: 20 - FRAME_WIDTH,
              borderTopRightRadius: 80 - FRAME_WIDTH,
              borderBottomLeftRadius: 20 - FRAME_WIDTH,
              borderBottomRightRadius: 20 - FRAME_WIDTH,
              maskImage: ojalMask(OJAL_CENTER - FRAME_WIDTH),
              WebkitMaskImage: ojalMask(OJAL_CENTER - FRAME_WIDTH),
            }}
          />
          <span
            className={`absolute text-base ${UI_TEXT_STYLE}`}
            style={{ left: OJAL_CENTER + OJAL_RADIUS + 8, top: OJAL_CENTER, transform: "translateY(-50%)" }}
          >
            Store
          </span>
          <div className="relative h-full overflow-y-auto pt-[70px] pb-6 pl-6 pr-6">
            <p className={`text-center text-sm ${UI_TEXT_STYLE}`}>{STORE_SHEET_TEXT}</p>
          </div>
        </div>
        {/* Anillo del ojal: un trazo de SVG, no una caja con
            backdrop-filter — así no vuelve a desenfocar el agujero que
            las dos máscaras de arriba dejaron limpio. Antes usaba el
            mismo bisel de 3 paradas (blanco->transparente->negro) de la
            burbuja/dock, pero ese tramo NEGRO del gradiente, mezclado
            sobre lo que se ve a través del agujero (el fondo de prueba
            rosa/magenta detrás de la pita), terminaba leyéndose como un
            anillo rojizo/violeta — justo lo que se pidió evitar. Un
            trazo blanco brillante liso (sin negro) + la misma sombra de
            refracción (neutra, no mezcla color) da el "borde brillante
            fino" de cristal sin ese artefacto de color. */}
        <svg
          viewBox={`0 0 ${OJAL_RADIUS * 2} ${OJAL_RADIUS * 2}`}
          width={OJAL_RADIUS * 2}
          height={OJAL_RADIUS * 2}
          className="pointer-events-none absolute"
          style={{ left: OJAL_CENTER - OJAL_RADIUS, top: OJAL_CENTER - OJAL_RADIUS, overflow: "visible" }}
        >
          <circle
            cx={OJAL_RADIUS}
            cy={OJAL_RADIUS}
            r={OJAL_RADIUS - 1.25}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            filter={`url(#${CHAT_BUBBLE_SHADOW_FILTER_ID})`}
          />
        </svg>
      </div>
    </>
  );
}

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
  // Sin setter usado todavía (no hay de dónde disparar un mensaje nuevo
  // hasta que exista lógica de interacción real — Fase 3): dejar solo el
  // valor evita una variable sin usar mientras el estado ya queda listo
  // para crecer a `const [petMessage, setPetMessage] = useState(...)`
  // el día que haga falta.
  const [petMessage] = useState("¡Hello!");
  // Independiente de `activeTab` (que sigue gobernando solo la muesca/
  // burbuja elevada del Dock): controla si StoreSheet está desplegada.
  // Exclusiva de la pestaña Store — Habits/Pets solo cambian
  // `activeTab`, igual que antes de que existiera la hoja (ver
  // handleTabClick abajo).
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function handleTabClick(key) {
    if (key !== "store") {
      setActiveTab(key);
      setIsSheetOpen(false);
      return;
    }
    if (activeTab === "store" && isSheetOpen) {
      setIsSheetOpen(false);
    } else {
      setActiveTab("store");
      setIsSheetOpen(true);
    }
  }
  const { xp, xpToNext, streakJustIncreased } = usePetStats();
  const streakProgress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-white"
      style={{ background: QA_TEST_BACKGROUND }}
    >
      <style>{CHAT_BUBBLE_KEYFRAMES}</style>

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
          validado en fases anteriores) — ver ChatBubble más arriba para
          el detalle de la geometría (clip-path + backdrop-blur + SVG de
          bisel/sombra) y de cómo entra el texto. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <ChatBubble message={petMessage} />
      </div>

      {/* Racha/Objetos: píldora ancha (235x40px) + círculo chico (39x40px)
          a su derecha con 9px de separación, centrados como grupo,
          top=66.35% — justo arriba del dock. Todo en tonos neutros/blancos
          de cristal, sin ningún tinte rosa (el rosa era un cruce con el
          diseño de una fase anterior del proyecto, ya descartado).
          Racha: llama 100% blanca (public/nav/flame-white.png, asset
          provisto por el usuario, recortada a su bounding box de alfa —
          mismo criterio que el resto de íconos en public/nav/) contenida
          por completo dentro de la píldora + barra de progreso con
          relleno blanco luminoso (sin gradiente de color, solo opacidad)
          + contador "xp/xpToNext" a la derecha. `xp`/`xpToNext`/
          `streakJustIncreased` vienen de usePetStats -> useStreak (racha
          diaria real persistida en localStorage): el ancho del relleno
          solo anima cuando la racha acaba de subir (día nuevo), no en
          cada recarga del mismo día.
          Objetos: NO es el ícono de bolsa (eso era Inventario, del
          diseño anterior) — es el glifo de texto "..." en blanco puro,
          mismo tratamiento que el resto de labels/íconos de texto sobre
          vidrio (ver lib/typography.js). Sin lógica de apertura todavía,
          eso es Fase 3. */}
      <div className="absolute inset-x-0 top-[66.35%] z-10 flex items-center justify-center gap-[9px] px-6">
        <div className="liquid-glass-btn flex h-10 w-[235px] items-center rounded-full pl-2 pr-3">
          <img
            src="/nav/flame-white.png"
            alt=""
            draggable={false}
            style={{ height: 28, width: 22 }}
            className="pointer-events-none block shrink-0 select-none object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          />
          <div className="relative ml-1.5 h-5 flex-1 overflow-hidden rounded-full bg-black/10">
            <div
              className={`relative h-full overflow-hidden rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] ${
                streakJustIncreased ? "transition-all duration-700 ease-out" : ""
              }`}
              style={{
                width: `${streakProgress}%`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.85), rgba(255,255,255,0.3))",
              }}
            />
          </div>
          <span className={`ml-2 shrink-0 text-sm ${UI_TEXT_STYLE}`}>
            {xp}/{xpToNext}
          </span>
        </div>
        <div className="liquid-glass-btn flex h-10 w-[39px] items-center justify-center rounded-full">
          <span className={`text-lg leading-none ${UI_TEXT_STYLE}`}>...</span>
        </div>
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
          ícono+label) cambia según sea la pestaña activa o no. Clic en
          Store abre/cierra StoreSheet; clic en Habits/Pets solo cambia
          `activeTab`, sin abrir nada — ver handleTabClick más arriba.
          z-45: por encima del backdrop de StoreSheet (z-40, cubre toda
          la pantalla) para poder tocar Habits/Pets y salir de Store sin
          tener que cerrar la hoja primero — pero por debajo de la
          propia hoja (z-50), que de todos modos no llega a
          superponerse visualmente con el Dock. */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeTab;
        const Icon = item.Icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleTabClick(item.key)}
            aria-label={item.label}
            aria-pressed={isActive}
            className="absolute z-[45] -translate-x-1/2"
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

      {/* Hoja de Store + fondo oscurecido — ver StoreSheet más arriba.
          Exclusiva de esta pestaña (Habits/Pets no la usan). Siempre
          montada (nunca `{isSheetOpen && ...}`) para poder animar
          también la salida. */}
      <StoreSheet open={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
    </div>
  );
}
