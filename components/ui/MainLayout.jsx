"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { UI_TEXT_STYLE } from "@/lib/typography";
import { LANGUAGES, translate } from "@/lib/i18n";
import usePetStats from "@/hooks/usePetStats";
import useLocalStorageFlag from "@/hooks/useLocalStorageFlag";
import useLocalStorageString from "@/hooks/useLocalStorageString";
import useTokens from "@/hooks/useTokens";
import useHabits from "@/hooks/useHabits";
import WelcomeScreen from "@/components/ui/WelcomeScreen";

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
// Reacción "alegre" de la mascota al completar un hábito (Habit
// Tracker, ver más abajo): no hay todavía ningún asset 3D real de la
// mascota (sigue siendo Fase 3 en todo el resto del archivo — ver
// PetPreviewPlaceholder), así que la burbuja "¡Hola!" (PNG fijo,
// public/nav2/chat-bubble-hola.png — reemplaza al ChatBubble
// code-drawn de fases anteriores) es la superficie real más cercana
// para esa reacción: al completar un hábito, la burbuja pega un salto
// con este keyframe cuando `pulse` es true. El PNG trae el texto
// "¡Hola!" HORNEADO en los píxeles — no hay forma de cambiarlo por
// otro mensaje sin recrear el botón por código (prohibido), así que a
// diferencia de fases anteriores ya no hay un mensaje distinto por
// evento (racha perdida, celebración, crítico): la reacción visible
// hoy es solo este salto. Si más adelante se necesitan mensajes
// dinámicos de nuevo, van a hacer falta PNGs adicionales (uno por
// mensaje) o algún otro mecanismo que no sea dibujar el globo a mano.
const CHAT_BUBBLE_PULSE_ANIMATION_NAME = "zuzu-bubble-celebrate-pulse";
const CHAT_BUBBLE_PULSE_KEYFRAMES = `
  @keyframes ${CHAT_BUBBLE_PULSE_ANIMATION_NAME} {
    0% { transform: scale(1); }
    35% { transform: scale(1.18); }
    60% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
`;

// Partícula "+N 🪙" que sube y se desvanece sobre la píldora de saldo
// del header al completar un hábito — el "particle animation"
// pedido explícitamente como parte del feedback inmediato.
const COIN_BURST_ANIMATION_NAME = "zuzu-coin-burst";
const COIN_BURST_KEYFRAMES = `
  @keyframes ${COIN_BURST_ANIMATION_NAME} {
    0% { opacity: 0; transform: translateY(6px) scale(0.8); }
    20% { opacity: 1; transform: translateY(0) scale(1.05); }
    75% { opacity: 1; transform: translateY(-10px) scale(1); }
    100% { opacity: 0; transform: translateY(-16px) scale(0.95); }
  }
`;

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

