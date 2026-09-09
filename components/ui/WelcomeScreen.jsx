"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// WelcomeScreen: pantalla de entrada de la app. Un solo lienzo — cielo
// animado con nubes + título "ZUZU" — con DOS estados abajo:
//
//   - Sin autenticar (usuario nuevo): tarjeta flotante de vidrio con los
//     botones de OAuth; la burbuja queda más arriba, decorativa.
//   - Autenticado (usuario que vuelve): sin botones. Solo la burbuja de
//     vidrio apoyada abajo — se arrastra hacia arriba, se deforma como
//     mercurio y al pasar el umbral se expande para revelar el dashboard.
//
// Todo el movimiento de la burbuja se escribe IMPERATIVAMENTE sobre el
// DOM (clipPath, `d` de los paths, transforms) en vez de pasar por
// estado de React: es un gesto a 60fps y un setState por frame no aporta
// nada. React solo maneja los estados discretos (autenticado /
// desbloqueando).

// ---------------------------------------------------------------------
// Geometría de la burbuja
// ---------------------------------------------------------------------
const BUBBLE_R = 82; // radio en reposo (164px de diámetro)
const BUBBLE_BOTTOM_MARGIN = 118; // separación del borde inferior al apoyarse
// Constante de aproximación de un círculo con curvas cúbicas.
const CIRCLE_K = 0.5523;
// Píxeles de arrastre que equivalen a pull = 1.
const UNLOCK_DISTANCE = 170;
// Fracción de arrastre a partir de la cual se desbloquea al soltar...
const UNLOCK_THRESHOLD = 0.55;
// ...o velocidad hacia arriba que desbloquea aunque no se haya llegado a
// esa fracción — un flick corto y rápido también entra. Se mide en
// fracciones de UNLOCK_DISTANCE por segundo: 3.2 ≈ 545 px/s, que es un
// flick de verdad. Medido en el navegador, un arrastre deliberado y lento
// ronda 1-1.5, así que con un umbral bajo se desbloqueaba sin querer al
// soltar a mitad de camino. Además exige haber estirado un mínimo, para
// que un temblor rápido al apoyar el dedo no cuente como flick.
const UNLOCK_VELOCITY = 3.2;
const UNLOCK_VELOCITY_MIN_PULL = 0.22;

const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// bubbleGeometry: la burbuja es una forma CERRADA (nunca una barra ni un
// pilar). Cada cuadrante tiene su propio radio, así el arrastre la
// estira en vertical mientras la pellizca en horizontal — conservación
// de volumen a ojo — y afina la parte de abajo hasta dejarla en gota.
// `expand` (solo al desbloquear) la devuelve a esfera y la agranda hasta
// tapar la pantalla.
function bubbleGeometry(w, h, pull, expand, bend, signedIn) {
  // Sin autenticar la burbuja flota más arriba para dejarle el fondo a
  // la tarjeta de login; autenticado se apoya abajo, al alcance del dedo.
  const restCy = signedIn ? h - BUBBLE_BOTTOM_MARGIN - BUBBLE_R : h * 0.46;

  let cx = w / 2;
  let cy = restCy - pull * h * 0.42;
  let rx = BUBBLE_R * (1 - 0.24 * pull);
  let ryTop = BUBBLE_R * (1 + 0.38 * pull);
  let ryBottom = BUBBLE_R * (1 + 1.25 * pull);
  // Los tiradores de abajo se acortan al estirar: eso es lo que afila la
  // gota en punta en vez de dejarla como una cápsula.
  let kBottom = CIRCLE_K * (1 - 0.8 * Math.min(pull, 1));
  let lean = bend * BUBBLE_R * 0.55;

  if (expand > 0) {
    const e = easeOutCubic(expand);
    const maxR = Math.hypot(w, h) * 0.78;
    cx = lerp(cx, w / 2, e);
    cy = lerp(cy, h / 2, e);
    rx = lerp(rx, maxR, e);
    ryTop = lerp(ryTop, maxR, e);
    ryBottom = lerp(ryBottom, maxR, e);
    kBottom = lerp(kBottom, CIRCLE_K, e);
    lean = lerp(lean, 0, e);
  }

  return { cx, cy, rx, ryTop, ryBottom, kBottom, lean };
}

