"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { UI_TEXT_STYLE } from "@/lib/typography";
import { LANGUAGES, translate } from "@/lib/i18n";
import usePetStats from "@/hooks/usePetStats";
import useLocalStorageFlag from "@/hooks/useLocalStorageFlag";
import useLocalStorageString from "@/hooks/useLocalStorageString";

// DarkModeContext: "Dark mode" en SettingsModal es un swap de tema
// APP-WIDE (pedido explícito), no un toggle que solo cambia su propia
// fila — así que en vez de bajar `darkMode` por props a cada modal
// (Profile/Settings/FriendSearch/...) se expone vía Context. Persiste
// en localStorage para sobrevivir un reload, igual que la racha en
// useStreak.js (mismo motivo: no hay backend/preferencias de usuario
// real todavía).
const DarkModeContext = createContext({ darkMode: false, setDarkMode: () => {} });
function useDarkMode() {
  return useContext(DarkModeContext);
}

// LanguageContext: mismo criterio que DarkModeContext — la selección de
// idioma en Settings es app-wide, no algo local a ese modal, así que se
// expone vía Context en vez de bajarse por props. `t(key)` es la función
// de traducción real (ver lib/i18n.js); los componentes que ya usan
// `themeClasses(darkMode)` la tenían asignada a una variable local `t`,
// así que esos 9 sitios se renombraron a `tc` para liberar el nombre `t`
// para la traducción.
const LanguageContext = createContext({ language: "en", setLanguage: () => {}, t: (key) => key });
function useLanguage() {
  return useContext(LanguageContext);
}

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
  { key: "store", labelKey: "nav.store", cx: 88, Icon: StoreIcon },
  { key: "habits", labelKey: "nav.habits", cx: 195, Icon: HabitsIcon },
  { key: "pets", labelKey: "nav.pets", cx: 302, Icon: PetsIcon },
];

const GLASS_BEVEL_GRADIENT_ID = "glass-bevel";
const CHAT_BUBBLE_SHADOW_FILTER_ID = "glass-shadow-bubble";
const DOCK_SHADOW_FILTER_ID = "glass-shadow-dock";

// Store/Configuración: sin modal, sin backdrop, sin handler de click —
// a pedido del usuario, ninguno de los 2 botones/pestañas hace nada
// todavía. Perfil sí abre ProfileModal (ver más abajo); Store/
// Configuración quedan visibles pero inertes hasta que se definan sus
// interfaces desde cero.

// MODAL_BOX: caja del modal de Perfil, medida directo sobre la imagen
// de referencia del usuario (lienzo 1125x2250, contenido real recortado
// a 927x1700 en x=[97,1024) y=[275,1975)) contra un lienzo de pantalla
// de 390x844: x 25-364, y 111-733 -> left=6.4%, right=6.7%, top=13.15%,
// bottom=13.1%. Dimensiones internas medidas después contra este mismo
// canvas de 927x1700 -> se convierten directo a % de este box.
const MODAL_BOX = { top: "13.15%", bottom: "13.1%", left: "6.4%", right: "6.7%" };

// BG_MODAL_BOX: caja del modal de Fondos, medida sobre su propia
// imagen de referencia (mismo lienzo 1125x2250, mismo x=[97,1024) que
// los otros 4 — mismo left/right heredado de MODAL_BOX — pero con un
// contenido real más bajo, y=[578,1676) en vez de [275,1975), porque
// esta tarjeta es más chica y no ocupa toda la altura del modal. Con
// la misma transformación canvas->pantalla ya validada en los otros 4
// modales (canvas_y=275 -> pantalla_y=111, canvas_y=1975 -> 733,
// escala 622/1700=0.36588), y=578 -> 221.9px y y=1676 -> 623.6px de
// una pantalla de 844px -> top=26.29%, bottom=26.12%.
const BG_MODAL_BOX = { top: "26.29%", bottom: "26.12%", left: "6.4%", right: "6.7%" };

// Motion Design "estilo iOS" pedido explícitamente: entrada más larga y
// elástica (curva propia de Apple), salida más corta e inmediata.
const MODAL_SPRING_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const MODAL_OPEN_TRANSITION = `transform 320ms ${MODAL_SPRING_EASE}, opacity 320ms ${MODAL_SPRING_EASE}`;
const MODAL_CLOSE_TRANSITION = "transform 220ms ease-in, opacity 220ms ease-in";