// ModalBackdrop: capa oscurecedora rgba(0,0,0,0.5) + backdrop-blur a
// pantalla completa. Siempre montada (nunca `{open && ...}`) para poder
// animar también la salida. El onClick vive solo acá — la tarjeta del
// modal es un hermano en el DOM (no un hijo), así que un click adentro
// de ella nunca burbujea hasta este div; la tarjeta además lleva su
// propio onClick={(e) => e.stopPropagation()} para dejar esa garantía
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
//
// Sistema de blur unificado (pedido explícito): backdrop-blur-md (12px,
// la escala de Tailwind) en TODO ModalBackdrop, sin importar el nivel.
// La profundidad multinivel no se calcula a mano — es consecuencia
// directa de que cada nivel (modal principal, sub-modal anidado) monta
// su PROPIA capa de blur en su PROPIO z-index: cuando un sub-modal abre
// sobre un modal padre, su backdrop (p.ej. z-[55]) queda POR ENCIMA de
// la tarjeta del modal padre, así que blurea esa tarjeta una vez más
// además del fondo dinámico que ya venía blureado por el backdrop del
// modal principal (z-40) — el fondo termina con blur doble/compuesto,
// la tarjeta padre con blur simple, y el propio sub-modal (que se monta
// arriba de todo, sin ningún backdrop-blur encima) queda nítido. Mismo
// mecanismo que ya resolvía el oscurecido en capas, ahora extendido a
// blur. `will-change` en vez de animar backdrop-filter en sí (que no
// cambia de intensidad, solo de opacidad) ayuda al compositor a no
// repintar de más durante la transición de apertura/cierre.
function ModalBackdrop({ open, onClose, zIndexClassName = "z-40" }) {
  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      className={`absolute inset-0 ${zIndexClassName} bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ willChange: "backdrop-filter, opacity" }}
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
// maxHeight subido de 70% a 82%: con 70%, el contenido más largo de
// PremiumModal (badge + subtítulo + 5 tarjetas de beneficio + botón)
// quedaba ~12px más alto que el área visible — invisible en el primer
// frame (scrollTop 0), así que el botón de $2.99 se veía con el borde
// inferior/esquinas redondeadas cortadas de entrada, y recién se
// arreglaba si el usuario scrolleaba. 82% le da margen de sobra sin
// necesidad de tocar el padding/spacing interno, y no afecta a los
// otros 6 sub-modales (su contenido ya entraba cómodo incluso en 70%).
const NESTED_MODAL_BOX = { left: "50%", top: "50%", width: "86%", maxHeight: "82%" };

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

// NESTED_PILL_GLASS_STYLE: misma receta que PROFILE_GLASS_STYLE (vidrio
// con tinte — sin él, el blur no muestra nada distinto sobre una
// tarjeta opaca sin textura detrás) pero con tinte azul oscuro +
// resplandor en vez del celeste pálido de PROFILE_GLASS_STYLE — para
// las píldoras de precio/categoría de Store y Pets ahora que sus
// tarjetas de preview pasan al fondo espacial oscuro (NESTED_MODAL_STYLE)
// en vez de blanco.
const NESTED_PILL_GLASS_STYLE = {
  background: "rgba(30, 58, 110, 0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(140,190,255,0.3)",
  boxShadow:
    "inset 1.5px 1.5px 3px rgba(180,220,255,0.35), inset -2px -3px 5px rgba(0,10,30,0.35), 0 0 14px rgba(80,150,230,0.45)",
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
// sin inventar el diseño final del personaje. Es opaco (tapa toda la
// tarjeta) porque nació pensado para tarjetas blancas — sigue así en
// ProfileModal (Tarjeta 2, fuera de este pedido), pero Store/Pets pasan
// a NestedPreviewPlaceholder (ver más abajo) ahora que sus tarjetas de
// preview usan el fondo espacial oscuro.
function PetPreviewPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-sky-100 via-white to-sky-100">
      <div className="h-2/3 w-2/3 rounded-[45%] bg-gradient-to-b from-white to-zinc-200 shadow-inner" />
    </div>
  );
}

// NestedPreviewPlaceholder: mismo rol de "silueta de ejemplo" que
// PetPreviewPlaceholder, pero para las tarjetas de preview de Store/Pets
// ahora que pasaron al tema espacial oscuro (NESTED_MODAL_STYLE) — a
// propósito NO opaco: deja ver el degradado + resplandor de la tarjeta
// detrás en vez de taparlo, con un aro de vidrio traslúcido en vez del
// relleno claro sólido de la versión original.
function NestedPreviewPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="h-2/3 w-2/3 rounded-[45%]"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(180,220,255,0.35)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 30px rgba(120,190,255,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
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
// Cámara) usa PROFILE_GLASS_STYLE; el resto (avatar, textos) queda tal
// cual — salvo la Tarjeta 1 (nombre/@handle/bio), que pasó al tema
// "espacial" fijo de los sub-modales de Configuración (ver más abajo).
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
        {/* Tarjeta 1: nombre + bio + fila de 4 botones — mismo tema
            "espacial" fijo que los 7 sub-modales de Configuración
            (NESTED_MODAL_STYLE/NESTED_MODAL_TITLE_CLASS), a pedido
            explícito, SIN los efectos exclusivos del banner ZUZU
            PREMIUM (sin anillo de luz rotando, sin animación de alta
            intensidad — solo fondo + resplandor + texto en degradé).
            Ya no cambia con Dark mode, igual que esos 7 sub-modales. */}
        <div
          className="absolute rounded-[28px]"
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%", ...NESTED_MODAL_STYLE }}
        >
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Name"
              className={`absolute left-0 right-0 border-b border-white/20 bg-transparent text-center text-base font-bold focus:outline-none ${NESTED_MODAL_TITLE_CLASS}`}
              style={{ top: "34.4%" }}
            />
          ) : (
            <p
              className={`absolute left-0 right-0 text-center text-base font-bold ${NESTED_MODAL_TITLE_CLASS}`}
              style={{ top: "34.4%" }}
            >
              {name}
            </p>
          )}
          {editing ? (
            <div className="absolute left-0 right-0 flex items-center justify-center gap-0.5" style={{ top: "40.4%" }}>
              <span className="text-xs text-white">@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                aria-label="Username"
                className="border-b border-white/20 bg-transparent text-center text-xs text-white focus:outline-none"
              />
            </div>
          ) : (
            <p className="absolute left-0 right-0 text-center text-xs text-white" style={{ top: "40.4%" }}>
              @{handle}
            </p>
          )}
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-label="Bio"
              rows={2}
              className="absolute resize-none border-b border-white/20 bg-transparent text-center text-sm text-white focus:outline-none"
              style={{ left: "9.5%", right: "7.6%", top: "50.4%" }}
            />
          ) : (
            <p className="absolute text-center text-sm text-white" style={{ left: "9.5%", right: "7.6%", top: "50.4%" }}>
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

// Estilo "espacial" pedido explícitamente para los 7 sub-modales
// anidados de Configuración (Premium/General Settings/Language/My
// contact/FAQ/Terms/User policy) — reemplaza el vidrio líquido
// translúcido de NestedModal por un fondo azul profundo SÓLIDO (sin
// dejar pasar el fondo dinámico de atrás) con resplandor superior
// centrado + realce luminoso de borde, según las 2 imágenes de
// referencia. A propósito, fijo — ya NO cambia con Dark mode: estos 7
// sub-modales pasan a tener su propia identidad visual "espacial",
// separada del tema claro/oscuro del modal padre de Configuración (que
// sigue usando themeClasses sin cambios). Por eso todo el contenido de
// esos 7 componentes dejó de usar `tc`/`useDarkMode` y pasa a un
// esquema de color fijo (blanco sólido para texto secundario, degradé
// celeste-a-blanco para títulos/valores destacados) en vez de adaptarse
// al tema.
const NESTED_MODAL_BACKGROUND = [
  "radial-gradient(130% 55% at 50% -12%, rgba(148,197,255,0.55) 0%, rgba(148,197,255,0) 60%)",
  "linear-gradient(180deg, #0a1730 0%, #123061 32%, #2c5a9e 68%, #6fa8de 100%)",
].join(", ");

const NESTED_MODAL_STYLE = {
  background: NESTED_MODAL_BACKGROUND,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.35)",
    "inset 0 0 0 1px rgba(255,255,255,0.14)",
    "0 0 60px rgba(80,150,230,0.45)",
    "0 25px 60px rgba(0,0,0,0.5)",
  ].join(", "),
};

// Degradé celeste-a-blanco para títulos/valores primarios (h2 de
// NestedModal, h3 de LegalSection) — texto secundario/de cuerpo se
// queda en blanco sólido para máxima legibilidad, según lo pedido.
const NESTED_MODAL_TITLE_CLASS = "bg-gradient-to-b from-white via-sky-100 to-sky-300 bg-clip-text text-transparent";

// Tarjetas internas de los 7 sub-modales: sólidas/opacas (cero
// bleed-through), no el vidrio translúcido `tc.card` — a propósito,
// para que se note la diferencia entre las tarjetas claras del modal
// padre y estos sub-modales oscuros "espaciales".
const NESTED_CARD_CLASS = "bg-[#12274d] border border-white/10";
const NESTED_CARD_DIVIDE_CLASS = "divide-white/10";
const NESTED_ACCENT_CLASS = "text-sky-300";

// NestedModal: shell compartido por los 7 sub-modales de Configuración
// (Premium/General Settings/Language/My contact/FAQ/Terms/User policy)
// — mismo patrón de dimmer+tarjeta chica centrada que FriendSearchModal/
// ShareSheet (ver ProfileModal más arriba: z-[55] para el dimmer por
// ENCIMA de la tarjeta padre en z-50, z-[60] para la propia).
// Encapsulado acá porque son 7 modales casi idénticos en estructura
// (título + botón cerrar + contenido scrolleable), solo cambia el
// contenido.
function NestedModal({ open, onClose, title, children }) {
  const { t } = useLanguage();
  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} zIndexClassName="z-[55]" />
      <div
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`absolute z-[60] flex flex-col rounded-[28px] p-5 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...NESTED_MODAL_BOX,
          ...NESTED_MODAL_STYLE,
          transform: `translate(-50%, -50%) scale(${open ? 1 : 0.9})`,
          opacity: open ? 1 : 0,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div className="flex shrink-0 items-center justify-between">
          <h2 className={`text-base font-bold ${NESTED_MODAL_TITLE_CLASS}`}>{title}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="liquid-glass-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <PlusIcon className="h-4 w-4 rotate-45 text-white" />
          </button>
        </div>
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-1">{children}</div>
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

// PremiumModal: "subscription / Premium benefits" — lista finalizada de
// 5 beneficios (con su propio emoji, título y descripción — contenido
// real, no placeholders) y precio final de compra única. Sigue sin
// existir un backend de pagos real (Fase 3): el botón de $2.99 USD ya
// no está deshabilitado/"coming soon" (pedido explícito: debe leer como
// el CTA activo final), pero no tiene onClick — no hay ningún
// proveedor de pagos conectado todavía para procesar un cobro real, y
// simular uno acá sería mentirle al usuario sobre el estado real de la
// función. Queda listo para conectar un handler de compra el día que
// haya un proveedor (Stripe/RevenueCat/IAP) integrado.
// Íconos de cada beneficio: reutilizan los assets/íconos YA existentes
// del proyecto en vez de emoji Unicode genéricos (pedido explícito) —
// el componente/ícono se guarda en el propio dato, no se hardcodea en
// el JSX. "No Ads" es el único que se queda con emoji: no hay ningún
// ícono propio del proyecto para eso.
//   - Pets: PetsIcon (mismo ícono/asset que usaba la pestaña "Pets" del
//     Dock viejo — el Dock en sí se reemplazó por PNGs, pero este ícono
//     puntual sigue vivo acá porque PremiumModal, un modal interno, no
//     entra en el alcance de esa purga).
//   - Backgrounds: ImageIcon (el mismo ícono del botón "Backgrounds"
//     del header).
//   - Streak Saver: flame-white.png ("el fueguito blanco" de la racha,
//     mismo asset que usa ProfileModal/el header).
//   - 2x Rewards: tokens-icon.png (el ícono de las Zuzu Coins, mismo
//     asset que la píldora de saldo del header y Store).
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

const PREMIUM_BENEFITS = [
  { emoji: "🚫", titleKey: "premium.benefitNoAdsTitle", descKey: "premium.benefitNoAdsDesc" },
  { Icon: PetsIcon, titleKey: "premium.benefitPetsTitle", descKey: "premium.benefitPetsDesc" },
  { Icon: ImageIcon, titleKey: "premium.benefitBackgroundsTitle", descKey: "premium.benefitBackgroundsDesc" },
  { iconSrc: "/nav/flame-white.png", titleKey: "premium.benefitStreakSaverTitle", descKey: "premium.benefitStreakSaverDesc" },
  { iconSrc: "/nav/tokens-icon.png", titleKey: "premium.benefitRewardsTitle", descKey: "premium.benefitRewardsDesc" },
];

function PremiumModal({ open, onClose }) {
  const { t } = useLanguage();
  return (
    <NestedModal open={open} onClose={onClose} title="ZUZU PREMIUM">
      <div className="flex justify-center">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200">
          {t("premium.badge")}
        </span>
      </div>
      <p className="text-center text-sm text-white/70">{t("premium.subtitle")}</p>
      {PREMIUM_BENEFITS.map((benefit) => {
        const Icon = benefit.Icon;
        return (
          <div key={benefit.titleKey} className={`rounded-2xl px-4 py-3 ${NESTED_CARD_CLASS}`}>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              {benefit.emoji && <span className="text-base leading-none">{benefit.emoji}</span>}
              {Icon && <Icon className="h-5 w-5 shrink-0 text-white" />}
              {benefit.iconSrc && (
                <img
                  src={benefit.iconSrc}
                  alt=""
                  draggable={false}
                  className="h-5 w-5 shrink-0 select-none object-contain"
                />
              )}
              {t(benefit.titleKey)}
            </p>
            <p className="mt-1 text-xs text-white/70">{t(benefit.descKey)}</p>
          </div>
        );
      })}
      {/* CTA de compra: mismo anillo de luz rotando que el banner ZUZU
          PREMIUM de Settings (PREMIUM_RING_GRADIENT/ANIMATION_NAME,
          inyectado en el <style> del dashboard) — pedido explícito de
          mantenerlo acá también. */}
      <div className="relative overflow-hidden rounded-full" style={{ padding: "2.5px" }}>
        <div
          className="absolute inset-[-100%]"
          style={{
            background: PREMIUM_RING_GRADIENT,
            animation: `${PREMIUM_RING_ANIMATION_NAME} 3.5s linear infinite`,
          }}
        />
        <button type="button" className="relative z-10 w-full rounded-full py-3" style={PREMIUM_BANNER_STYLE}>
          <span className={`text-base font-extrabold tracking-wide ${PREMIUM_TEXT_GRADIENT_CLASS}`} style={PREMIUM_TEXT_GLOW_STYLE}>
            {t("premium.ctaPrice")}
          </span>
        </button>
      </div>
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
  const { t } = useLanguage();
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
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 ${NESTED_CARD_CLASS}`}
        >
          <span className="text-sm font-semibold text-white">{t(opt.labelKey)}</span>
          {enabled[opt.key] && <CheckIcon className={`h-5 w-5 ${NESTED_ACCENT_CLASS}`} />}
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
  const { language, setLanguage, t } = useLanguage();
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
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 ${NESTED_CARD_CLASS}`}
        >
          <span className="text-sm font-semibold text-white">{lang.label}</span>
          {language === lang.code && <CheckIcon className={`h-5 w-5 ${NESTED_ACCENT_CLASS}`} />}
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
  const { t } = useLanguage();
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.myContact")}>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.account")}</p>
        <div className={`rounded-2xl px-4 py-3 ${NESTED_CARD_CLASS}`}>
          <p className={`text-sm font-semibold ${NESTED_MODAL_TITLE_CLASS}`}>name_26</p>
          <p className="text-xs text-white/60">name_26@example.com</p>
        </div>
      </div>
      <div>
        <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.linkedAccounts")}</p>
        <div className={`divide-y overflow-hidden rounded-2xl ${NESTED_CARD_CLASS} ${NESTED_CARD_DIVIDE_CLASS}`}>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-white">Google</span>
            <span className="text-xs font-semibold text-emerald-400">{t("contact.connected")}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-white">Apple</span>
            <span className="text-xs text-white/60">{t("contact.notConnected")}</span>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("contact.support")}</p>
        <a
          href="mailto:support@zuzu.app"
          className={`block rounded-2xl px-4 py-3 text-sm font-semibold ${NESTED_ACCENT_CLASS} ${NESTED_CARD_CLASS}`}
        >
          support@zuzu.app
        </a>
      </div>
    </NestedModal>
  );
}