// blobPath: 4 curvas cúbicas cerradas. Con rx = ryTop = ryBottom y
// kBottom = CIRCLE_K da un círculo exacto; los parámetros de arriba lo
// deforman sin que deje de ser una forma redondeada y cerrada.
function blobPath({ cx, cy, rx, ryTop, ryBottom, kBottom, lean }) {
  const topX = cx + lean;
  const hTop = rx * CIRCLE_K;
  const vTop = ryTop * CIRCLE_K;
  const hBot = rx * kBottom;
  const vBot = ryBottom * kBottom;
  const f = (n) => n.toFixed(2);
  return [
    `M ${f(topX)} ${f(cy - ryTop)}`,
    `C ${f(topX + hTop)} ${f(cy - ryTop)}, ${f(cx + rx)} ${f(cy - vTop)}, ${f(cx + rx)} ${f(cy)}`,
    `C ${f(cx + rx)} ${f(cy + vBot)}, ${f(cx + hBot)} ${f(cy + ryBottom)}, ${f(cx)} ${f(cy + ryBottom)}`,
    `C ${f(cx - hBot)} ${f(cy + ryBottom)}, ${f(cx - rx)} ${f(cy + vBot)}, ${f(cx - rx)} ${f(cy)}`,
    `C ${f(cx - rx)} ${f(cy - vTop)}, ${f(topX - hTop)} ${f(cy - ryTop)}, ${f(topX)} ${f(cy - ryTop)}`,
    "Z",
  ].join(" ");
}