// ModalBackdrop: capa oscurecedora rgba(0,0,0,0.4) a pantalla completa.
// Siempre montada (nunca `{open && ...}`) para poder animar también la
// salida. El onClick vive solo acá — la tarjeta del modal es un hermano
// en el DOM (no un hijo), así que un click adentro de ella nunca
// burbujea hasta este div; la tarjeta además lleva su propio
// onClick={(e) => e.stopPropagation()} para dejar esa garantía
// explícita en el código, no solo implícita en la estructura del árbol.
// ModalBackdrop: el z-index es configurable (default z-40, el de
// siempre para los modales de primer nivel) porque un modal ANIDADO
// (ver FriendSearchModal/ShareSheet más abajo) necesita un dimmer por
// ENCIMA de la tarjeta del modal padre (z-50) para de verdad oscurecerla
// — con z-40 fijo, el dimmer quedaba por detrás de esa tarjeta en el
// stacking order y nunca se veía (el bug que reportó el usuario: la
// tarjeta de Perfil seguía completamente brillante detrás del modal
// anidado, dos paneles de vidrio superpuestos sin ningún atenuado
// entre medio).
function ModalBackdrop({ open, onClose, zIndexClassName = "z-40" }) {
  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      className={`absolute inset-0 ${zIndexClassName} bg-black/40 transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}

// NESTED_MODAL_BOX: caja compacta y centrada para modales ANIDADOS que
// se abren desde adentro de otro modal (Agregar/Compartir dentro de
// Perfil) — a diferencia de MODAL_BOX (pensado para ocupar casi toda
// la pantalla, medido pixel a pixel contra las referencias de
// Perfil/Configuración/Tienda/etc.), estos son tarjetas chicas
// centradas, sin referencia de imagen pixel-exacta: por eso usan
// left/top 50% + transform translate(-50%,-50%) en vez de left/right/
// top/bottom como el resto, con una altura máxima (el contenido decide
// la altura real; la lista de FriendSearchModal scrollea si no entra).
const NESTED_MODAL_BOX = { left: "50%", top: "50%", width: "86%", maxHeight: "70%" };

// PROFILE_GLASS_STYLE: reemplaza el rojo de la referencia (marco de la
// tarjeta y los 5 botones — Racha/avatar/Editar/Agregar/Compartir/
// Cámara) por vidrio traslúcido — receta pedida explícita: backdrop-
// blur(16px) + opacidad baja + borde fino con reflejo, más el mismo
// bisel de luz especular arriba-izquierda / sombra abajo-derecha que
// ya usa el resto de la app. Un tinte (no blanco puro) porque estos
// botones caen sobre la tarjeta blanca opaca: ahí no hay nada de color
// detrás para que el blur muestre, así que sin tinte serían
// indistinguibles del blanco de la tarjeta — mismo motivo por el que
// ya se había resuelto así en una iteración anterior de este proyecto.
const PROFILE_GLASS_STYLE = {
  background: "rgba(196, 219, 235, 0.38)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow:
    "inset 1.5px 1.5px 3px rgba(255,255,255,0.7), inset -2px -3px 5px rgba(0,40,70,0.22), 0 3px 8px rgba(0,30,60,0.15)",
};

// Glifos de ProfileModal (Editar/Agregar/Compartir/Cámara) medidos
// contra la hoja de referencia de íconos del usuario: los 4 son
// FORMAS RELLENAS en blanco puro (currentColor), no trazos finos como
// la versión anterior — Cámara y Compartir usan un <mask> para
// "recortar" un hueco real en la forma rellena (el aro de la lente, la
// ranura de la bandeja) en vez de un simple stroke encima.
function PencilIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
      <rect x="13.2" y="19" width="6.3" height="1.7" rx="0.85" />
    </svg>
  );
}
function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ShareIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id="share-icon-slot">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <rect x="10.8" y="9.2" width="2.4" height="3.6" fill="#000" />
      </mask>
      <rect x="5" y="11" width="14" height="9" rx="2.4" fill="currentColor" mask="url(#share-icon-slot)" />
      <path d="M12 4v9.5M8 8l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id="camera-icon-lens">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <circle cx="12" cy="13" r="3.3" fill="#000" />
      </mask>
      <path
        d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.8 3.5h4.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
        fill="currentColor"
        mask="url(#camera-icon-lens)"
      />
      <rect x="10.3" y="12.35" width="3.4" height="1.3" rx="0.65" fill="currentColor" />
    </svg>
  );
}
// CheckIcon/SearchIcon/LinkIcon/InstagramIcon: glifos nuevos para la
// funcionalidad real del modal de Perfil (editar/buscar amigos/
// compartir) — sin referencia de imagen para estos, así que son
// diseño propio simple en el mismo estilo stroke/fill que el resto
// de íconos de este archivo, no de una librería externa.
function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12.5 5 5 11-11" />
    </svg>
  );
}
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}
function LinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.6 4.9a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.4 19.1a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}
function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

// PetPreviewPlaceholder: todavía no existe el asset 3D real de la
// mascota — un blob suave sobre un degradado celeste marca el lugar
// sin inventar el diseño final del personaje.
function PetPreviewPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-sky-100 via-white to-sky-100">
      <div className="h-2/3 w-2/3 rounded-[45%] bg-gradient-to-b from-white to-zinc-200 shadow-inner" />
    </div>
  );
}

// MOCK_FRIEND_SUGGESTIONS: sin backend todavía, "Agregar amigos" busca
// contra esta lista fija en vez de un endpoint real.
const MOCK_FRIEND_SUGGESTIONS = [
  { handle: "aria_writes", name: "Aria" },
  { handle: "mango.tales", name: "Mango" },
  { handle: "lucid_kai", name: "Kai" },
  { handle: "nova_reads", name: "Nova" },
  { handle: "z_pixel", name: "Pixel" },
];

// FriendSearchModal: filtra MOCK_FRIEND_SUGGESTIONS por @handle o
// nombre; "Add" solo cambia el estado local del botón a "Requested"
// (sin persistencia real, no hay backend). Reutiliza el mismo
// MODAL_BOX/animación pop-in-out que el resto de modales, en un
// z-index por encima de ProfileModal (se abre desde su botón +).
function FriendSearchModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState(() => new Set());

  const normalized = query.trim().toLowerCase().replace(/^@/, "");
  const results = normalized
    ? MOCK_FRIEND_SUGGESTIONS.filter(
        (u) => u.handle.toLowerCase().includes(normalized) || u.name.toLowerCase().includes(normalized)
      )
    : MOCK_FRIEND_SUGGESTIONS;

  function sendRequest(handle) {
    setSent((prev) => new Set(prev).add(handle));
  }

  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} zIndexClassName="z-[55]" />
      <div
        role="dialog"
        aria-label={t("friends.title")}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-[60] flex flex-col rounded-[28px] p-5 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...NESTED_MODAL_BOX,
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{t("friends.title")}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full"
          >
            <PlusIcon className="h-4 w-4 rotate-45 text-white" />
          </button>
        </div>
        <div className="liquid-glass-btn mt-4 flex h-11 shrink-0 items-center gap-2 rounded-full px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-white" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("friends.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
          />
        </div>
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {results.map((u) => (
            <div key={u.handle} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${tc.card}`}>
              <div>
                <p className={`text-sm font-semibold ${tc.text}`}>{u.name}</p>
                <p className={`text-xs ${tc.muted}`}>@{u.handle}</p>
              </div>
              <button
                type="button"
                onClick={() => sendRequest(u.handle)}
                disabled={sent.has(u.handle)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  sent.has(u.handle)
                    ? darkMode
                      ? "bg-white/10 text-white/40"
                      : "bg-zinc-100 text-zinc-400"
                    : "bg-sky-500 text-white"
                }`}
              >
                {sent.has(u.handle) ? t("friends.requested") : t("friends.add")}
              </button>
            </div>
          ))}
          {results.length === 0 && <p className="text-center text-sm text-white/70">{t("friends.noResults")}</p>}
        </div>
      </div>
    </>
  );
}

// buildProfileShareCard: dibuja una tarjeta de perfil (avatar + nombre
// + handle sobre un degradado) en un <canvas> y la convierte en un
// archivo PNG. Es el mejor esfuerzo posible para "compartir a
// Instagram Stories" desde una página web sin SDK nativo ni backend:
// `navigator.share({ files })` deja que Instagram aparezca como
// destino en el selector nativo del sistema operativo cuando el
// dispositivo lo soporta, pero no existe forma de abrir el editor de
// Stories directo sin un Facebook App ID registrado y un contenedor
// nativo — eso queda fuera del alcance de una PWA.
async function buildProfileShareCard({ name, handle, avatarUrl }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#7c3aed");
  gradient.addColorStop(1, "#0ea5e9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = 760;
  const r = 220;

  if (avatarUrl) {
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = avatarUrl;
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    } catch {
      // Sigue sin avatar en la tarjeta si la imagen no llega a cargar.
    }
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 64px sans-serif";
  ctx.fillText(name || "Name", cx, cy + r + 110);
  ctx.font = "500 40px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`@${handle || "name_26"}`, cx, cy + r + 170);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new File([blob], "zuzu-profile.png", { type: "image/png" });
}

// ShareSheet: "Share to Instagram Stories" arma la tarjeta de arriba y
// la pasa a `navigator.share` (deja elegir Instagram si el SO lo
// ofrece); "Copy profile link" usa la Clipboard API. Sin soporte para
// ninguna de las dos, se avisa en vez de fallar en silencio.
function ShareSheet({ open, onClose, name, handle, avatarUrl, profileUrl }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("idle"); // idle | sharing | copied | unsupported

  async function handleShareInstagram() {
    setStatus("sharing");
    try {
      const file = await buildProfileShareCard({ name, handle, avatarUrl });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Zuzu", text: `Check out ${name}'s Zuzu profile!` });
      } else if (navigator.share) {
        await navigator.share({ title: "Zuzu", text: `Check out ${name}'s Zuzu profile!`, url: profileUrl });
      } else {
        setStatus("unsupported");
        return;
      }
      setStatus("idle");
    } catch {
      setStatus("idle");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("unsupported");
    }
  }

  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} zIndexClassName="z-[55]" />
      <div
        role="dialog"
        aria-label={t("share.title")}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-[60] flex flex-col gap-3 rounded-[28px] p-5 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...NESTED_MODAL_BOX,
          height: "auto",
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{t("share.title")}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full"
          >
            <PlusIcon className="h-4 w-4 rotate-45 text-white" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleShareInstagram}
          className="liquid-glass-btn flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
        >
          <InstagramIcon className="h-6 w-6 shrink-0 text-white" />
          <span className="text-sm font-semibold text-white">
            {status === "sharing" ? t("share.preparing") : t("share.instagram")}
          </span>
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="liquid-glass-btn flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
        >
          <LinkIcon className="h-6 w-6 shrink-0 text-white" />
          <span className="text-sm font-semibold text-white">
            {status === "copied" ? t("share.linkCopied") : t("share.copyLink")}
          </span>
        </button>
        {status === "unsupported" && (
          <p className="text-center text-xs text-white/70">{t("share.unsupported")}</p>
        )}
      </div>
    </>
  );
}