// LegalSection: bloque título+párrafo compartido por FAQ/Terms/User
// policy — evita repetir la misma estructura de <h3>+<p> a mano en
// cada uno de los ~12 bloques entre los 3 modales.
function LegalSection({ title, children }) {
  return (
    <div>
      <h3 className={`mb-1 text-sm font-bold ${NESTED_MODAL_TITLE_CLASS}`}>{title}</h3>
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
  const { t } = useLanguage();
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.faq")}>
      {FAQ_ITEMS.map((item) => (
        <div key={item.q} className={`rounded-2xl px-4 py-3 ${NESTED_CARD_CLASS}`}>
          <p className={`text-sm font-semibold ${NESTED_MODAL_TITLE_CLASS}`}>{item.q}</p>
          <p className="mt-1 text-xs text-white/70">{item.a}</p>
        </div>
      ))}
    </NestedModal>
  );
}

function TermsModal({ open, onClose }) {
  const { t } = useLanguage();
  return (
    <NestedModal open={open} onClose={onClose} title={t("settings.termsOfService")}>
      <LegalSection title="1. Acceptance of terms">
        By creating an account or using Zuzu, you agree to these Terms of Service. If you don&apos;t agree, please don&apos;t use the app.
      </LegalSection>
      <LegalSection title="2. Your account">
        You&apos;re responsible for keeping your login credentials secure and for all activity under your account.
      </LegalSection>
      <LegalSection title="3. Acceptable use">
        Don&apos;t use Zuzu to harass others, share illegal content, or attempt to disrupt the service.
      </LegalSection>
      <LegalSection title="4. Tokens &amp; purchases">
        In-app tokens and store items are virtual goods with no cash value and are non-refundable except where required by law.
      </LegalSection>
      <LegalSection title="5. Termination">
        You can delete your account at any time from User policy. We may suspend accounts that violate these terms.
      </LegalSection>
      <LegalSection title="6. Contact">
        Questions about these terms? Reach us at support@zuzu.app.
      </LegalSection>
    </NestedModal>
  );
}