// arcPath: arco sobre una elipse interior a la burbuja. Los destellos
// especulares se dibujan así (y no como formas fijas) justamente para
// que se muevan y se estiren CON la malla al deformarse: si la burbuja
// se pellizca, el brillo se pellizca con ella.
function arcPath(cx, cy, rx, ry, a0, a1) {
  const pt = (deg) => {
    const r = (deg * Math.PI) / 180;
    return `${(cx + rx * Math.cos(r)).toFixed(2)} ${(cy - ry * Math.sin(r)).toFixed(2)}`;
  };
  return `M ${pt(a0)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 0 ${pt(a1)}`;
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
// esta pantalla (33ms/frame ≈ 30fps; sacándolas, 16.7ms ≈ 60fps). La
// suavidad va en las paradas del propio degradado, que es gratis.
const CLOUD_LAYERS = [
  {
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
    // Banco de nubes de abajo: sobre el que se apoya la burbuja.
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

const RIM_GRADIENT_ID = "zuzu-bubble-rim";
const GLINT_BLUR_ID = "zuzu-bubble-glint-blur";
const DROP_ID = "zuzu-bubble-drop";

// Azul profundo del cielo: el texto de esta zona cae sobre la parte
// clara del fondo (y sobre el vidrio), donde el blanco no se leería.
const DOME_INK = "#17406e";

// Resorte sub-amortiguado (el crítico para k=170 sería c≈26): al soltar
// antes del umbral la burbuja rebota en vez de frenar en seco.
const SPRING_RETURN = { k: 190, c: 17 };
const SPRING_UNLOCK = { k: 210, c: 26 };
const EXPAND_MS = 420;

export default function WelcomeScreen({ signedIn, onSignIn, onEnter, t }) {
  const rootRef = useRef(null);
  const glassRef = useRef(null);
  const svgRef = useRef(null);
  const rimRef = useRef(null);
  const rimGlowRef = useRef(null);
  const glintARef = useRef(null);
  const glintBRef = useRef(null);
  const refractARef = useRef(null);
  const refractBRef = useRef(null);
  const innerGlowRef = useRef(null);
  const shadowRef = useRef(null);
  const titleRef = useRef(null);
  const hintRef = useRef(null);

  const pullRef = useRef(0);
  const bendRef = useRef(0);
  const velRef = useRef(0);
  const targetRef = useRef(0);
  const springRef = useRef(SPRING_RETURN);
  const expandRef = useRef(0);
  const expandStartRef = useRef(0);
  const unlockingRef = useRef(false);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const dragRef = useRef(null);
  const [unlocking, setUnlocking] = useState(false);

  // applyFrame: único punto donde se escribe el DOM de la burbuja. Lee el
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
    const expand = expandRef.current;
    const geo = bubbleGeometry(w, h, pull, expand, bendRef.current, signedIn);
    const d = blobPath(geo);
    const { cx, cy, rx, ryTop, ryBottom } = geo;
    const ryAvg = (ryTop + ryBottom) / 2;

    glass.style.clipPath = `path("${d}")`;
    if (rimRef.current) rimRef.current.setAttribute("d", d);
    if (rimGlowRef.current) rimGlowRef.current.setAttribute("d", d);
    if (svgRef.current) {
      svgRef.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svgRef.current.setAttribute("width", String(w));
      svgRef.current.setAttribute("height", String(h));
    }

    // Destellos especulares: arcos sobre elipses interiores. Al derivar
    // de rx/ryTop, se desplazan y se estiran con la deformación.
    if (glintARef.current) {
      glintARef.current.setAttribute("d", arcPath(cx, cy, rx * 0.8, ryTop * 0.8, 152, 98));
      glintARef.current.setAttribute("stroke-width", (9 * (rx / BUBBLE_R)).toFixed(2));
    }
    if (glintBRef.current) {
      glintBRef.current.setAttribute("d", arcPath(cx, cy, rx * 0.86, ryTop * 0.86, 58, 32));
      glintBRef.current.setAttribute("stroke-width", (4.5 * (rx / BUBBLE_R)).toFixed(2));
    }

    // Capas internas de refracción: divs de tamaño fijo escalados a los
    // radios actuales, así la refracción se deforma con el vidrio.
    const layer = (ref, sx, sy) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate3d(${(cx - BUBBLE_R).toFixed(1)}px, ${(
        cy - BUBBLE_R
      ).toFixed(1)}px, 0) scale(${((rx / BUBBLE_R) * sx).toFixed(3)}, ${((ryAvg / BUBBLE_R) * sy).toFixed(3)})`;
    };
    layer(refractARef, 1, 1);
    layer(refractBRef, 1, 1);
    layer(innerGlowRef, 1, 1);

    // Sombra de contacto: ancla la burbuja al banco de nubes y se
    // desvanece a medida que despega.
    if (shadowRef.current) {
      const lift = Math.max(0, Math.min(1, pull));
      shadowRef.current.style.transform = `translate3d(${(cx - 90).toFixed(1)}px, ${(
        cy + ryBottom - 14
      ).toFixed(1)}px, 0) scale(${(1 - lift * 0.45).toFixed(3)})`;
      shadowRef.current.style.opacity = String((signedIn ? 0.28 : 0.16) * (1 - lift) * (1 - expand));
    }

    // Paralaje del título mientras se tira de la burbuja.
    if (titleRef.current) {
      titleRef.current.style.transform = `translate3d(0, ${(-pull * 26).toFixed(1)}px, 0)`;
      titleRef.current.style.opacity = String(Math.max(0, 1 - pull * 0.55 - expand));
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - pull * 1.6));
    }
  }, [signedIn]);

  // Primer pintado + resize. Son escrituras imperativas, no setState: no
  // dispara el render en cascada que el linter de este proyecto marca
  // como error.
  useEffect(() => {
    applyFrame();
    window.addEventListener("resize", applyFrame);
    return () => {
      window.removeEventListener("resize", applyFrame);
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyFrame]);

  const runLoop = useCallback(() => {
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

      if (unlockingRef.current) {
        expandRef.current = Math.min(1, (ts - expandStartRef.current) / EXPAND_MS);
      }
      applyFrame();

      const settled =
        Math.abs(pullRef.current - targetRef.current) < 0.002 && Math.abs(velRef.current) < 0.02;
      if (settled && (!unlockingRef.current || expandRef.current >= 1)) {
        if (!unlockingRef.current) {
          pullRef.current = targetRef.current;
          bendRef.current = 0;
          applyFrame();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyFrame]);

  const startUnlock = useCallback(() => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    setUnlocking(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    // La burbuja sube y a la vez se redondea y crece hasta tapar la
    // pantalla: ese "wash" de vidrio es lo que cubre el cambio al
    // dashboard, así el corte nunca se ve.
    springRef.current = SPRING_UNLOCK;
    targetRef.current = 1.15;
    expandStartRef.current = performance.now();
    runLoop();
    setTimeout(onEnter, EXPAND_MS + 110);
  }, [onEnter, runLoop]);

  function handlePointerDown(e) {
    if (!signedIn || unlockingRef.current) return;
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
    if (!drag || unlockingRef.current) return;
    const dy = drag.startY - e.clientY;
    const dx = e.clientX - drag.startX;
    drag.moved = Math.max(drag.moved, Math.abs(dy) + Math.abs(dx));

    const raw = dy / UNLOCK_DISTANCE;
    // Rubber band: pasado el umbral cuesta el triple estirar, como en iOS.
    const pull = raw <= 1 ? Math.max(raw, -0.14) : 1 + (raw - 1) * 0.35;
    const dt = Math.max(e.timeStamp - drag.lastT, 1);
    // Muestra suavizada: un solo evento de puntero es ruidoso y esta
    // velocidad decide el flick Y siembra el resorte al soltar.
    const sample = ((drag.lastY - e.clientY) / UNLOCK_DISTANCE / dt) * 1000;
    velRef.current = lerp(velRef.current, sample, 0.55);
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;

    pullRef.current = pull;
    const w = rootRef.current?.clientWidth || 390;
    bendRef.current = Math.max(-1, Math.min(1, dx / (w * 0.45)));
    applyFrame();
  }

  function handlePointerUp(e) {
    const drag = dragRef.current;
    if (!drag || unlockingRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Un tap limpio (sin arrastre real) también entra: el gesto no puede
    // ser el ÚNICO camino — sin esto quedaría inaccesible por teclado o
    // con un click.
    const tapped = drag.moved < 8;
    const flicked =
      velRef.current >= UNLOCK_VELOCITY && pullRef.current >= UNLOCK_VELOCITY_MIN_PULL;
    if (tapped || pullRef.current >= UNLOCK_THRESHOLD || flicked) {
      startUnlock();
      return;
    }
    springRef.current = SPRING_RETURN;
    targetRef.current = 0;
    runLoop();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startUnlock();
    }
  }

  const initialPath = blobPath(bubbleGeometry(390, 844, 0, 0, 0, signedIn));

  return (
    <div ref={rootRef} className="relative h-[100dvh] w-full overflow-hidden" style={{ background: SKY_BACKGROUND }}>
      <style>{WELCOME_KEYFRAMES}</style>

      {/* Nubes: 3 capas a distinta velocidad = paralaje. Cada capa mide
          200% de ancho y se desplaza -50%, con los puffs duplicados, así
          el loop no tiene salto. */}
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
        style={{ top: "14%", willChange: "transform, opacity" }}
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

      {/* Sombra de contacto sobre el banco de nubes */}
      <div
        ref={shadowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[36px] w-[180px]"
        style={{
          background: "radial-gradient(50% 50% at 50% 50%, rgba(23,64,110,0.5) 0%, rgba(23,64,110,0) 72%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Cristal líquido. El relleno translúcido + el backdrop-blur van en
          un <div> recortado con clip-path (mismo criterio que ChatBubble
          en MainLayout: backdrop-filter sobre un <path> de SVG no es
          confiable); adentro van las capas de refracción interna, y el
          <svg> de encima aporta el contorno y los destellos.
          El fondo es MUY bajo en opacidad a propósito: la burbuja tiene
          que leerse como cristal líquido, no como un plástico blanco. */}
      <div
        ref={glassRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: `path("${initialPath}")`,
          isolation: "isolate",
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(16px) saturate(200%) brightness(1.08)",
          WebkitBackdropFilter: "blur(16px) saturate(200%) brightness(1.08)",
          willChange: "clip-path",
        }}
      >
        {/* Refracción 1: la luz que entra por arriba-izquierda y se
            acumula abajo del vidrio. */}
        <div
          ref={refractARef}
          className="absolute left-0 top-0"
          style={{
            width: BUBBLE_R * 2,
            height: BUBBLE_R * 2,
            transformOrigin: "0 0",
            background:
              "radial-gradient(58% 52% at 34% 76%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 52%, rgba(255,255,255,0) 78%)",
            willChange: "transform",
          }}
        />
        {/* Refracción 2: el tinte frío del cielo desviado por el borde
            superior derecho. */}
        <div
          ref={refractBRef}
          className="absolute left-0 top-0"
          style={{
            width: BUBBLE_R * 2,
            height: BUBBLE_R * 2,
            transformOrigin: "0 0",
            background:
              "radial-gradient(52% 46% at 74% 24%, rgba(168,214,255,0.55) 0%, rgba(120,180,240,0.14) 55%, rgba(255,255,255,0) 80%)",
            willChange: "transform",
          }}
        />
        {/* Glow ambiente interior */}
        <div
          ref={innerGlowRef}
          className="absolute left-0 top-0"
          style={{
            width: BUBBLE_R * 2,
            height: BUBBLE_R * 2,
            transformOrigin: "0 0",
            background:
              "radial-gradient(50% 50% at 50% 42%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0) 76%)",
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
          {/* Rim light: brillante arriba-izquierda, casi apagado en el
              ecuador, y otra vez brillante abajo-derecha — el rebote
              interno típico de una esfera de vidrio. */}
          <linearGradient id={RIM_GRADIENT_ID} x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="34%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="62%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
          </linearGradient>
          <filter id={GLINT_BLUR_ID} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id={DROP_ID} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(23,64,110,0.22)" />
          </filter>
        </defs>

        {/* Halo exterior suave */}
        <path
          ref={rimGlowRef}
          d={initialPath}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="6"
          filter={`url(#${GLINT_BLUR_ID})`}
        />
        {/* Contorno nítido de alto contraste */}
        <path
          ref={rimRef}
          d={initialPath}
          fill="none"
          stroke={`url(#${RIM_GRADIENT_ID})`}
          strokeWidth="1.6"
          filter={`url(#${DROP_ID})`}
        />
        {/* Destello principal (arriba-izquierda), suave y ancho */}
        <path
          ref={glintARef}
          d=""
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="9"
          strokeLinecap="round"
          filter={`url(#${GLINT_BLUR_ID})`}
        />
        {/* Destello corto y nítido del borde superior derecho */}
        <path
          ref={glintBRef}
          d=""
          fill="none"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Zona inferior: tarjeta de login (sin autenticar) o el gesto */}
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
          className="absolute inset-x-0 bottom-0 flex cursor-grab items-end justify-center pb-9 active:cursor-grabbing"
          style={{ height: "46%", touchAction: "none" }}
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
        // Tarjeta flotante de vidrio con el OAuth. Va en la variante
        // clara del vidrio (relleno blanco + tinta azul) porque acá el
        // fondo es la parte luminosa del cielo, no el fondo oscuro del
        // dashboard donde .liquid-glass-btn va en blanco.
        <div
          className="absolute inset-x-5 bottom-9 flex flex-col gap-3 rounded-[30px] p-4"
          style={{
            background: "rgba(255,255,255,0.34)",
            backdropFilter: "blur(22px) saturate(180%)",
            WebkitBackdropFilter: "blur(22px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.65)",
            boxShadow: [
              "inset 1px 1px 2px rgba(255,255,255,0.85)",
              "inset -1px -2px 4px rgba(23,64,110,0.08)",
              "0 18px 40px rgba(23,64,110,0.22)",
            ].join(", "),
          }}
        >
          {[t("onboarding.google"), t("onboarding.apple")].map((label) => (
            <button
              key={label}
              type="button"
              onClick={onSignIn}
              className="rounded-full py-3.5 text-sm font-semibold"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 12px rgba(23,64,110,0.14)",
                color: DOME_INK,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