// ProfileModal: layout medido pixel a pixel contra la imagen de
// referencia (ver MODAL_BOX arriba) — todas las posiciones/tamaños de
// abajo son ese mismo relevamiento convertido a % del box del modal,
// NO valores elegidos a criterio. Cada elemento marcado en rojo en la
// referencia (marco, píldora de Racha, Editar/Agregar/Compartir,
// Cámara) usa PROFILE_GLASS_STYLE; el resto (tarjetas blancas, avatar,
// textos) queda tal cual.
// Funcionalidad real (a pedido explícito, las anotaciones de color de
// la referencia son solo wireframe):
// - Racha: `bestStreak` (récord histórico, de useStreak vía
//   usePetStats) en vez de la racha actual — este badge es "el
//   récord", la barra de racha del header sigue mostrando la actual.
// - Editar: toggle de `editing`; en ese estado el avatar abre el
//   selector de archivos (input file oculto + object URL, revocado en
//   cleanup) y nombre/@handle/bio pasan a ser inputs controlados.
// - Agregar: abre FriendSearchModal (arriba).
// - Compartir: abre ShareSheet (arriba).
// - Cámara: llama a `onEnterPhotoMode` (definido en MainLayout) en vez
//   de tener su propio estado de Photo Mode acá.
function ProfileModal({ open, onClose, bestStreak, onEnterPhotoMode }) {
  const { darkMode } = useDarkMode();
  const tc = themeClasses(darkMode);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Name");
  const [handle, setHandle] = useState("name_26");
  const [bio, setBio] = useState("I write short stories and fanfiction for the most popular fandoms.");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [friendSearchOpen, setFriendSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    e.target.value = "";
  }

  const profileUrl = `https://zuzu.app/u/${handle || "name_26"}`;

  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label="Profile"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 rounded-[32px] ${open ? "" : "pointer-events-none"}`}
        style={{
          ...MODAL_BOX,
          transform: `scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        {/* Tarjeta 1: nombre + bio + fila de 4 botones. */}
        <div
          className={`absolute rounded-[28px] ${tc.card}`}
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%" }}
        >
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Name"
              className={`absolute left-0 right-0 border-b bg-transparent text-center text-base font-bold focus:outline-none ${tc.text} ${
                darkMode ? "border-white/20" : "border-zinc-200"
              }`}
              style={{ top: "34.4%" }}
            />
          ) : (
            <p className={`absolute left-0 right-0 text-center text-base font-bold ${tc.text}`} style={{ top: "34.4%" }}>
              {name}
            </p>
          )}
          {editing ? (
            <div className="absolute left-0 right-0 flex items-center justify-center gap-0.5" style={{ top: "40.4%" }}>
              <span className={`text-xs ${tc.muted}`}>@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                aria-label="Username"
                className={`border-b bg-transparent text-center text-xs focus:outline-none ${tc.muted} ${
                  darkMode ? "border-white/20" : "border-zinc-200"
                }`}
              />
            </div>
          ) : (
            <p className={`absolute left-0 right-0 text-center text-xs ${tc.muted}`} style={{ top: "40.4%" }}>
              @{handle}
            </p>
          )}
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-label="Bio"
              rows={2}
              className={`absolute resize-none border-b bg-transparent text-center text-sm focus:outline-none ${
                darkMode ? "border-white/20 text-white/80" : "border-zinc-200 text-zinc-600"
              }`}
              style={{ left: "9.5%", right: "7.6%", top: "50.4%" }}
            />
          ) : (
            <p
              className={`absolute text-center text-sm ${darkMode ? "text-white/80" : "text-zinc-600"}`}
              style={{ left: "9.5%", right: "7.6%", top: "50.4%" }}
            >
              {bio}
            </p>
          )}
        </div>

        {/* Avatar: NO está marcado en rojo en la referencia (queda tal
            cual, sin vidrio) — círculo con degradado propio, asoma por
            encima de la propia tarjeta 1 superponiéndose a su borde
            superior. En modo edición se puede tocar para elegir una
            foto nueva (input file oculto + preview via object URL). */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
        <button
          type="button"
          disabled={!editing}
          onClick={() => fileInputRef.current?.click()}
          aria-label={editing ? "Change photo" : "Avatar"}
          className="absolute overflow-hidden rounded-full"
          style={{
            left: "50%",
            top: "14.53%",
            width: "42.72%",
            height: "23.29%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="block h-full w-full object-cover" />
          ) : (
            <span className="block h-full w-full rounded-full bg-gradient-to-br from-sky-200 to-sky-400" />
          )}
          {editing && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
              <CameraIcon className="h-6 w-6 text-white" />
            </span>
          )}
        </button>

        {/* Fila de 4 botones: Racha (récord histórico, píldora ancha) +
            Editar/Agregar/Compartir (círculos), todos Liquid Glass. */}
        <div
          className="liquid-glass-btn absolute flex items-center justify-center gap-2 rounded-full px-4"
          style={{ left: "7.77%", top: "52.18%", width: "33.01%", height: "8.00%", ...PROFILE_GLASS_STYLE }}
        >
          <img
            src="/nav/flame-white.png"
            alt=""
            draggable={false}
            className="pointer-events-none h-6 w-5 select-none object-contain"
          />
          {bestStreak > 0 && <span className="text-sm font-semibold text-white">{bestStreak}</span>}
        </div>
        <button
          type="button"
          aria-label={editing ? "Done editing" : "Editar"}
          onClick={() => setEditing((prev) => !prev)}
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "44.44%", top: "52.53%", width: "13.27%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          {editing ? <CheckIcon className="h-5 w-5 text-white" /> : <PencilIcon className="h-5 w-5 text-white" />}
        </button>
        <button
          type="button"
          aria-label="Agregar"
          onClick={() => setFriendSearchOpen(true)}
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "61.17%", top: "52.53%", width: "13.27%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
        <button
          type="button"
          aria-label="Compartir"
          onClick={() => setShareOpen(true)}
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "78.21%", top: "52.53%", width: "13.38%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <ShareIcon className="h-5 w-5 text-white" />
        </button>

        {/* Tarjeta 2: preview de la mascota + botón de cámara (Liquid
            Glass) — entra a Photo Mode. */}
        <div
          className="absolute overflow-hidden rounded-[28px] bg-white"
          style={{ left: "3.13%", right: "3.13%", top: "66.29%", height: "29.29%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <button
          type="button"
          aria-label="Cámara"
          onClick={onEnterPhotoMode}
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "7.87%", top: "86.00%", width: "13.27%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <CameraIcon className="h-5 w-5 text-white" />
        </button>
      </div>
      <FriendSearchModal open={friendSearchOpen} onClose={() => setFriendSearchOpen(false)} />
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        name={name}
        handle={handle}
        avatarUrl={avatarUrl}
        profileUrl={profileUrl}
      />
    </>
  );
}