function UserPolicyModal({ open, onClose, onDeleteAccount }) {
  const { t } = useLanguage();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  return (
    <>
      <NestedModal open={open} onClose={onClose} title={t("settings.userPolicy")}>
        <LegalSection title="Information we collect">
          Your profile info (name, @handle, bio, avatar), gameplay data (streak, level, tokens), and basic device/usage data.
        </LegalSection>
        <LegalSection title="How we use it">
          To run your pet&apos;s progress, show your profile to friends you add, and improve the app. We don&apos;t sell your personal data.
        </LegalSection>
        <LegalSection title="Data sharing">
          Shared only with service providers that help us run Zuzu (e.g. hosting), under confidentiality obligations.
        </LegalSection>
        <LegalSection title="Your rights">
          You can access, correct, or delete your data at any time. Deleting your account removes your profile, pet, and progress permanently.
        </LegalSection>
        <button
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
          className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-400 ${NESTED_CARD_CLASS}`}
        >
          {t("policy.deleteAccount")}
        </button>
        <LegalSection title="Contact">
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

// ZUZU PREMIUM (banner CTA): mismo tratamiento "espacial" que los 7
// sub-modales anidados (fondo azul profundo + resplandor superior),
// pero un poco más brillante/intenso a propósito — es un banner para
// llamar la atención y generar clicks, no una tarjeta de contenido más.
// Fijo, no cambia con Dark mode (igual que NESTED_MODAL_STYLE).
const PREMIUM_BANNER_BACKGROUND = [
  "radial-gradient(140% 90% at 50% -25%, rgba(180,222,255,0.8) 0%, rgba(180,222,255,0) 65%)",
  "linear-gradient(180deg, #0d1f3d 0%, #163a72 30%, #2f66ab 65%, #7db6ea 100%)",
].join(", ");

const PREMIUM_BANNER_STYLE = {
  background: PREMIUM_BANNER_BACKGROUND,
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.55)",
    "inset 0 0 22px rgba(160,210,255,0.4)",
    "0 0 30px rgba(90,160,240,0.65)",
  ].join(", "),
};

// Anillo de luz rotando: capa de fondo con conic-gradient sobredimensionada
// (inset -100% = 3x el tamaño de la píldora en cada eje, así ninguna
// rotación deja una esquina sin cubrir) puesta DETRÁS del botón real y
// recortada a la forma de la píldora por el `overflow-hidden` + `rounded-full`
// del contenedor exterior — el botón interior, más chico por el padding de
// 2px del contenedor, tapa el centro y deja ver solo un aro fino, que es el
// que gira. Se anima con `transform: rotate()` (ver keyframes más abajo,
// inyectados en el <style> del dashboard) en vez de animar el ángulo del
// propio conic-gradient, que necesitaría `@property` para interpolar suave.
const PREMIUM_RING_GRADIENT =
  "conic-gradient(from 0deg, rgba(125,211,252,0.3) 0deg, rgba(125,211,252,0.3) 25deg, #ffffff 55deg, rgba(125,211,252,0.95) 85deg, rgba(125,211,252,0.3) 115deg, rgba(125,211,252,0.3) 360deg)";
const PREMIUM_RING_ANIMATION_NAME = "zuzu-premium-ring-spin";
const PREMIUM_RING_KEYFRAMES = `
  @keyframes ${PREMIUM_RING_ANIMATION_NAME} {
    to { transform: rotate(360deg); }
  }
`;

// Degradé celeste vívido-a-blanco horizontal (más vívido que
// NESTED_MODAL_TITLE_CLASS, pensado para una sola línea ancha en vez de
// un título corto) + drop-shadow doble como resplandor detrás de las
// letras.
const PREMIUM_TEXT_GRADIENT_CLASS = "bg-gradient-to-r from-cyan-200 via-white to-sky-300 bg-clip-text text-transparent";
const PREMIUM_TEXT_GLOW_STYLE = {
  filter: "drop-shadow(0 0 8px rgba(125,211,252,0.85)) drop-shadow(0 0 18px rgba(56,189,248,0.5))",
};

// SettingsModal: layout medido pixel a pixel contra la imagen de
// referencia (mismo MODAL_BOX/canvas que ProfileModal). Único cambio de
// color respecto a la referencia: el marco exterior (Liquid Glass real,
// `.liquid-glass-btn`) y la perilla de cada switch (PROFILE_GLASS_STYLE)
// — son las ÚNICAS dos zonas marcadas en rojo ahí. Todo lo demás
// (tarjetas blancas, íconos negros, texto, chevrons grises, fila de Log
// out) no estaba en rojo en la referencia, pero SÍ cambia con Dark mode
// (ver themeClasses) porque el pedido de esta vuelta es justamente que
// ese swap de tema sea real. ZUZU PREMIUM es la única excepción: banner
// CTA de estilo fijo "espacial" (ver PREMIUM_BANNER_STYLE arriba), no
// sujeto a Dark mode.
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
        {/* ZUZU PREMIUM: banner CTA de estilo fijo "espacial" (no cambia
            con Dark mode — ver PREMIUM_BANNER_STYLE/PREMIUM_RING_GRADIENT
            arriba). Anillo de luz rotando + fondo azul con resplandor +
            texto en degradé con drop-shadow. Abre PremiumModal con los
            beneficios (ver más abajo). */}
        <div
          className="absolute overflow-hidden rounded-full"
          style={{ left: "3.56%", right: "3.67%", top: "3.59%", height: "7.65%", padding: "2.5px" }}
        >
          <div
            className="absolute inset-[-100%]"
            style={{
              background: PREMIUM_RING_GRADIENT,
              animation: `${PREMIUM_RING_ANIMATION_NAME} 3.5s linear infinite`,
            }}
          />
          <button
            type="button"
            onClick={() => setPremiumOpen(true)}
            className="relative z-10 flex h-full w-full items-center justify-center rounded-full"
            style={PREMIUM_BANNER_STYLE}
          >
            <span
              className={`text-lg font-extrabold tracking-wide ${PREMIUM_TEXT_GRADIENT_CLASS}`}
              style={PREMIUM_TEXT_GLOW_STYLE}
            >
              ZUZU PREMIUM
            </span>
          </button>
        </div>

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
// flame-white.png más abajo.
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
// Glass. El preview central y las píldoras pasaron al tema espacial
// oscuro fijo de los sub-modales de Configuración (ver
// NESTED_MODAL_STYLE/NESTED_PILL_GLASS_STYLE) a pedido explícito —
// texto/íconos blancos sin cambios, siguen leyendo bien sobre el nuevo
// fondo oscuro.
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
            (Fase futura). No es parte de ninguna de las 2 tarjetas, así
            que queda tal cual (fuera de este pedido). */}
        <span
          className="liquid-glass-btn absolute rounded-full bg-white"
          style={{ left: "7.55%", top: "4.32%", width: "7.55%", height: "4.12%", ...PROFILE_GLASS_STYLE }}
        />

        {/* Tarjeta 1: preview + píldoras de precio */}
        <div
          className="absolute overflow-hidden rounded-[28px]"
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%", opacity: 1, ...NESTED_MODAL_STYLE }}
        >
          <NestedPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center gap-1.5 rounded-full"
          style={{ left: "14.89%", top: "52.18%", width: "32.90%", height: "8.00%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/tokens-icon.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 shrink-0 select-none object-contain" />
          <span className="text-sm font-bold text-white">150</span>
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "52.00%", top: "52.18%", width: "32.90%", height: "8.00%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <span className="text-sm font-bold text-white">$1.99</span>
        </div>

        {/* Tarjeta 2: preview + 4 pestañas de categoría (Ropa activa por
            defecto) */}
        <div
          className="absolute overflow-hidden rounded-[28px]"
          style={{ left: "3.13%", right: "3.24%", top: "66.29%", height: "29.29%", opacity: 1, ...NESTED_MODAL_STYLE }}
        >
          <NestedPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "7.77%", top: "77.06%", width: "33.01%", height: "8.06%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/hanger-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "44.44%", top: "77.41%", width: "13.27%", height: "7.29%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/cup-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "61.17%", top: "77.41%", width: "13.27%", height: "7.29%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/cat-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "78.21%", top: "77.41%", width: "13.38%", height: "7.29%", ...NESTED_PILL_GLASS_STYLE }}
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
// vidrio. El preview central y las píldoras pasaron al tema espacial
// oscuro fijo de los sub-modales de Configuración (mismo criterio que
// StoreModal — ver NESTED_MODAL_STYLE/NESTED_PILL_GLASS_STYLE), con
// íconos/texto blancos sin cambios.
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
            (midió blanco puro en la referencia, no rojo). No es parte
            de ninguna de las 2 tarjetas, así que queda tal cual. */}
        <span
          className="absolute rounded-full bg-white"
          style={{ left: "85.44%", top: "4.59%", width: "6.58%", height: "3.53%" }}
        />

        {/* Tarjeta 1: preview + píldora "Hat" */}
        <div
          className="absolute overflow-hidden rounded-[28px]"
          style={{ left: "3.13%", right: "3.24%", top: "12.41%", height: "50.47%", opacity: 1, ...NESTED_MODAL_STYLE }}
        >
          <NestedPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "34.74%", top: "52.18%", width: "32.79%", height: "7.94%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <span className="text-sm font-bold text-white">Hat</span>
        </div>

        {/* Tarjeta 2: preview + 3 pestañas de categoría (percha/vaso/gato) */}
        <div
          className="absolute overflow-hidden rounded-[28px]"
          style={{ left: "3.13%", right: "3.24%", top: "66.29%", height: "29.29%", opacity: 1, ...NESTED_MODAL_STYLE }}
        >
          <NestedPreviewPlaceholder />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "16.50%", top: "77.06%", width: "32.90%", height: "8.00%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/hanger-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "53.18%", top: "77.41%", width: "13.16%", height: "7.24%", ...NESTED_PILL_GLASS_STYLE }}
        >
          <img src="/nav/cup-white.png" alt="" draggable={false} className="pointer-events-none h-5 w-5 select-none object-contain" />
        </div>
        <div
          className="liquid-glass-btn absolute flex items-center justify-center rounded-full"
          style={{ left: "69.90%", top: "77.41%", width: "13.16%", height: "7.24%", ...NESTED_PILL_GLASS_STYLE }}
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

// HABITS_SHEET_BOX: a diferencia de MODAL_BOX/NESTED_MODAL_BOX (tarjetas
// centradas), el Habit Tracker es un modal bottom-sheet real — pegado
// al borde inferior de la pantalla (bottom: 0, sin left/right/top como
// offset de centrado) y animado con translateY (0% abierto, 100%
// cerrado) en vez de scale+opacity, para que lea como "sube desde
// abajo" y no como el resto de modales centrados.
const HABITS_SHEET_BOX = { left: 0, right: 0, bottom: 0, maxHeight: "82%" };

// Íconos blancos personalizados provistos por el usuario (recortados a
// su bounding box de alfa +2%, mismo criterio que el resto de assets en
// public/nav/) — pedido explícito de purgar el set anterior (emoji de
// relleno tipo cepillo/escoba/ensalada/paleta/check) y dejar EXCLUSIVAMENTE
// estos 5 como opciones del selector (ver HABIT_EMOJI_CHOICES más abajo).
const HABIT_ICON_ASSETS = {
  book: "/nav/habit-book-white.png",
  water: "/nav/habit-water-white.png",
  meditate: "/nav/habit-meditate-white.png",
  running: "/nav/habit-running-white.png",
  sleep: "/nav/habit-sleep-white.png",
};

// HabitIcon: `habit.emoji` (mismo campo de siempre, reutilizado) ahora
// puede valer una de las 5 claves de HABIT_ICON_ASSETS (ícono PNG
// propio, ya blanco — SIN el filtro de blanqueo, que lo dejaría
// invisible) o un emoji Unicode crudo (blanqueado vía filter). Un único
// helper decide cuál renderizar, así HabitCard y el selector de
// AddHabitForm no repiten la lógica cada uno por su lado.
function HabitIcon({ icon, className }) {
  const src = HABIT_ICON_ASSETS[icon];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        draggable={false}
        className={`${className} pointer-events-none select-none object-contain`}
      />
    );
  }
  return (
    <span className={className} style={HABIT_EMOJI_MONO_STYLE}>
      {icon}
    </span>
  );
}

// Selector de ícono de hábito: pedido explícito de purgar todo lo que
// no sean estos 5 íconos blancos propios (HABIT_ICON_ASSETS) — nada de
// emoji Unicode de relleno ni ningún otro set. EXACTAMENTE estas 5
// claves, en este orden (Book/Water/Meditate/Running/Sleep).
const HABIT_EMOJI_CHOICES = ["book", "water", "meditate", "running", "sleep"];

const HABIT_WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Botones del Habit Tracker: pedido explícito de sacar los rellenos
// sólidos azul/verde menta y usar vidrio (liquid-glass-btn) en todos
// lados, marcando "seleccionado"/"completado" con un aro de luz +
// resplandor de color en vez de un fill plano — mismo bisel base que
// .liquid-glass-btn (inset blanco arriba-izquierda / negro abajo-
// derecha, ver globals.css) con una tercera capa inset de color
// agregada encima.
const HABIT_GLASS_ACCENT_STYLE = {
  boxShadow: [
    "inset 1px 1px 2px rgba(255,255,255,0.5)",
    "inset -1px -1px 2px rgba(0,0,0,0.5)",
    "inset 0 0 0 1.5px rgba(125,211,252,0.85)",
    "0 0 14px rgba(56,189,248,0.5)",
    "0 8px 24px rgba(0,0,0,0.3)",
  ].join(", "),
};
const HABIT_GLASS_DONE_STYLE = {
  boxShadow: [
    "inset 1px 1px 2px rgba(255,255,255,0.5)",
    "inset -1px -1px 2px rgba(0,0,0,0.5)",
    "inset 0 0 0 1.5px rgba(110,231,183,0.85)",
    "0 0 14px rgba(16,185,129,0.45)",
    "0 8px 24px rgba(0,0,0,0.3)",
  ].join(", "),
};
// Aro de selección de la grilla de íconos: pedido explícito de un
// "subtle white glow" (en vez del cian de HABIT_GLASS_ACCENT_STYLE) al
// elegir ícono en AddHabitForm.
const HABIT_GLASS_WHITE_GLOW_STYLE = {
  boxShadow: [
    "inset 1px 1px 2px rgba(255,255,255,0.5)",
    "inset -1px -1px 2px rgba(0,0,0,0.5)",
    "inset 0 0 0 1.5px rgba(255,255,255,0.85)",
    "0 0 14px rgba(255,255,255,0.5)",
    "0 8px 24px rgba(0,0,0,0.3)",
  ].join(", "),
};

// Insignia de recompensa (+N Zuzu Coins): vidrio OSCURO (a diferencia
// de liquid-glass-btn, que es un tinte claro fijo) con aro celeste —
// pedido explícito de sacar el ámbar/amarillo y usar el mismo criterio
// "dark liquid glass" del tema espacial en vez de un tinte claro
// genérico. #00F0FF es el celeste exacto pedido.
const HABIT_COIN_BADGE_STYLE = {
  background: "rgba(8, 20, 40, 0.55)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(0,240,255,0.4)",
  boxShadow: "0 0 8px rgba(0,240,255,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
};
const HABIT_COIN_TEXT_CLASS = "text-[#00F0FF]";

// Los emoji de hábito son glifos de color (fuente de emoji del SO, no
// SVG) — CSS `color` no los afecta. brightness(0) los aplana a negro
// puro conservando su alfa, invert(1) lo vuelve blanco puro: el mismo
// truco que se usa para blanquear íconos de color sin tener un asset
// blanco aparte. Es lo más cerca de "monocromático blanco" que se
// puede pedir de un emoji Unicode real vía CSS. NO se aplica a los
// íconos PNG de HABIT_ICON_ASSETS — esos ya vienen blancos.
const HABIT_EMOJI_MONO_STYLE = { filter: "brightness(0) invert(1)" };

// Texto corto de la frecuencia elegida, para el badge de cada tarjeta.
function habitScheduleLabel(schedule, t) {
  if (!schedule || schedule.type === "noPressure") return t("habits.scheduleNoPressure");
  if (schedule.type === "weekly") return `${schedule.timesPerWeek}x ${t("habits.timesPerWeek")}`;
  if (schedule.type === "days") {
    if (!schedule.days || schedule.days.length === 7) return t("habits.scheduleDays");
    return schedule.days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => HABIT_WEEKDAY_LETTERS[d])
      .join(" ");
  }
  return t("habits.scheduleNoPressure");
}

// HabitCard: una fila por hábito — emoji + título + badge de frecuencia
// + recompensa, con botón "Completar" (y "Hacer versión mini" si el
// hábito tiene micro-hábito definido). El estado "hecho hoy" viene ya
// resuelto en `habit.completedToday` (useHabits lo deriva contra la
// fecha de hoy en cada snapshot).
function HabitCard({ habit, onComplete, onDelete, t }) {
  const done = Boolean(habit.completedToday);
  return (
    <div className={`rounded-2xl p-4 ${NESTED_CARD_CLASS}`}>
      <div className="flex items-start gap-3">
        <HabitIcon icon={habit.emoji} className="h-7 w-7 shrink-0 text-2xl leading-none" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{habit.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
              {habitScheduleLabel(habit.schedule, t)}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${HABIT_COIN_TEXT_CLASS}`}
              style={HABIT_COIN_BADGE_STYLE}
            >
              +{habit.coinReward}
              <img src="/nav/tokens-icon.png" alt="" draggable={false} className="h-3.5 w-3.5 shrink-0 object-contain" />
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(habit.id)}
          aria-label={t("habits.deleteHabit")}
          className="liquid-glass-btn shrink-0 rounded-full p-1.5 text-white/70"
        >
          <PlusIcon className="h-4 w-4 rotate-45" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={done}
          onClick={() => onComplete(habit.id, false)}
          style={done ? HABIT_GLASS_DONE_STYLE : HABIT_GLASS_ACCENT_STYLE}
          className={`liquid-glass-btn flex-1 rounded-full py-2 text-sm font-semibold transition-transform active:scale-95 ${
            done ? "text-emerald-300" : "text-white"
          }`}
        >
          {done ? `✓ ${t("habits.doneToday")}` : "✓"}
        </button>
        {habit.microTitle && !done && (
          <button
            type="button"
            onClick={() => onComplete(habit.id, true)}
            className="liquid-glass-btn flex-1 rounded-full py-2 text-xs font-semibold text-white/80"
            title={habit.microTitle}
          >
            {t("habits.doMicro")}
          </button>
        )}
      </div>
    </div>
  );
}

