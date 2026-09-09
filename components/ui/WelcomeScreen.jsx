"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// WelcomeScreen: pantalla de entrada de la app (reemplaza al viejo
// OnboardingPlaceholder). Un solo lienzo — cielo animado con nubes +
// título "ZUZU" — con DOS estados en la zona de abajo:
//
//   - Sin autenticar (usuario nuevo): el domo de vidrio hace de hoja
//     inferior y contiene los botones de OAuth.
//   - Autenticado (usuario que vuelve): el mismo domo pasa a ser el
//     control interactivo — se arrastra hacia arriba, se deforma como
//     líquido y al pasar el umbral desbloquea el dashboard.
//
// Todo el movimiento del domo se escribe IMPERATIVAMENTE sobre el DOM
// (clipPath, atributo `d` del path, transform del brillo) en vez de
// pasar por estado de React: es un gesto a 60fps, y un setState por
// frame no aporta nada acá. React solo maneja los estados discretos
// (autenticado / desbloqueando).

// ---------------------------------------------------------------------
// Geometría del domo
// ---------------------------------------------------------------------
// Alto del domo en reposo. Con los botones de OAuth adentro necesita más
// aire que en modo "swipe" (donde solo lleva la etiqueta de ayuda).
const DOME_REST_RISE_ENTRY = 150;
const DOME_REST_RISE_AUTH = 265;
// Píxeles de arrastre que equivalen a pull = 1.
const UNLOCK_DISTANCE = 170;
// Fracción de arrastre a partir de la cual se desbloquea al soltar...
const UNLOCK_THRESHOLD = 0.55;
// ...o velocidad hacia arriba (px/ms) que desbloquea aunque no se haya
// llegado a esa fracción — un flick corto y rápido también entra.
const UNLOCK_VELOCITY = 0.5;

// domePath: el domo es una sola curva Bézier simétrica anclada al borde
// inferior de la pantalla. `pull` (0 = reposo, 1 = umbral, >1 = pasado)
// no escala la forma: mueve los puntos de control, así que el domo se
// ESTIRA y se afina (necking) como una gota en vez de agrandarse
// uniformemente. `bend` (-1..1) desplaza el ápice en horizontal para que
// el arrastre en diagonal doble la forma hacia ese lado.
function domePath(w, h, restRise, pull, bend) {
  const maxRise = h * 1.15;
  const rise = restRise + (maxRise - restRise) * pull;
  const apexY = h - rise;
  const apexX = w / 2 + bend * w * 0.22;

  // Al estirarse, la base se mete hacia adentro (la gota se afina);
  // al comprimirse (pull negativo del rebote), se ensancha.
  const inset = w * 0.09 * pull;
  const leftX = -w * 0.07 + inset;
  const rightX = w + w * 0.07 - inset;

  // Los hombros se acercan al ápice a medida que se estira: eso es lo
  // que convierte el domo ancho en una gota alta y angosta. No baja de
  // ~0.2w a propósito — más cerca el ápice se afila en punta y deja de
  // leerse como líquido.
  const shoulder = w * (0.34 - 0.12 * Math.min(pull, 1.4));
  const shoulderY = h - rise * 0.58;

  return [
    `M ${leftX.toFixed(2)} ${h.toFixed(2)}`,
    `C ${(leftX + w * 0.1).toFixed(2)} ${shoulderY.toFixed(2)},`,
    `${(apexX - shoulder).toFixed(2)} ${apexY.toFixed(2)},`,
    `${apexX.toFixed(2)} ${apexY.toFixed(2)}`,
    `C ${(apexX + shoulder).toFixed(2)} ${apexY.toFixed(2)},`,
    `${(rightX - w * 0.1).toFixed(2)} ${shoulderY.toFixed(2)},`,
    `${rightX.toFixed(2)} ${h.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ---------------------------------------------------------------------
// Cielo y nubes
// ---------------------------------------------------------------------
const WELCOME_KEYFRAMES = `
  @keyframes zuzu-cloud-drift {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-50%, 0, 0); }
  }
  @keyframes zuzu-hint-pulse {
    0%, 100% { opacity: 0.6; transform: translate3d(0, 0, 0); }
    50% { opacity: 1; transform: translate3d(0, -4px, 0); }
  }
  @keyframes zuzu-title-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -8px, 0); }
  }