// Glifos de SettingsModal medidos contra la hoja de referencia del
// usuario: los 9 son FORMAS RELLENAS en negro puro (currentColor), no
// los trazos finos que tenían antes. Donde la referencia muestra un
// "hueco" (aro del engranaje, check del escudo, ranura del logout) se
// usa blanco/mask en vez de stroke, igual que en los íconos del modal
// de Perfil.
function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1Z" />
    </svg>
  );
}
function GearIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id="settings-gear-hole">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <circle cx="12" cy="12" r="3.1" fill="#000" />
      </mask>
      <g fill="currentColor" mask="url(#settings-gear-hole)">
        <circle cx="12" cy="12" r="4.6" />
        <circle cx="17.4" cy="12" r="4.3" />
        <circle cx="14.7" cy="16.68" r="4.3" />
        <circle cx="9.3" cy="16.68" r="4.3" />
        <circle cx="6.6" cy="12" r="4.3" />
        <circle cx="9.3" cy="7.32" r="4.3" />
        <circle cx="14.7" cy="7.32" r="4.3" />
      </g>
    </svg>
  );
}
function MoonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}
// AaIcon: en la referencia, "Idioma" no usa un glifo vectorial sino el
// texto literal "Aa" — se respeta tal cual en vez de inventar un
// ícono de globo terráqueo.
function AaIcon({ className }) {
  return (
    <span className={`inline-flex items-center justify-center text-[19px] font-medium leading-none ${className}`}>
      Aa
    </span>
  );
}
// ZLogoIcon: la referencia usa el mismo isotipo (aro + disco + trazo
// "Z") que TokenIcon en StoreModal, en monocromo, para "Mi contacto".
function ZLogoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="6.6" fill="currentColor" />
      <path d="M9.3 9.3h5.4L9.3 14.7h5.4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
// QuestionIcon: signo de interrogación suelto, sin círculo alrededor
// (a diferencia de la versión anterior).
function QuestionIcon({ className }) {
  return (
    <span className={`inline-flex items-center justify-center text-[22px] font-black leading-none ${className}`}>
      ?
    </span>
  );
}
// DocumentIcon ("Terms of service"): en la referencia no es una hoja
// con líneas de texto sino un cuerpo rectangular con una sola ranura
// horizontal y un asa/anilla en forma de "D" del lado derecho.
function DocumentIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id="settings-doc-slot">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <rect x="4" y="16.6" width="12" height="1.3" fill="#000" />
      </mask>
      <rect x="4" y="2.5" width="12" height="19" rx="2.2" fill="currentColor" mask="url(#settings-doc-slot)" />
      <path
        d="M15.5 6.2c3.3.35 5.5 2.7 5.5 5.8s-2.2 5.45-5.5 5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ShieldCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5Z" />
      <path d="m8.5 12.2 2.6 2.6 4.8-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
// LogoutIcon: reemplazado por el glifo exacto pedido por el usuario
// (bloque rectangular redondeado con un recorte en "U" del lado
// derecho por donde sale una flecha gruesa) — cuerpo más angosto/alto
// que la versión anterior, con el hueco de salida redondeado en su
// extremo interior (no un simple rectángulo recto) para que lea como
// una "U" real y no como una muesca cuadrada.
function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <mask id="settings-logout-notch">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <path d="M17 9.5h-3.8a2.4 2.4 0 0 0 0 4.8H17Z" fill="#000" />
      </mask>
      <rect x="1.5" y="3.3" width="14" height="17.3" rx="3.2" fill="currentColor" mask="url(#settings-logout-notch)" />
      <path
        d="M9.5 12h3.7M13 8.1 22.2 12 13 15.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ToggleSwitch: la PISTA queda gris plano (NO está marcada en rojo en
// la referencia); solo la PERILLA es Liquid Glass (PROFILE_GLASS_STYLE)
// — al revés de lo que podría asumirse a primera vista. Tamaño medido
// contra la referencia: pista 64x29px, perilla 23px de diámetro con 3px
// de margen interno a cada lado; el desplazamiento al activarse es
// exactamente ese recorrido (64-23-3*2=35px).
// ToggleSwitch: además del deslizamiento, la perilla se agranda un
// 18% y vuelve a su tamaño normal al activarse/desactivarse (el
// "thumb indicator enlarged" estilo iOS pedido explícitamente) — un
// estado transitorio `justToggled` de 220ms en vez de una animación
// CSS por keyframes, para que dispare en cada click sin depender de
// que el navegador reinicie una keyframe ya corrida.
function ToggleSwitch({ checked, onChange }) {
  const [justToggled, setJustToggled] = useState(false);

  function handleClick() {
    onChange(!checked);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 220);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      className="relative shrink-0 rounded-full bg-zinc-200"
      style={{ width: 64, height: 29 }}
    >
      <span
        className="liquid-glass-btn absolute rounded-full transition-all duration-200 ease-out"
        style={{
          left: 3,
          top: 3,
          width: 23,
          height: 23,
          transform: `translateX(${checked ? 35 : 0}px) scale(${justToggled ? 1.18 : 1})`,
          ...PROFILE_GLASS_STYLE,
        }}
      />
    </button>
  );
}