// AddHabitForm: alta rápida de hábito — título, emoji, micro-hábito
// opcional ("Emergency Mode"), frecuencia (días específicos / veces
// por semana / sin presión) y recompensa en monedas (stepper de 5 en
// 5). Sin validación exhaustiva: el único requisito real es un título
// no vacío, consistente con el resto de la app (sin backend, sin
// lógica de negocio compleja todavía).
function AddHabitForm({ onSave, onCancel, t }) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(HABIT_EMOJI_CHOICES[0]);
  const [microTitle, setMicroTitle] = useState("");
  const [scheduleType, setScheduleType] = useState("noPressure");
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [coinReward, setCoinReward] = useState(10);

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  function handleSave() {
    if (!title.trim()) return;
    const schedule =
      scheduleType === "days"
        ? { type: "days", days }
        : scheduleType === "weekly"
          ? { type: "weekly", timesPerWeek }
          : { type: "noPressure" };
    onSave({ title: title.trim(), emoji, microTitle: microTitle.trim() || null, schedule, coinReward });
  }

  const scheduleTypeButton = (type, label) => (
    <button
      type="button"
      onClick={() => setScheduleType(type)}
      style={scheduleType === type ? HABIT_GLASS_ACCENT_STYLE : undefined}
      className={`liquid-glass-btn flex-1 rounded-full py-2 text-xs font-semibold ${
        scheduleType === type ? "text-white" : "text-white/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`space-y-3 rounded-2xl p-4 ${NESTED_CARD_CLASS}`}>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70">{t("habits.habitTitleLabel")}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("habits.habitTitlePlaceholder")}
          className="w-full rounded-xl border-b border-current/20 bg-transparent px-1 py-2 text-sm text-white focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70">{t("habits.emojiLabel")}</label>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_EMOJI_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setEmoji(choice)}
              style={emoji === choice ? HABIT_GLASS_WHITE_GLOW_STYLE : undefined}
              className="liquid-glass-btn flex h-9 w-9 items-center justify-center rounded-full text-lg"
            >
              <HabitIcon icon={choice} className="h-5 w-5 text-lg" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70">{t("habits.microHabitLabel")}</label>
        <input
          value={microTitle}
          onChange={(e) => setMicroTitle(e.target.value)}
          placeholder={t("habits.microHabitPlaceholder")}
          className="w-full rounded-xl border-b border-current/20 bg-transparent px-1 py-2 text-sm text-white focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-white/70">{t("habits.microHabitHint")}</p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70">{t("habits.scheduleLabel")}</label>
        <div className="flex gap-1.5">
          {scheduleTypeButton("days", t("habits.scheduleDays"))}
          {scheduleTypeButton("weekly", t("habits.scheduleWeekly"))}
          {scheduleTypeButton("noPressure", t("habits.scheduleNoPressure"))}
        </div>
        {scheduleType === "days" && (
          <div className="mt-2 flex justify-between gap-1">
            {HABIT_WEEKDAY_LETTERS.map((letter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                style={days.includes(i) ? HABIT_GLASS_ACCENT_STYLE : undefined}
                className={`liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  days.includes(i) ? "text-white" : "text-white/70"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
        {scheduleType === "weekly" && (
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setTimesPerWeek((v) => Math.max(1, v - 1))}
              className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full text-lg text-white"
            >
              −
            </button>
            <span className="text-sm font-semibold text-white">
              {timesPerWeek} {t("habits.timesPerWeek")}
            </span>
            <button
              type="button"
              onClick={() => setTimesPerWeek((v) => Math.min(7, v + 1))}
              className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full text-lg text-white"
            >
              +
            </button>
          </div>
        )}
        {scheduleType === "noPressure" && <p className="mt-2 text-[11px] text-white/70">{t("habits.noPressureHint")}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-white/70">{t("habits.rewardLabel")}</label>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setCoinReward((v) => Math.max(5, v - 5))}
            className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full text-lg text-white"
          >
            −
          </button>
          <span className={`flex items-center gap-1 text-sm font-semibold ${HABIT_COIN_TEXT_CLASS}`}>
            {coinReward}
            <img src="/nav/tokens-icon.png" alt="" draggable={false} className="h-4 w-4 object-contain" />
          </span>
          <button
            type="button"
            onClick={() => setCoinReward((v) => Math.min(100, v + 5))}
            className="liquid-glass-btn flex h-8 w-8 items-center justify-center rounded-full text-lg text-white"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="liquid-glass-btn flex-1 rounded-full py-2.5 text-sm font-semibold text-white/70">
          {t("habits.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          style={HABIT_GLASS_ACCENT_STYLE}
          className="liquid-glass-btn flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t("habits.save")}
        </button>
      </div>
    </div>
  );
}

// HabitsModal: bottom sheet del Habit Tracker — se abre desde el botón
// "..." de la barra de racha (antes decorativo, sin handler). Filosofía
// "Zero Guilt" en el propio contenido: sin ningún estado de "racha de
// hábitos perdida" ni lenguaje negativo en ningún string (ver
// lib/i18n.js, sección habits.*) — cada hábito es independiente por
// día, completarlo suma monedas, no completarlo no resta ni penaliza
// nada visualmente.
function HabitsModal({ open, onClose, habits, onComplete, onAddHabit, onDeleteHabit }) {
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      <ModalBackdrop open={open} onClose={onClose} />
      <div
        role="dialog"
        aria-label={t("habits.title")}
        aria-hidden={!open}
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-btn absolute z-50 flex flex-col rounded-t-[32px] p-5 ${open ? "" : "pointer-events-none"}`}
        style={{
          ...HABITS_SHEET_BOX,
          transform: `translateY(${open ? "0%" : "100%"})`,
          transition: open ? MODAL_OPEN_TRANSITION : MODAL_CLOSE_TRANSITION,
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-white/40" />
        <div className="flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t("habits.title")}</h2>
            <p className="text-xs text-white/70">{t("habits.subtitle")}</p>
          </div>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="liquid-glass-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          >
            <PlusIcon className="h-4 w-4 rotate-45 text-white" />
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-1">
          {habits.length === 0 && !showAddForm && (
            <p className="py-6 text-center text-sm text-white/70">{t("habits.emptyState")}</p>
          )}
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onComplete={onComplete} onDelete={onDeleteHabit} t={t} />
          ))}
          {showAddForm ? (
            <AddHabitForm
              t={t}
              onCancel={() => setShowAddForm(false)}
              onSave={(habit) => {
                onAddHabit(habit);
                setShowAddForm(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="liquid-glass-btn w-full rounded-2xl py-3 text-sm font-semibold text-white"
            >
              + {t("habits.addHabit")}
            </button>
          )}
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

export default function MainLayout() {
  // Estructura mínima de click pedida explícitamente para los modales
  // de Perfil/Configuración: solo abren/cierran, sin lógica real todavía.
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [petsOpen, setPetsOpen] = useState(false);
  const [backgroundsOpen, setBackgroundsOpen] = useState(false);
  const [habitsOpen, setHabitsOpen] = useState(false);
  const { xp, xpToNext, bestStreak } = usePetStats();
  const { tokens, addTokens } = useTokens();
  const { habits, completeHabit, addHabit, deleteHabit } = useHabits();

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

  // Salto de la burbuja "¡Hola!" (PNG fijo, ver más abajo) al completar
  // un hábito — CHAT_BUBBLE_PULSE_ANIMATION_NAME. Es la reacción
  // "alegre" de la mascota pedida: no hay ningún asset 3D de mascota
  // todavía en esta pantalla (ver PetPreviewPlaceholder y sus
  // comentarios en el resto del archivo), así que la burbuja es la
  // única superficie real disponible para eso. Antes esto también
  // cambiaba el TEXTO de la burbuja (mensaje distinto por evento —
  // racha perdida, celebración, crítico); el PNG que la reemplaza trae
  // "¡Hola!" horneado en los píxeles y no puede mostrar otro texto sin
  // recrear el botón por código (prohibido), así que ese mensaje
  // variable se cae por ahora — ver el comentario de
  // CHAT_BUBBLE_PULSE_ANIMATION_NAME más arriba.
  const [petPulse, setPetPulse] = useState(false);
  // Partícula "+N 🪙" sobre la píldora de saldo (feedback inmediato al
  // completar un hábito) — se limpia sola con un timeout que coincide
  // con la duración de COIN_BURST_ANIMATION_NAME.
  const [coinBurst, setCoinBurst] = useState(null);

  function triggerPetCelebration() {
    setPetPulse(true);
    setTimeout(() => setPetPulse(false), 600);
  }

  // playHabitCompleteSound: sin ningún asset de audio provisto todavía
  // — en vez de apuntar a un archivo que no existe (404 silencioso),
  // sintetiza un "pop" cortito con Web Audio. Envuelto en try/catch:
  // algunos navegadores exigen que el AudioContext se cree/reanude
  // dentro de un gesto del usuario, y tocar el botón de completar ya lo
  // es, pero preferimos fallar en silencio antes que romper el flujo
  // de completar un hábito por un problema de audio.
  function playHabitCompleteSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.24);
      oscillator.onended = () => ctx.close();
    } catch {
      // Sin sonido si Web Audio no está disponible — no es crítico.
    }
  }

  // handleHabitComplete: núcleo del feedback inmediato pedido —
  // acredita monedas de verdad (useTokens), dispara la partícula del
  // saldo, la reacción de la mascota (mensaje + salto), vibración
  // háptica donde el navegador la soporte, y un sonido corto. Si el
  // hábito ya estaba completado hoy, `completeHabit` no acredita nada
  // de nuevo (evita duplicar recompensas) y esta función no dispara
  // ningún feedback — no hay nada que festejar dos veces, pero tampoco
  // ningún mensaje de error: el botón ya se ve "hecho".
  function handleHabitComplete(id, micro) {
    const result = completeHabit(id, { micro });
    if (result.alreadyDone) return;
    addTokens(result.coinsAwarded);
    setCoinBurst({ key: Date.now(), amount: result.coinsAwarded, critical: result.isCritical });
    setTimeout(() => setCoinBurst(null), 1000);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
    playHabitCompleteSound();
    triggerPetCelebration();
  }

  // Sesión, en dos partes (ver WelcomeScreen.jsx):
  // - `signedIn`: si el usuario ya pasó por el OAuth alguna vez. Persiste
  //   en localStorage porque es justamente lo que distingue a un usuario
  //   NUEVO (ve los botones de Google/Apple) de uno que VUELVE (ve el
  //   domo de vidrio y entra deslizando). No hay backend de auth real
  //   todavía: tocar cualquiera de los dos botones lo marca en true.
  // - `entered`: si ya pasó la pantalla de entrada EN ESTA sesión. En
  //   memoria a propósito — el gesto de desbloqueo tiene que volver a
  //   pedirse en cada arranque de la app, si no la pantalla de entrada
  //   no tendría sentido.
  // OJO: Log out solo limpia esto, NO borra datos persistidos como la
  // racha, los hábitos o las preferencias — "clears the session state"
  // se interpreta como la sesión de auth, no como borrar el progreso
  // guardado del usuario, que sería un efecto secundario destructivo
  // no pedido.
  const [signedIn, setSignedIn] = useLocalStorageFlag("zuzu-signed-in", false);
  const [entered, setEntered] = useState(false);

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

  // Compartida por enterPhotoMode, handleLogout, y ahora también el
  // botón "Home" del nuevo dock (PNG bottom-nav-bar.png): "volver al
  // inicio" pedido explícitamente para el botón del medio es, en la
  // práctica, cerrar cualquier modal que haya quedado abierto.
  function closeAllModals() {
    setProfileOpen(false);
    setSettingsOpen(false);
    setStoreOpen(false);
    setPetsOpen(false);
    setBackgroundsOpen(false);
    setHabitsOpen(false);
  }

  function enterPhotoMode() {
    closeAllModals();
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
    closeAllModals();
    setPhotoMode(false);
    setSignedIn(false);
    setEntered(false);
  }

  // La pantalla de entrada cubre los dos casos: sin `signedIn` muestra el
  // OAuth, con `signedIn` muestra el domo de vidrio que se arrastra para
  // desbloquear. `t` va por prop (no por LanguageContext) porque
  // WelcomeScreen vive en su propio archivo y importar el contexto desde
  // acá sería una dependencia circular.
  if (!signedIn || !entered) {
    return (
      <WelcomeScreen
        signedIn={signedIn}
        onSignIn={() => setSignedIn(true)}
        onEnter={() => setEntered(true)}
        t={t}
      />
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-white"
      style={{ background: QA_TEST_BACKGROUND }}
    >
      <style>{`${PREMIUM_RING_KEYFRAMES}${CHAT_BUBBLE_PULSE_KEYFRAMES}${COIN_BURST_KEYFRAMES}`}</style>

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
      {/* ================================================================
          CHROME DEL DASHBOARD — reescrito por completo a pedido explícito
          del usuario para usar EXCLUSIVAMENTE los PNGs que proveyó (perfil,
          usuarios vinculados, configuración, monedas, "¡Hola!", fondos,
          racha, hábitos y el dock inferior), en vez de dibujarlos con
          CSS/SVG/clip-path como en fases anteriores. Regla explícita: cada
          botón se renderiza tal cual el archivo entregado (mismas
          proporciones, mismo alfa nativo) — nada de recrear su aspecto por
          código. Lo único agregado en código es:
            (a) la posición de cada PNG en pantalla,
            (b) su área de toque (el propio <button> envolviendo la imagen),
            (c) el texto de datos dinámicos que ningún PNG estático podría
                contener (el saldo de monedas, el contador de racha) —
                overlay de texto, no una reconstrucción del botón.
          Los 9 assets viven en public/nav2/ (distinto de public/nav/, que
          sigue en uso DENTRO de los modales — Premium/Perfil/Store/etc. —
          fuera del alcance de esta pasada; ver el pedido: solo se purgó el
          chrome EXTERIOR del dashboard, no el contenido de cada modal).
          Todos comparten el mismo relleno de vidrio translúcido
          (rgb(223,227,229) @ 50% alfa) horneado en el propio PNG, así que
          el texto superpuesto usa UI_TEXT_STYLE (blanco + sombra) — el
          mismo tratamiento que ya usaba esta pantalla para texto sobre
          vidrio, ver lib/typography.js.
          Se abandonan intencionalmente, por no poder expresarse con un PNG
          estático: la barra de RELLENO animada de la racha (quedan el ícono
          de la llama + el contador "xp/xpToNext", pero no el degradé de
          progreso que había antes) y los mensajes dinámicos de la burbuja
          "¡Hola!" (el texto viene horneado en el PNG; ver
          CHAT_BUBBLE_PULSE_ANIMATION_NAME más arriba). */}

      {/* Header. Misma posición que ya estaba validada (top-0, p-4,
          columnas en los extremos): Perfil + indicador de usuarios
          vinculados a la izquierda, Configuración + saldo de monedas a la
          derecha. profile-btn.png/settings-btn.png son ~cuadrados
          (379x379) -> h-10 w-10 sin distorsión perceptible; las 2 píldoras
          (avatar-count-btn.png/coin-pill.png, 654x379 ambas) van a altura
          fija h-10 con ancho AUTOMÁTICO (el navegador lo calcula de la
          proporción nativa del archivo — nunca se estira de forma
          desigual). */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
        <div className="flex flex-col items-start gap-2">
          {/* Perfil */}
          <button type="button" onClick={() => setProfileOpen(true)} aria-label="Profile" className="block h-10 w-10">
            <img
              src="/nav2/profile-btn.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full select-none"
            />
          </button>
          {/* Usuarios vinculados: 1 o 2 personas jugando esta cuenta al
              mismo tiempo. El PNG ya trae los 2 círculos dibujados — sin
              lógica de "1 vs 2" todavía (no hay backend de vinculación de
              cuentas), así que por ahora es puramente indicativo, sin
              onClick. */}
          <img
            src="/nav2/avatar-count-btn.png"
            alt=""
            draggable={false}
            className="h-10 w-auto select-none"
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Configuración */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings.title")}
            className="block h-10 w-10"
          >
            <img
              src="/nav2/settings-btn.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full select-none"
            />
          </button>
          {/* Susu Coins: el saldo real (dato dinámico, ningún PNG estático
              podría mostrarlo) va como texto AL LADO del ícono, no
              superpuesto encima — a la altura h-10 que comparte con el
              resto del header, el PNG completo mide solo ~69px de ancho
              (654x379 nativo) y el círculo "Z" ya ocupa buena parte de
              eso: un saldo largo como "1.000.000" se pisaba encima del
              ícono. El contenedor es un flex normal (no inline-flex con
              texto absoluto) para que el número reserve su propio
              espacio en vez de invadir el de la imagen; como la columna
              padre es items-end, el borde derecho de la imagen se sigue
              alineando con Configuración, arriba, igual que antes. */}
          <div className="relative flex h-10 items-center gap-1.5">
            <span className={`text-xs ${UI_TEXT_STYLE}`}>{tokens.toLocaleString("es")}</span>
            <img
              src="/nav2/coin-pill.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-10 w-auto shrink-0 select-none"
            />
            {/* Partícula "+N 🪙" del Habit Tracker (ver handleHabitComplete
                más abajo) — se limpia sola con un timeout, no necesita
                que nada más la desmonte. */}
            {coinBurst && (
              <span
                key={coinBurst.key}
                className="pointer-events-none absolute -top-3 right-2 whitespace-nowrap text-xs font-bold text-emerald-300"
                style={{
                  animation: `${COIN_BURST_ANIMATION_NAME} 900ms ease-out forwards`,
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                +{coinBurst.amount} 🪙
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Burbuja "¡Hola!": PNG fijo (1081x438, ratio ~2.468), mismo ancho
          de referencia (140px) y misma posición (top=28.67%, centrada)
          que el globo dibujado a mano de fases anteriores — solo cambia
          CÓMO se dibuja el globo, no dónde va. El salto al completar un
          hábito (petPulse) sigue vivo: es una animación de transform
          sobre la imagen entera, no una recreación de su aspecto. */}
      <div className="absolute inset-x-0 top-[28.67%] z-10 flex justify-center px-6">
        <img
          src="/nav2/chat-bubble-hola.png"
          alt="¡Hola!"
          draggable={false}
          className="w-[140px] h-auto select-none"
          style={{ animation: petPulse ? `${CHAT_BUBBLE_PULSE_ANIMATION_NAME} 550ms ease-out` : undefined }}
        />
      </div>

      {/* Fondos / Racha / Hábitos: fila horizontal, orden pedido
          explícitamente por el usuario (izquierda a derecha): Fondos,
          racha, Hábitos — antes el orden era racha/Hábitos/Fondos, así que
          esto es un reacomodo intencional, no solo un cambio de assets.
          backgrounds-btn.png/habits-btn.png son ~cuadrados (275x274 /
          274x274) -> h-10 w-10 sin distorsión perceptible; streak-pill.png
          (1555x278, ratio ~5.59) va a h-10 con ancho automático (~224px,
          similar al ancho de la píldora dibujada a mano que reemplaza).
          El contador "xp/xpToNext" se superpone igual que el saldo de
          monedas arriba — dato dinámico. La barra de RELLENO animada que
          había antes (el degradé que crecía con el progreso del día) NO
          tiene equivalente en este PNG (es una superficie lisa) y se cae
          acá: recrearla por código sería justamente lo que se pidió
          eliminar.
          Posición vertical: `bottom: calc(24.48vw + 14px)`, NO un
          `top` en porcentaje. Antes iba con `top-[82.53%]` (66.35%
          heredado de fases previas, subido después a 82.53% para achicar
          el hueco de ~148px que quedó al reemplazar el dock viejo) — pero
          un `top`/`bottom` en % sobre un elemento absoluto se calcula
          contra la ALTURA del contenedor, mientras que la altura real del
          dock (bottom-nav-bar.png) es pura función de su ANCHO (ratio
          nativo 2250x540, contenedor al 102% del viewport → altura
          renderizada = 1.02 × 100vw × (540/2250) = 24.48vw). Dos
          teléfonos con el mismo ancho pero distinto alto (o el mismo
          teléfono con la barra de direcciones mostrándose/ocultándose)
          tienen el dock exactamente a la misma altura en px pero un %
          de la altura total DISTINTO — con `top` en % eso deja que esta
          fila y el dock se acerquen o se superpongan según el alto real
          de cada pantalla (exactamente lo que pasó: a 82.53% de un alto
          más bajo que los 844px de referencia, la fila quedó pisando la
          ola blanca de arriba del dock). Anclando por `bottom` con la
          MISMA fórmula de ancho que ya usa el dock, el margen entre
          ambos queda siempre ~14px sin importar el alto real de la
          pantalla — solo depende del ancho, que es lo único de lo que
          depende el propio dock. `items-center` + `justify-center` de
          este mismo contenedor siguen centrando el grupo horizontalmente
          sin tocar nada más. */}
      <div
        className="absolute inset-x-0 z-10 flex items-center justify-center gap-[9px] px-6"
        style={{ bottom: "calc(24.48vw + 14px)" }}
      >
        <button
          type="button"
          onClick={() => setBackgroundsOpen(true)}
          aria-label="Backgrounds"
          className="block h-10 w-10 shrink-0"
        >
          <img
            src="/nav2/backgrounds-btn.png"
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
          />
        </button>
        <div className="relative inline-flex h-10 items-center">
          <img
            src="/nav2/streak-pill.png"
            alt=""
            draggable={false}
            className="pointer-events-none h-10 w-auto select-none"
          />
          <span className={`pointer-events-none absolute right-4 text-xs ${UI_TEXT_STYLE}`}>
            {xp}/{xpToNext}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setHabitsOpen(true)}
          aria-label={t("habits.title")}
          className="block h-10 w-10 shrink-0"
        >
          <img
            src="/nav2/habits-btn.png"
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
          />
        </button>
      </div>

      {/* Dock inferior: un solo PNG (bottom-nav-bar.png, 2250x560, ratio
          ~4.018) con Tienda/Home/Mascotas ya dibujados adentro — reemplaza
          por completo el panel con clip-path + muesca animada de fases
          anteriores (ya no hay "pestaña activa": ese concepto vivía
          enteramente en el dibujo por código que se pidió eliminar).
          El recorte original de este archivo incluía, separado por un
          hueco vacío, un adorno fino (una línea curva que en el lienzo
          sin rotar corría a la izquierda del cuerpo de la barra) que no
          pertenece al cuerpo sólido de la barra — al conservarlo, el
          bounding box completo quedaba más alto que la barra visible, y
          anclar ESE bounding box al borde inferior dejaba la barra
          flotando con un hueco debajo y esa línea suelta pegada al borde
          real. Recortado ahora SOLO al cuerpo sólido de la barra (sin esa
          línea), así lo que toca bottom:0 es la barra de verdad.
          El contenedor está centrado con `left:50%` + `transform:
          translateX(-50%)` y anclado con `bottom:0; margin:0; padding:0`
          — sin max-width/border-radius que lo recorte —, así que toca los
          3 bordes (izquierdo, derecho, inferior) en cualquier ancho de
          pantalla. La imagen va en `width:100%; height:auto` DENTRO de
          ese contenedor (nunca se distorsiona: la altura la deriva el
          navegador de la proporción real del archivo).
          Colchón de sobredimensionado: el contenedor mide `width:102%`
          (no el 100% del viewport) — un redondeo de subpíxel al convertir
          un ancho al 100% a píxeles reales de dispositivo puede dejar una
          fila o columna de 1px sin cubrir en un borde, invisible en
          Chromium de escritorio pero real en algunos dispositivos, y fue
          justo lo que se vio como un hueco fino en la esquina inferior
          derecha. Ese 2% de sobra (1% a cada lado, porque translateX
          centra el contenedor entero) garantiza que ese redondeo caiga
          siempre DENTRO del área ya cubierta.
          OJO con el mecanismo: la primera vuelta de este colchón usaba
          `transform: scale(1.04)` en la IMAGEN sola, dejando el
          CONTENEDOR en 100% con `overflow: hidden` — pero `transform` es
          puramente de pintado, no cambia la caja de layout del
          contenedor, así que ese `overflow: hidden` (puesto para evitar
          scroll horizontal por el sobrante en los costados) terminaba
          recortando TAMBIÉN el ~2% que la escala empujaba hacia arriba:
          el borde blanco de la ola superior quedaba cortado. Ahora el
          sobredimensionado es un `width` real en el contenedor (no un
          `transform` en la imagen): el contenedor CRECE de verdad, así
          que no hace falta (ni conviene) recortar en vertical — de ahí
          `overflow-x: hidden` (still corta el sobrante horizontal que cae
          fuera del viewport) + `overflow-y: visible` (el trazo blanco de
          arriba nunca se toca). El de la izquierda/derecha sigue
          contenido igual por el `overflow-hidden` del <div> raíz de todo
          el dashboard (más arriba), que ya lo cubriría solo.
          Los 3 íconos quedan a tercios iguales del ancho de la imagen
          (bolsa=izquierda, flecha=centro, mascota=derecha — confirmado
          visualmente contra el archivo) — cada tercio es un botón
          invisible superpuesto del mismo alto que la imagen renderizada;
          ahora miden el mismo 102% que la imagen (son hijos del mismo
          contenedor), así que quedan perfectamente alineados con ella. */}
      <div
        className="absolute z-20 overflow-x-hidden overflow-y-visible"
        style={{ left: "50%", bottom: 0, width: "102%", margin: 0, padding: 0, transform: "translateX(-50%)" }}
      >
        <img
          src="/nav2/bottom-nav-bar.png"
          alt=""
          draggable={false}
          className="pointer-events-none select-none"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "cover", margin: 0, padding: 0 }}
        />
        <div className="absolute inset-0 flex">
          <button type="button" onClick={() => setStoreOpen(true)} aria-label={t("nav.store")} className="h-full flex-1" />
          <button type="button" onClick={closeAllModals} aria-label={t("nav.home")} className="h-full flex-1" />
          <button type="button" onClick={() => setPetsOpen(true)} aria-label={t("nav.pets")} className="h-full flex-1" />
        </div>
      </div>

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
      <HabitsModal
        open={habitsOpen}
        onClose={() => setHabitsOpen(false)}
        habits={habits}
        onComplete={handleHabitComplete}
        onAddHabit={addHabit}
        onDeleteHabit={deleteHabit}
      />
        </>
      )}
    </div>
    </DarkModeContext.Provider>
    </LanguageContext.Provider>
  );
}