`;

// Cada puff es [x%, y%, radioX%, radioY%, alfa] definido SOLO en la mitad
// izquierda (0-50%): buildCloudBackground lo duplica en x+50 para que el
// loop de translateX(-50%) empalme sin costura.
//
// Las capas NO llevan `filter: blur()`: medido en el navegador, tres
// capas a pantalla completa con blur eran el ÚNICO cuello de botella de
// esta pantalla (33ms/frame ≈ 30fps; sacándolas, 16.7ms ≈ 60fps — el
// domo y el gesto no movían la aguja). La suavidad va en las paradas del
// propio degradado, que es gratis: el resultado se ve igual y cumple el
// requisito de 60fps.
const CLOUD_LAYERS = [
  {
    // Capa lejana: chica, tenue y alta.
    puffs: [
      [4, 26, 9, 5, 0.3],
      [11, 22, 7, 4, 0.24],
      [19, 30, 11, 5, 0.26],
      [31, 20, 8, 4, 0.2],
      [41, 28, 10, 5, 0.28],
    ],
    duration: 190,
  },
  {
    // Capa media.
    puffs: [
      [7, 52, 15, 8, 0.45],
      [16, 47, 11, 6, 0.38],
      [27, 56, 18, 9, 0.42],
      [38, 49, 13, 7, 0.36],
      [46, 58, 12, 7, 0.4],
    ],
    duration: 120,
  },
  {
    // Banco de nubes de abajo: el que se apoya detrás del domo.
    puffs: [
      [6, 88, 26, 16, 0.85],
      [18, 82, 20, 13, 0.7],
      [30, 90, 30, 18, 0.8],
      [43, 84, 22, 14, 0.72],
    ],
    duration: 240,
  },
];

function buildCloudBackground(puffs) {
  return puffs
    .flatMap(([x, y, rx, ry, a]) => [
      [x, y, rx, ry, a],
      [x + 50, y, rx, ry, a],
    ])
    .map(
      ([x, y, rx, ry, a]) =>
        `radial-gradient(${rx}% ${ry}% at ${x}% ${y}%, rgba(255,255,255,${a}) 0%, rgba(255,255,255,${(
          a * 0.72
        ).toFixed(3)}) 28%, rgba(255,255,255,${(a * 0.32).toFixed(3)}) 54%, rgba(255,255,255,0) 80%)`
    )
    .join(", ");
}

const SKY_BACKGROUND = [
  "radial-gradient(80% 45% at 72% 8%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)",
  "linear-gradient(180deg, #2c6ab0 0%, #4a8ccb 26%, #7db4e2 52%, #b9d9f0 76%, #e3f0fa 100%)",
].join(", ");

const GLASS_BEVEL_ID = "zuzu-welcome-bevel";
const GLASS_SHADOW_ID = "zuzu-welcome-shadow";

// Azul profundo del propio cielo: el texto de esta zona cae SOBRE el
// domo (vidrio casi blanco), así que en blanco sería ilegible — es la
// única parte de la app donde el texto sobre vidrio no va en blanco.
const DOME_INK = "#17406e";

// Variante clara de .liquid-glass-btn (globals.css) para los botones de
// OAuth: mismo vidrio (translúcido + blur + bisel), pero con relleno
// blanco y tinta oscura, porque acá el fondo es el domo claro y no el
// fondo dinámico oscuro del dashboard.
const SIGN_IN_BUTTON_STYLE = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: [
    "inset 1.5px 1.5px 3px rgba(255,255,255,0.9)",
    "inset -1px -2px 3px rgba(23,64,110,0.10)",
    "0 6px 18px rgba(23,64,110,0.18)",
  ].join(", "),
  color: DOME_INK,
};

// Resorte: k/c elegidos para quedar sub-amortiguados (el crítico para
// k=170 sería c≈26), así el domo rebota al soltarlo en vez de frenar en
// seco — es la "elasticidad" del gesto.
const SPRING_RETURN = { k: 170, c: 18 };
const SPRING_UNLOCK = { k: 210, c: 26 };

export default function WelcomeScreen({ signedIn, onSignIn, onEnter, t }) {
  const rootRef = useRef(null);
  const glassRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const glowRef = useRef(null);
  const titleRef = useRef(null);
  const hintRef = useRef(null);

  const pullRef = useRef(0);
  const bendRef = useRef(0);
  const velRef = useRef(0);
  const targetRef = useRef(0);
  const springRef = useRef(SPRING_RETURN);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const dragRef = useRef(null);
  const [unlocking, setUnlocking] = useState(false);

  const restRise = signedIn ? DOME_REST_RISE_ENTRY : DOME_REST_RISE_AUTH;

  // applyFrame: único punto donde se escribe el DOM del domo. Lee el
  // tamaño real del contenedor en cada llamada, así un resize (o el
  // cambio de alto por la barra del navegador en mobile) se refleja sin
  // estado ni listeners extra.
  const applyFrame = useCallback(() => {
    const root = rootRef.current;
    const glass = glassRef.current;
    if (!root || !glass) return;
    const w = root.clientWidth;
    const h = root.clientHeight;
    const pull = pullRef.current;
    const d = domePath(w, h, restRise, pull, bendRef.current);

    glass.style.clipPath = `path("${d}")`;
    if (pathRef.current) pathRef.current.setAttribute("d", d);
    if (svgRef.current) {
      svgRef.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svgRef.current.setAttribute("width", String(w));
      svgRef.current.setAttribute("height", String(h));
    }
    // El resplandor interior sigue al ápice del domo.
    if (glowRef.current) {
      const apexY = h - (restRise + (h * 1.15 - restRise) * pull);
      glowRef.current.style.transform = `translate3d(-50%, ${apexY.toFixed(1)}px, 0)`;
    }
    // Paralaje suave del título mientras se tira del domo.
    if (titleRef.current) {
      titleRef.current.style.transform = `translate3d(0, ${(-pull * 26).toFixed(1)}px, 0)`;
      titleRef.current.style.opacity = String(Math.max(0, 1 - pull * 0.55));
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - pull * 1.6));
    }
  }, [restRise]);

  // Primer pintado + resize. Son escrituras imperativas, no setState:
  // no dispara el render en cascada que el linter de este proyecto
  // marca como error.
  useEffect(() => {
    applyFrame();
    window.addEventListener("resize", applyFrame);
    return () => {
      window.removeEventListener("resize", applyFrame);
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyFrame]);

  const runSpring = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    lastTsRef.current = 0;
    const tick = (ts) => {
      const prev = lastTsRef.current || ts;
      lastTsRef.current = ts;
      // Clamp del dt: si la pestaña estuvo en segundo plano, un salto
      // grande haría explotar la integración.
      const dt = Math.min(ts - prev, 40);
      const { k, c } = springRef.current;
      const steps = Math.max(1, Math.ceil(dt / 8));
      const step = dt / steps / 1000;
      for (let i = 0; i < steps; i += 1) {
        const force = -k * (pullRef.current - targetRef.current) - c * velRef.current;
        velRef.current += force * step;
        pullRef.current += velRef.current * step;
      }
      bendRef.current *= 0.86;
      applyFrame();

      const settled =
        Math.abs(pullRef.current - targetRef.current) < 0.002 && Math.abs(velRef.current) < 0.02;
      if (settled) {
        pullRef.current = targetRef.current;
        bendRef.current = 0;
        applyFrame();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyFrame]);

  const startUnlock = useCallback(() => {
    if (unlocking) return;
    setUnlocking(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    // El domo se expande hasta tapar la pantalla: es la "transición de
    // desbloqueo" — el vidrio sube, cubre todo y recién ahí se monta el
    // dashboard, así el corte nunca se ve.
    springRef.current = SPRING_UNLOCK;
    targetRef.current = 2.6;
    runSpring();
    if (rootRef.current) {
      rootRef.current.style.transition = "opacity 260ms ease-in 200ms";
      rootRef.current.style.opacity = "0";
    }
    setTimeout(onEnter, 430);
  }, [onEnter, runSpring, unlocking]);

  function handlePointerDown(e) {
    if (!signedIn || unlocking) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(rafRef.current);
    velRef.current = 0;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: e.timeStamp,
      moved: 0,
    };
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag || unlocking) return;
    const dy = drag.startY - e.clientY;
    const dx = e.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dy) + Math.abs(dx));

    const raw = dy / UNLOCK_DISTANCE;
    // Rubber band: pasado el umbral cuesta el triple estirar, como en iOS.
    const pull = raw <= 1 ? Math.max(raw, -0.14) : 1 + (raw - 1) * 0.35;
    const dt = Math.max(e.timeStamp - drag.lastT, 1);
    velRef.current = ((drag.lastY - e.clientY) / UNLOCK_DISTANCE / dt) * 1000;
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;

    pullRef.current = pull;
    const w = rootRef.current?.clientWidth || 390;
    bendRef.current = Math.max(-1, Math.min(1, dx / (w * 0.45)));
    applyFrame();
  }

  function handlePointerUp(e) {
    const drag = dragRef.current;
    if (!drag || unlocking) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Un tap limpio (sin arrastre real) también entra: el gesto no puede
    // ser el ÚNICO camino — sin esto quedaría inaccesible por teclado o
    // con un click.
    const tapped = drag.moved < 8;
    if (tapped || pullRef.current >= UNLOCK_THRESHOLD || velRef.current >= UNLOCK_VELOCITY) {
      startUnlock();
      return;
    }
    springRef.current = SPRING_RETURN;
    targetRef.current = 0;
    runSpring();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startUnlock();
    }
  }

  const initialPath = domePath(390, 844, restRise, 0, 0);

  return (
    <div ref={rootRef} className="relative h-[100dvh] w-full overflow-hidden" style={{ background: SKY_BACKGROUND }}>
      <style>{WELCOME_KEYFRAMES}</style>

      {/* Nubes: 3 capas a distinta velocidad/desenfoque = paralaje. Cada
          capa mide 200% de ancho y se desplaza -50%, con los puffs
          duplicados, así el loop no tiene salto. */}
      {CLOUD_LAYERS.map((layer, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{
            width: "200%",
            background: buildCloudBackground(layer.puffs),
            animation: `zuzu-cloud-drift ${layer.duration}s linear infinite`,
            willChange: "transform",
          }}
        />
      ))}

      {/* Título */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center"
        style={{ top: "18%", willChange: "transform, opacity" }}
      >
        <h1
          className="text-6xl font-black tracking-[0.16em] text-white"
          style={{
            animation: "zuzu-title-float 6s ease-in-out infinite",
            textShadow: "0 4px 18px rgba(23,64,110,0.35), 0 1px 2px rgba(23,64,110,0.25)",
          }}
        >
          ZUZU
        </h1>
      </div>

      {/* Domo de vidrio. El relleno + backdrop-blur van en un <div> con
          clip-path (mismo criterio que ChatBubble en MainLayout: el
          backdrop-filter sobre un <path> de SVG no es confiable), y el
          <svg> de encima aporta solo el bisel especular y la sombra. */}
      <div
        ref={glassRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: `path("${initialPath}")`,
          isolation: "isolate",
          background: "rgba(255,255,255,0.28)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
          willChange: "clip-path",
        }}
      >
        <div
          ref={glowRef}
          className="absolute left-1/2 h-[420px] w-[560px]"
          style={{
            marginTop: "-190px",
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0) 72%)",
            willChange: "transform",
          }}
        />
      </div>
      <svg
        ref={svgRef}
        aria-hidden="true"
        viewBox="0 0 390 844"
        width="390"
        height="844"
        className="pointer-events-none absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={GLASS_BEVEL_ID} x1="0%" y1="0%" x2="30%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
          </linearGradient>
          <filter id={GLASS_SHADOW_ID} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="-6" stdDeviation="10" floodColor="rgba(23,64,110,0.28)" />
          </filter>
        </defs>
        <path
          ref={pathRef}
          d={initialPath}
          fill="none"
          stroke={`url(#${GLASS_BEVEL_ID})`}
          strokeWidth="1.5"
          filter={`url(#${GLASS_SHADOW_ID})`}
        />
      </svg>

      {/* Zona inferior: OAuth (sin autenticar) o el gesto (autenticado) */}
      {signedIn ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={t("welcome.swipeUp")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="absolute inset-x-0 bottom-0 flex cursor-grab items-end justify-center pb-10 active:cursor-grabbing"
          style={{ height: "52%", touchAction: "none" }}
        >
          <div ref={hintRef} style={{ willChange: "opacity" }}>
            <span
              className="block text-sm font-semibold"
              style={{
                animation: "zuzu-hint-pulse 2.4s ease-in-out infinite",
                color: DOME_INK,
                textShadow: "0 1px 6px rgba(255,255,255,0.7)",
              }}
            >
              {t("welcome.swipeUp")}
            </span>
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-10 pb-12">
          <button type="button" onClick={onSignIn} className="rounded-full py-3.5 text-sm font-semibold" style={SIGN_IN_BUTTON_STYLE}>
            {t("onboarding.google")}
          </button>
          <button type="button" onClick={onSignIn} className="rounded-full py-3.5 text-sm font-semibold" style={SIGN_IN_BUTTON_STYLE}>
            {t("onboarding.apple")}
          </button>
        </div>
      )}
    </div>
  );
}