// SettingsRow: fila compartida por los 2 grupos de 3 (Dark mode/
// Language/My contact y FAQ/Terms of service/User policy) — icono
// negro (NO vidrio, no está marcado en rojo en la referencia) + label +
// control (switch o chevron) a la derecha. flex-1 dentro del contenedor
// `divide-y` del grupo en vez de una altura fija: la referencia mide
// las 3 filas de cada grupo como tercios iguales del alto del grupo.
function SettingsRow({ icon, label, subLabel, control, onClick }) {
  const { darkMode } = useDarkMode();
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 px-4 ${onClick ? "text-left" : ""}`}
    >
      {icon}
      <span className={`flex-1 text-sm font-semibold ${darkMode ? "text-white" : "text-zinc-900"}`}>{label}</span>
      {subLabel && <span className={`text-xs ${darkMode ? "text-white/50" : "text-zinc-400"}`}>{subLabel}</span>}
      {control}
    </Wrapper>
  );
}

// themeClasses: swap centralizado para el "app-wide theme swap" de
// Dark mode — cada modal que tenga tarjetas/texto realmente visibles
// (no placeholders de foto, donde no cambiaría nada) llama a esto en
// vez de repetir el mismo ternario `darkMode ? "…" : "…"` en cada
// sitio. `card` es vidrio oscuro traslúcido de verdad (blur+borde),
// no un simple negro plano, para seguir leyendo como Liquid Glass en
// modo oscuro.
function themeClasses(darkMode) {
  return {
    card: darkMode ? "bg-zinc-900/70 backdrop-blur-xl border border-white/10" : "bg-white",
    text: darkMode ? "text-white" : "text-zinc-900",
    muted: darkMode ? "text-white/50" : "text-zinc-400",
    divide: darkMode ? "divide-white/10" : "divide-zinc-100",
  };
}

// NestedModal: shell compartido por los 6 sub-modales nuevos de
// Configuración (General Settings/Language/My contact/FAQ/Terms/User
// policy) — mismo patrón de dimmer+tarjeta chica centrada que
// FriendSearchModal/ShareSheet (ver ProfileModal más arriba: z-[55]
// para el dimmer por ENCIMA de la tarjeta padre en z-50, z-[60] para
// la propia). Encapsulado acá porque son 6 modales casi idénticos en
// estructura (título + botón cerrar + contenido scrolleable), solo
// cambia el contenido.
function NestedModal({ open, onClose, title, children }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} zIndexClassName="z-[55]" />
      <div
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-[60] flex flex-col rounded-[28px] p-5 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...NESTED_MODAL_BOX,
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="liquid-glass-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <PlusIcon className="h-4 w-4 rotate-45 text-white" />
          </button>
        </div>
        <div className={`mt-4 flex-1 space-y-2 overflow-y-auto ${darkMode ? "" : ""}`}>{children}</div>
      </div>
    </>
  );
}

// ConfirmAlert: alerta chica estilo iOS (título + mensaje + Cancel/
// acción) reutilizada para "Log out" y "Delete account" — incluye su
// propio dimmer (mismo z-[55]/z-[60] que NestedModal) para que tape
// tanto al modal de Configuración como a cualquier NestedModal que
// esté abierto detrás (p.ej. confirmar borrar cuenta desde adentro de
// User policy).
function ConfirmAlert({ open, onClose, title, message, confirmLabel, onConfirm, destructive }) {
  const { t } = useLanguage();
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} zIndexClassName="z-[65]" />
      <div
        role="alertdialog"
        aria-label={title}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-[70] flex flex-col gap-4 rounded-[24px] p-5 text-center ${open ? "" : "pointer-events-none"}`}
        style={{
          left: "50%",
          top: "50%",
          width: "74%",
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-white/80">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="liquid-glass-btn flex-1 rounded-full py-2.5 text-sm font-semibold text-white"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white ${
              destructive ? "bg-red-500" : "bg-sky-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// PremiumModal: "subscription / Premium benefits" — no hay backend de
// pagos todavía (Fase 3), así que el botón de mejora queda deshabilitado
// con la etiqueta "coming soon" en vez de simular un cobro que no existe;
// los 4 beneficios sí son contenido real, no placeholders vacíos.
const PREMIUM_BENEFITS = [
  "premium.benefitStreakFreeze",
  "premium.benefitOutfits",
  "premium.benefitTokens",
  "premium.benefitNoAds",
];

function PremiumModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  return (
    <NestedModal open={open} onClose={onClose} title="ZUZU PREMIUM">
      <p className={`text-sm ${tc.muted}`}>{t("premium.subtitle")}</p>
      <div className={`divide-y overflow-hidden rounded-2xl ${tc.card} ${tc.divide}`}>
        {PREMIUM_BENEFITS.map((key) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3">
            <CheckIcon className="h-5 w-5 shrink-0 text-sky-500" />
            <span className={`text-sm font-semibold ${tc.text}`}>{t(key)}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full bg-sky-500/50 py-3 text-sm font-semibold text-white"
      >
        {t("premium.upgrade")}
      </button>
    </NestedModal>
  );
}

const GENERAL_SETTINGS_OPTIONS = [
  { key: "haptics", labelKey: "generalSettings.haptics" },
  { key: "reduceMotion", labelKey: "generalSettings.reduceMotion" },
  { key: "soundEffects", labelKey: "generalSettings.soundEffects" },
];

// GeneralSettingsModal: "nested options with checkmark active states"
// — sin una fuente de datos real detrás todavía, así que son 3
// toggles de ejemplo (no conectados a ningún comportamiento real de
// la app) representando el tipo de opciones que viven acá.
function GeneralSettingsModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  const [enabled, setEnabled] = useState({ haptics: true, reduceMotion: false, soundEffects: true });

  function toggle(key) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.generalSettings")}>
      {GENERAL_SETTINGS_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => toggle(opt.key)}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 ${tc.card}`}
        >
          <span className={`text-sm font-semibold ${tc.text}`}>{t(opt.labelKey)}</span>
          {enabled[opt.key] && <CheckIcon className="h-5 w-5 text-sky-500" />}
        </button>
      ))}
    </NestedModal>
  );
}

// LanguageModal: selección única con checkmark en el idioma activo, sobre
// los 10 idiomas de LANGUAGES (lib/i18n.js). `language`/`onSelect` vienen
// de LanguageContext (app-wide, ver arriba) — al elegir uno, `t()` cambia
// en toda la app de inmediato (Settings y sus 6 sub-modales, FriendSearch/
// ShareSheet, el Dock y el placeholder de Onboarding).
function LanguageModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { language, setLanguage, t } = useLanguage();
  const tc = themeClasses(darkMode);
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.language")}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => {
            setLanguage(lang.code);
            onClose();
          }}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 ${tc.card}`}
        >
          <span className={`text-sm font-semibold ${tc.text}`}>{lang.label}</span>
          {language === lang.code && <CheckIcon className="h-5 w-5 text-sky-500" />}
        </button>
      ))}
    </NestedModal>
  );
}

// MyContactModal: "account info, linked social accounts, and user
// support contact details" — datos de ejemplo (no hay backend de
// cuentas todavía), pero con la estructura real que va a necesitar
// (sección Account, Linked accounts, Support).
function MyContactModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.myContact")}>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.account")}</p>
        <div className={`rounded-2xl px-4 py-3 ${tc.card}`}>
          <p className={`text-sm font-semibold ${tc.text}`}>name_26</p>
          <p className={`text-xs ${tc.muted}`}>name_26@example.com</p>
        </div>
      </div>
      <div>
        <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.linkedAccounts")}</p>
        <div className={`divide-y overflow-hidden rounded-2xl ${tc.card} ${tc.divide}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`text-sm font-semibold ${tc.text}`}>Google</span>
            <span className="text-xs font-semibold text-emerald-500">{t("contact.connected")}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`text-sm font-semibold ${tc.text}`}>Apple</span>
            <span className={`text-xs ${tc.muted}`}>{t("contact.notConnected")}</span>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.support")}</p>
        <a href="mailto:support@zuzu.app" className={`block rounded-2xl px-4 py-3 text-sm font-semibold text-sky-500 ${tc.card}`}>
          support@zuzu.app
        </a>
      </div>
    </NestedModal>
  );
}

// LegalSection: bloque título+párrafo compartido por FAQ/Terms/User
// policy — evita repetir la misma estructura de <h3>+<p> a mano en
// cada uno de los ~12 bloques entre los 3 modales.
function LegalSection({ title, children, textClass }) {
  return (
    <div>
      <h3 className={`mb-1 text-sm font-bold ${textClass}`}>{title}</h3>
      <p className="text-xs leading-relaxed text-white/70">{children}</p>
    </div>
  );
}

// FaqModal/TermsModal/UserPolicyModal: contenido genérico de ejemplo
// (no son textos legales reales ni revisados por un abogado) pero
// cubren los puntos que Apple pide para la revisión de la App Store
// en apps con cuentas de usuario: qué datos se recolectan y para qué,
// términos de uso claros, y el derecho a borrar la cuenta (con una
// acción real de "Delete account" en User policy, no solo texto).
const FAQ_ITEMS = [
  { q: "How does my streak work?", a: "Open Zuzu once a day to keep your streak alive. Miss a day and it resets to 0 — your best streak is saved separately, forever." },
  { q: "How do I change my avatar or bio?", a: "Open your Profile and tap the pencil icon. While editing, tap your avatar to choose a new photo." },
  { q: "How do I add friends?", a: "From your Profile, tap the + icon and search by @handle to send a friend request." },
  { q: "Can I use Zuzu on more than one device?", a: "Yes — sign in with the same account and your pet, streak, and settings come with you." },
];
function FaqModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.faq")}>
      {FAQ_ITEMS.map((item) => (
        <div key={item.q} className={`rounded-2xl px-4 py-3 ${tc.card}`}>
          <p className={`text-sm font-semibold ${tc.text}`}>{item.q}</p>
          <p className={`mt-1 text-xs ${tc.muted}`}>{item.a}</p>
        </div>
      ))}
    </NestedModal>
  );
}

function TermsModal({ open, onClose }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.termsOfService")}>
      <LegalSection title="1. Acceptance of terms" textClass={tc.text}>
        By creating an account or using Zuzu, you agree to these Terms of Service. If you don&apos;t agree, please don&apos;t use the app.
      </LegalSection>
      <LegalSection title="2. Your account" textClass={tc.text}>
        You&apos;re responsible for keeping your login credentials secure and for all activity under your account.
      </LegalSection>
      <LegalSection title="3. Acceptable use" textClass={tc.text}>
        Don&apos;t use Zuzu to harass others, share illegal content, or attempt to disrupt the service.
      </LegalSection>
      <LegalSection title="4. Tokens &amp; purchases" textClass={tc.text}>
        In-app tokens and store items are virtual goods with no cash value and are non-refundable except where required by law.
      </LegalSection>
      <LegalSection title="5. Termination" textClass={tc.text}>
        You can delete your account at any time from User policy. We may suspend accounts that violate these terms.
      </LegalSection>
      <LegalSection title="6. Contact" textClass={tc.text}>
        Questions about these terms? Reach us at support@zuzu.app.
      </LegalSection>
    </NestedModal>
  );
}

function UserPolicyModal({ open, onClose, onDeleteAccount }) {
  const { darkMode } = useDarkMode();
  const { t } = useLanguage();
  const tc = themeClasses(darkMode);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  return (
    <>
      <NestedModal open={open} onClose={onClose} title={t("settings.userPolicy")}>
        <LegalSection title="Information we collect" textClass={tc.text}>
          Your profile info (name, @handle, bio, avatar), gameplay data (streak, level, tokens), and basic device/usage data.
        </LegalSection>
        <LegalSection title="How we use it" textClass={tc.text}>
          To run your pet&apos;s progress, show your profile to friends you add, and improve the app. We don&apos;t sell your personal data.
        </LegalSection>
        <LegalSection title="Data sharing" textClass={tc.text}>
          Shared only with service providers that help us run Zuzu (e.g. hosting), under confidentiality obligations.
        </LegalSection>
        <LegalSection title="Your rights" textClass={tc.text}>
          You can access, correct, or delete your data at any time. Deleting your account removes your profile, pet, and progress permanently.
        </LegalSection>
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-500 ${tc.card}`}
        >
          {t("policy.deleteAccount")}
        </button>
        <LegalSection title="Contact" textClass={tc.text}>
          Privacy questions go to support@zuzu.app.
        </LegalSection>
      </NestedModal>
      <ConfirmAlert
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t("policy.deleteAccount")}
        message={t("policy.deleteConfirmMessage")}
        confirmLabel={t("policy.deleteConfirmLabel")}
        destructive
        onConfirm={onDeleteAccount}
      />
    </>
  );
}

// SettingsModal: layout medido pixel a pixel contra la imagen de
// referencia (mismo MODAL_BOX/canvas que ProfileModal). Único cambio de
// color respecto a la referencia: el marco exterior (Liquid Glass real,
// `.liquid-glass-btn`) y la perilla de cada switch (PROFILE_GLASS_STYLE)
// — son las ÚNICAS dos zonas marcadas en rojo ahí. Todo lo demás
// (píldora ZUZU PREMIUM, tarjetas blancas, íconos negros, texto,
// chevrons grises, fila de Log out) no estaba en rojo en la referencia,
// pero SÍ cambia con Dark mode (ver themeClasses) porque el pedido de
// esta vuelta es justamente que ese swap de tema sea real.
// Funcionalidad real:
// - Pause notifications: persiste en localStorage (no hay sistema de
//   notificaciones push real que "pausar" todavía, pero la preferencia
//   es real y sobrevive un reload).
// - Dark mode: usa el DarkModeContext de arriba (app-wide).
// - General Settings/Language/My contact/FAQ/Terms/User policy: cada
//   fila abre su NestedModal correspondiente.
// - Log out: abre ConfirmAlert; confirmar llama a `onLogout` (definido
//   en MainLayout), que cierra todo y muestra la pantalla de
//   Onboarding placeholder.
function SettingsModal({ open, onClose, onLogout }) {
  const { darkMode, setDarkMode } = useDarkMode();
  const { language, t } = useLanguage();
  const tc = themeClasses(darkMode);
  const [pauseNotifications, setPauseNotifications] = useLocalStorageFlag("zuzu-notifications-paused", false);

  const languageLabel = LANGUAGES.find((lang) => lang.code === language)?.label ?? language;
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label={t("settings.title")}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 overflow-hidden rounded-[32px] ${open ? "" : "pointer-events-none"}`}
        style={{
          ...MODAL_BOX,
          transform: `scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        {/* ZUZU PREMIUM: no está marcada en rojo, queda con su propio
            degradado plano, sin vidrio (no cambia con Dark mode — es
            una insignia de marca, no una tarjeta de contenido). Abre
            PremiumModal con los beneficios (ver más abajo). */}
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className="absolute flex items-center justify-center rounded-full bg-gradient-to-br from-white to-sky-100"
          style={{ left: "3.56%", right: "3.67%", top: "3.59%", height: "7.65%" }}
        >
          <span className="text-sm font-extrabold tracking-wide text-zinc-900">ZUZU PREMIUM</span>
        </button>

        {/* Pause notifications (tarjeta suelta) */}
        <div
          className={`absolute flex items-center gap-3 rounded-2xl px-4 ${tc.card}`}
          style={{ left: "3.13%", right: "3.24%", top: "13.29%", height: "7.65%" }}
        >
          <BellIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />
          <span className={`flex-1 text-sm font-semibold ${tc.text}`}>{t("settings.pauseNotifications")}</span>
          <ToggleSwitch checked={pauseNotifications} onChange={setPauseNotifications} />
        </div>

        {/* General Settings (tarjeta suelta) */}
        <button
          type="button"
          onClick={() => setGeneralOpen(true)}
          className={`absolute flex items-center gap-3 rounded-2xl px-4 text-left ${tc.card}`}
          style={{ left: "3.13%", right: "3.24%", top: "23.00%", height: "7.65%" }}
        >
          <GearIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />
          <span className={`flex-1 text-sm font-semibold ${tc.text}`}>{t("settings.generalSettings")}</span>
          <ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />
        </button>

        {/* Grupo 1: Dark mode / Language / My contact */}
        <div
          className={`absolute flex flex-col divide-y overflow-hidden rounded-2xl ${tc.card} ${tc.divide}`}
          style={{ left: "3.13%", right: "3.24%", top: "32.65%", height: "23.41%" }}
        >
          <SettingsRow
            icon={<MoonIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.darkMode")}
            control={<ToggleSwitch checked={darkMode} onChange={setDarkMode} />}
          />
          <SettingsRow
            icon={<AaIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.language")}
            subLabel={languageLabel}
            onClick={() => setLanguageOpen(true)}
            control={<ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />}
          />
          <SettingsRow
            icon={<ZLogoIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.myContact")}
            onClick={() => setContactOpen(true)}
            control={<ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />}
          />
        </div>

        {/* Grupo 2: FAQ / Terms of service / User policy */}
        <div
          className={`absolute flex flex-col divide-y overflow-hidden rounded-2xl ${tc.card} ${tc.divide}`}
          style={{ left: "3.13%", right: "3.24%", top: "58.18%", height: "23.41%" }}
        >
          <SettingsRow
            icon={<QuestionIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.faq")}
            onClick={() => setFaqOpen(true)}
            control={<ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />}
          />
          <SettingsRow
            icon={<DocumentIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.termsOfService")}
            onClick={() => setTermsOpen(true)}
            control={<ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />}
          />
          <SettingsRow
            icon={<ShieldCheckIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />}
            label={t("settings.userPolicy")}
            onClick={() => setPolicyOpen(true)}
            control={<ChevronIcon className={`h-4 w-4 shrink-0 ${tc.muted}`} />}
          />
        </div>

        {/* Log out (tarjeta suelta) */}
        <button
          type="button"
          onClick={() => setLogoutConfirmOpen(true)}
          className={`absolute flex items-center gap-3 rounded-2xl px-4 text-left ${tc.card}`}
          style={{ left: "3.13%", right: "3.24%", top: "88.47%", height: "7.71%" }}
        >
          <LogoutIcon className={`h-6 w-6 shrink-0 ${tc.text}`} />
          <span className={`text-sm font-semibold ${tc.text}`}>{t("settings.logOut")}</span>
        </button>
      </div>

      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      <GeneralSettingsModal open={generalOpen} onClose={() => setGeneralOpen(false)} />
      <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
      <MyContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <UserPolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} onDeleteAccount={onLogout} />
      <ConfirmAlert
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title={t("settings.logOut")}
        message={t("settings.logOutConfirmMessage")}
        confirmLabel={t("settings.logOutConfirmLabel")}
        destructive
        onConfirm={onLogout}
      />
    </>
  );
}

// Hanger/Cup/Cat: assets PNG provistos por el usuario
// (public/nav/hanger-white.png, cup-white.png, cat-white.png —
// recortados a su bounding box de alfa +2%, mismo criterio que el
// resto de íconos en public/nav/), no íconos SVG propios. A pedido
// explícito del usuario, dejaron de codificarse a mano: se usan las
// imágenes exactas de su hoja de referencia vía <img>, igual que
// flame-white.png o profile-icon.png más abajo.
// Token: NO usa un PNG recortado propio — el recorte anterior
// (token-white.png) mostraba un artefacto de compresión/crop (un
// punto oscuro) en el trazo de la "Z". En vez de recortar de nuevo,
// se reutiliza tokens-icon.png, el mismo asset limpio ya usado en la
// píldora de saldo del header principal.

// StoreModal: layout medido pixel a pixel contra la imagen de
// referencia (mismo MODAL_BOX/canvas que Profile/Settings). card1
// (preview + precios) y card2 (categorías) caen exactamente en las
// mismas coordenadas top/height que las tarjetas de ProfileModal — no
// es coincidencia, ambos bocetos comparten el mismo lienzo/grilla base.
// Esquina superior DERECHA hiperredondeada (radio medido: ~95px CSS,
// el resto en 28px estándar) — "bisel curvo asimétrico extendido" del
// boceto, solo forma, no cambia con la animación.
//
// Marcado en rojo en esta referencia: el marco exterior, el circulito
// decorativo top-left, las 2 píldoras de precio, y las 4 pestañas de
// categoría (las 4, no solo la activa) — todas se convierten a Liquid
// Glass. El preview central (placeholder celeste) y el texto/íconos
// blancos de las píldoras NO estaban en rojo y quedan tal cual.
function StoreModal({ open, onClose }) {
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label="Store"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...MODAL_BOX,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 95,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          transform: `scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        {/* Circulito decorativo superior-izquierdo: sin función todavía
            (Fase futura). */}
        <span
          className="liquid-glass-btn absolute rounded-full bg-white"
          style={{ left: "7.55%", top: "4.32%", width: "7.55%", height: "4.12%", ...PROFILE_GLASS_STYLE }}
        />

        {/* Tarjeta 1: preview + píldoras de precio */}
        <div
          className="absolute overflow-hidden rounded-[28px] bg-white"
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center gap-1.5 rounded-full"
          style={{ left: "14.89%", top: "52.18%", width: "32.90%", height: "8.00%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/tokens-icon.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 shrink-0 select-none object-contain" />
          <span className="text-sm font-bold text-white">150</span>
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "52.00%", top: "52.18%", width: "32.90%", height: "8.00%", ...PROFILE_GLASS_STYLE }}
        >
          <span className="text-sm font-bold text-white">$1.99</span>
        </div>

        {/* Tarjeta 2: preview + 4 pestañas de categoría (Ropa activa por
            defecto) */}
        <div
          className="absolute overflow-hidden rounded-[28px] bg-white"
          style={{ left: "3.13%", right: "3.24%", top: "66.29%", height: "29.29%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "7.77%", top: "77.06%", width: "33.01%", height: "8.06%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/hanger-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "44.44%", top: "77.41%", width: "13.27%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/cup-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "61.17%", top: "77.41%", width: "13.27%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/cat-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "78.21%", top: "77.41%", width: "13.38%", height: "7.29%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/tokens-icon.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
      </div>
    </>
  );
}

// PetsModal: reutiliza la misma estructura base que StoreModal (mismo
// MODAL_BOX/canvas, card1 y card2 en idénticas coordenadas), pero
// espejada horizontalmente — la esquina hiperredondeada va arriba a la
// IZQUIERDA (radio medido: ~94px CSS) en vez de arriba a la derecha.
//
// Medido pixel a pixel contra esta referencia (no reutilizado de
// Store): marco exterior, píldora "Hat" y las 3 pestañas de categoría
// (percha/vaso/gato — sin token, esta vista no tiene ese botón) están
// en rojo y pasan a Liquid Glass. El circulito decorativo top-right,
// en cambio, midió BLANCO puro (no rojo) en esta referencia — a
// diferencia del de Store, acá queda como círculo blanco liso, sin
// vidrio. El preview central y los íconos/texto blancos de las
// píldoras no estaban en rojo y quedan tal cual.
function PetsModal({ open, onClose }) {
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label="Pets"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...MODAL_BOX,
          borderTopLeftRadius: 94,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          transform: `scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        {/* Circulito decorativo superior-derecho: blanco liso, no vidrio
            (midió blanco puro en la referencia, no rojo). */}
        <span
          className="absolute rounded-full bg-white"
          style={{ left: "85.44%", top: "4.59%", width: "6.58%", height: "3.53%" }}
        />

        {/* Tarjeta 1: preview + píldora "Hat" */}
        <div
          className="absolute overflow-hidden rounded-[28px] bg-white"
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "34.74%", top: "52.18%", width: "32.79%", height: "7.94%", ...PROFILE_GLASS_STYLE }}
        >
          <span className="text-sm font-bold text-white">Hat</span>
        </div>

        {/* Tarjeta 2: preview + 3 pestañas de categoría (percha/vaso/gato) */}
        <div
          className="absolute overflow-hidden rounded-[28px] bg-white"
          style={{ left: "3.13%", right: "3.24%", top: "66.29%", height: "29.29%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "16.50%", top: "77.06%", width: "32.90%", height: "8.00%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/hanger-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "53.18%", top: "77.41%", width: "13.16%", height: "7.24%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/cup-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "69.90%", top: "77.41%", width: "13.16%", height: "7.24%", ...PROFILE_GLASS_STYLE }}
        >
          <img src="/nav/cat-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
      </div>
    </>
  );
}

function ImageIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
    </svg>
  );
}

// BackgroundsModal: una sola tarjeta (la foto de fondo activa) con
// marco Liquid Glass alrededor y 2 botones de navegación (< >)
// superpuestos abajo al centro — sin segunda tarjeta ni pestañas,
// estructura propia, no reutiliza StoreModal/PetsModal.
//
// Medido pixel a pixel contra esta referencia (lienzo propio, ver
// BG_MODAL_BOX arriba): el marco exterior completo y los 2 botones de
// flecha están en rojo -> Liquid Glass. La foto en sí (recorte
// redondeado) no estaba en rojo y queda tal cual.
//
// Los botones de flecha no son círculos ni píldoras comunes: cada uno
// mide igual de ancho que de alto pero con un radio bien grande del
// lado exterior (= mitad de su alto, un semicírculo real) y casi nulo
// del lado interior (borde recto, apenas insinuado) — juntos, si no
// tuvieran espacio entre sí, formarían una sola píldora partida al
// medio. Cada esquina se midió por separado en vez de asumir un
// rounded-full parejo.
function BackgroundsModal({ open, onClose }) {
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label="Backgrounds"
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 rounded-[26px] ${open ? "" : "pointer-events-none"}`}
        style={{
          ...BG_MODAL_BOX,
          transform: `scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div
          className="absolute overflow-hidden rounded-[22px] bg-white"
          style={{ left: "3.13%", right: "3.13%", top: "3.01%", bottom: "2.73%" }}
        >
          <PetPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center"
          style={{
            left: "33.48%",
            top: "81.60%",
            width: "15.23%",
            height: "12.30%",
            borderTopLeftRadius: 25,
            borderBottomLeftRadius: 25,
            borderTopRightRadius: 6,
            borderBottomRightRadius: 6,
            ...PROFILE_GLASS_STYLE,
          }}
        >
          <ChevronIcon className="h-6 w-6 rotate-180 text-white" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center"
          style={{
            left: "51.08%",
            top: "81.60%",
            width: "15.23%",
            height: "12.30%",
            borderTopLeftRadius: 6,
            borderBottomLeftRadius: 6,
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
            ...PROFILE_GLASS_STYLE,
          }}
        >
          <ChevronIcon className="h-6 w-6 text-white" />
        </div>
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

// OnboardingPlaceholder: pantalla destino real de "Log out" (y de
// "Delete account") — a pedido explícito, el diseño final de esta
// pantalla queda pendiente todavía; esto solo deja preparado el
// manejo de estado de navegación (MainLayout renderiza esto en vez
// de la app cuando `loggedIn` es false) para que el flujo de logout
// tenga un destino real y comprobable, no solo cierre modales.
function OnboardingPlaceholder({ onSignIn }) {
  const { t } = useLanguage();
  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col items-center justify-center gap-10 px-8 text-center"
      style={{ background: "linear-gradient(160deg, #1a1a2e, #16213e)" }}
    >
      <div>
        <h1 className="text-4xl font-extrabold tracking-[0.2em] text-white">ZUZU</h1>
        <p className="mt-3 text-sm text-white/50">{t("onboarding.subtitle")}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onSignIn}
          className="liquid-glass-btn flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white"
        >
          {t("onboarding.google")}
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="liquid-glass-btn flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white"
        >
          {t("onboarding.apple")}
        </button>
      </div>
    </div>
  );
}

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState("habits");
  // Sin setter usado todavía (no hay de dónde disparar un mensaje nuevo
  // hasta que exista lógica de interacción real — Fase 3): dejar solo el
  // valor evita una variable sin usar mientras el estado ya queda listo
  // para crecer a `const [petMessage, setPetMessage] = useState(...)`
  // el día que haga falta.
  const [petMessage] = useState("¡Hello!");
  // Estructura mínima de click pedida explícitamente para los modales
  // de Perfil/Configuración: solo abren/cierran, sin lógica real todavía.
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [petsOpen, setPetsOpen] = useState(false);
  const [backgroundsOpen, setBackgroundsOpen] = useState(false);
  const { xp, xpToNext, streakJustIncreased, bestStreak } = usePetStats();
  const streakProgress = Math.min((xp / xpToNext) * 100, 100);

  // Dark mode: "app-wide" (ver DarkModeContext arriba), persistido en
  // localStorage vía useLocalStorageFlag (useSyncExternalStore, no
  // useEffect+setState — evita el mismatch de hidratación y el error
  // de "cascading renders" que ese patrón dispara).
  const [darkMode, setDarkMode] = useLocalStorageFlag("zuzu-dark-mode", false);

  // Idioma: mismo criterio app-wide que Dark mode, persistido en
  // localStorage vía useLocalStorageString (mismo motivo: useSyncExternalStore
  // en vez de useEffect+setState). `t` es una función simple (no necesita
  // memoizarse con useCallback) que resuelve una clave contra
  // TRANSLATIONS[language], con fallback a inglés — ver lib/i18n.js.
  const [language, setLanguage] = useLocalStorageString("zuzu-language", "en");
  const t = (key) => translate(language, key);

  // Sesión: "loggedIn" en memoria nada más (no hay backend de auth
  // real) — al confirmar Log out (o Delete account, que por ahora usa
  // el mismo destino) se cierra todo y se muestra el placeholder de
  // Onboarding. OJO: esto NO borra datos persistidos como la racha o
  // las preferencias — "clears the session state" se interpreta como
  // la sesión de auth, no como borrar el progreso guardado del
  // usuario, que sería un efecto secundario destructivo no pedido.
  const [loggedIn, setLoggedIn] = useState(true);

  // Photo Mode: oculta todo el chrome (header, burbuja, barra de
  // racha/dock, dock, modales) dejando solo el fondo visible. Se activa
  // desde el botón de cámara del ProfileModal (cierra todos los
  // modales de paso) y se sale con un doble tap en cualquier parte de
  // la pantalla — se detecta a mano comparando el timestamp contra el
  // del tap anterior (guardado en un ref para no disparar renders de
  // más) en vez de depender de un gesto nativo tipo `ondblclick`, que
  // en mobile no siempre dispara igual que en desktop.
  const [photoMode, setPhotoMode] = useState(false);
  const lastPhotoModeTapRef = useRef(0);

  function enterPhotoMode() {
    setProfileOpen(false);
    setSettingsOpen(false);
    setStoreOpen(false);
    setPetsOpen(false);
    setBackgroundsOpen(false);
    setPhotoMode(true);
  }

  function handlePhotoModeTap() {
    const now = Date.now();
    if (now - lastPhotoModeTapRef.current < 350) {
      setPhotoMode(false);
      lastPhotoModeTapRef.current = 0;
    } else {
      lastPhotoModeTapRef.current = now;
    }
  }

  function handleLogout() {
    setProfileOpen(false);
    setSettingsOpen(false);
    setStoreOpen(false);
    setPetsOpen(false);
    setBackgroundsOpen(false);
    setPhotoMode(false);
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <OnboardingPlaceholder onSignIn={() => setLoggedIn(true)} />
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-white"
      style={{ background: QA_TEST_BACKGROUND }}
    >
      <style>{CHAT_BUBBLE_KEYFRAMES}</style>

      {photoMode && (
        <div
          className="absolute inset-0 z-[70]"
          onClick={handlePhotoModeTap}
          role="presentation"
          aria-label="Photo mode — double-tap to exit"
        />
      )}

      {!photoMode && (
        <>
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
          (ninguno de los 3 es cuadrado) dentro del círculo/píldora.
          Perfil abre ProfileModal; Configuración abre SettingsModal
          (ver más abajo). */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col items-start gap-2">
          {/* Perfil */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profile"
            className="liquid-glass-btn flex h-10 w-10 items-center justify-center rounded-full"
          >
            <img
              src="/nav/profile-icon.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-6 w-6 select-none object-contain"
            />
          </button>
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
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings.title")}
            className="liquid-glass-btn flex h-10 w-10 items-center justify-center rounded-full"
          >
            <img
              src="/nav/settings-icon.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-6 w-6 select-none object-contain"
            />
          </button>
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
          eso es Fase 3.
          Al lado de "...", un círculo más (mismos 40px que el resto de
          burbujas del header/dock) con un ícono de imagen: abre
          BackgroundsModal (ver más abajo). */}
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
        <button
          type="button"
          onClick={() => setBackgroundsOpen(true)}
          aria-label="Backgrounds"
          className="liquid-glass-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <ImageIcon className={`h-5 w-5 ${UI_TEXT_STYLE}`} />
        </button>
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
          ícono+label) cambia según sea la pestaña activa o no. Store
          abre StoreModal y Pets abre PetsModal (ver más abajo) —
          Habits solo cambia `activeTab`, sin modal. */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeTab;
        const Icon = item.Icon;
        const label = t(item.labelKey);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setActiveTab(item.key);
              if (item.key === "store") setStoreOpen(true);
              if (item.key === "pets") setPetsOpen(true);
            }}
            aria-label={label}
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
                <span className={`text-xs ${UI_TEXT_STYLE}`}>{label}</span>
              </span>
            )}
          </button>
        );
      })}

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        bestStreak={bestStreak}
        onEnterPhotoMode={enterPhotoMode}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
      <StoreModal open={storeOpen} onClose={() => setStoreOpen(false)} />
      <PetsModal open={petsOpen} onClose={() => setPetsOpen(false)} />
      <BackgroundsModal open={backgroundsOpen} onClose={() => setBackgroundsOpen(false)} />
        </>
      )}
    </div>
    </DarkModeContext.Provider>
    </LanguageContext.Provider>
  );
}
