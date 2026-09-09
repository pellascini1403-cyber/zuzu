"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import useWebGLSupport from "@/hooks/useWebGLSupport";
import {
  EXPAND_MS,
  shouldUnlock,
  SPRING_RETURN,
  SPRING_UNLOCK,
  UNLOCK_DISTANCE,
} from "@/lib/welcomeGesture";

// WelcomeScreen: pantalla de entrada. El cielo y la burbuja de vidrio son
// una escena WebGL real (components/3d/GlassBubbleCanvas.jsx); acá vive el
// gesto, la física del desbloqueo y el DOM de encima (título, hint y la
// tarjeta de login).
//
// La burbuja NO se dibuja con CSS ni con paths de SVG. Antes sí, y el
// problema no era solo que los brillos se vieran pintados: es que no eran
// óptica. Un highlight dibujado no refracta el cielo, no dispersa color en
// el borde y no se reacomoda cuando la superficie cambia de forma — hay que
// animarlo a mano y siempre delata que es un dibujo. Ahora es una esfera de
// verdad con transmisión, dispersión y un mapa de entorno: lo que se ve
// adentro es el cielo refractado, y los reflejos se mueven solos porque son
// reflejos.
//
// Dos estados abajo:
//   - Sin autenticar: tarjeta flotante de vidrio con los botones de OAuth;
//     la burbuja queda más arriba, decorativa.
//   - Autenticado: sin botones. Solo la burbuja — se arrastra hacia arriba,
//     se deforma como mercurio y al pasar el umbral se expande para revelar
//     el dashboard.

// El canvas solo tiene sentido en el cliente; ssr:false evita además que
// three entre en el bundle del servidor.
const GlassBubbleCanvas = dynamic(() => import("@/components/3d/GlassBubbleCanvas"), {
  ssr: false,
});

const lerp = (a, b, t) => a + (b - a) * t;

// Azul profundo del cielo: el texto de esta zona cae sobre la parte clara
// del fondo, donde el blanco no se leería.
const DOME_INK = "#17406e";

// Fondo CSS de respaldo: se ve durante el primer frame, antes de que el
// canvas pinte, y es lo único que queda si el dispositivo no tiene WebGL.
const SKY_FALLBACK = [
  "radial-gradient(80% 45% at 72% 8%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)",
  "linear-gradient(180deg, #2c6ab0 0%, #4a8ccb 26%, #7db4e2 52%, #b9d9f0 76%, #e3f0fa 100%)",
].join(", ");

const WELCOME_KEYFRAMES = `
  @keyframes zuzu-hint-pulse {
    0%, 100% { opacity: 0.6; transform: translate3d(0, 0, 0); }
    50% { opacity: 1; transform: translate3d(0, -4px, 0); }
  }
  @keyframes zuzu-title-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -8px, 0); }
  }
`;

export default function WelcomeScreen({ signedIn, onSignIn, onEnter, t }) {
  const titleRef = useRef(null);
  const hintRef = useRef(null);
  const dragRef = useRef(null);
  const webgl = useWebGLSupport();

  // Estado físico compartido con la escena 3D. Es un ref y no estado de
  // React a propósito: el gesto corre a 60fps y un setState por frame no
  // aportaría nada. El loop de R3F lo lee e integra el resorte.
  const stateRef = useRef({
    pull: 0,
    bend: 0,
    vel: 0,
    target: 0,
    spring: SPRING_RETURN,
    expand: 0,
    expandStart: 0,
    expandMs: EXPAND_MS,
    unlocking: false,
    dragging: false,
    signedIn: false,
  });

  useEffect(() => {
    stateRef.current.signedIn = signedIn;
  }, [signedIn]);

  // Lo único que sigue escribiéndose desde acá es el DOM de encima: el
  // paralaje del título y el desvanecido del hint mientras se tira.
  const handleFrame = useCallback((pull, expand) => {
    if (titleRef.current) {
      titleRef.current.style.transform = `translate3d(0, ${(-pull * 26).toFixed(1)}px, 0)`;
      titleRef.current.style.opacity = String(Math.max(0, 1 - pull * 0.55 - expand));
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, 1 - pull * 1.6));
    }
  }, []);

  const startUnlock = useCallback(() => {
    const s = stateRef.current;
    if (s.unlocking) return;
    s.unlocking = true;
    s.dragging = false;
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
    // La burbuja sube y a la vez se redondea y crece hasta tapar la
    // pantalla: ese "wash" de vidrio es lo que cubre el cambio al
    // dashboard, así el corte nunca se ve.
    s.spring = SPRING_UNLOCK;
    s.target = 1.15;
    s.expandStart = performance.now();
    setTimeout(onEnter, EXPAND_MS + 110);
  }, [onEnter]);

  function handlePointerDown(e) {
    const s = stateRef.current;
    if (!signedIn || s.unlocking) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.dragging = true;
    s.vel = 0;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: e.timeStamp,
      moved: 0,
    };
  }

  function handlePointerMove(e) {
    const s = stateRef.current;
    const drag = dragRef.current;
    if (!drag || s.unlocking) return;
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
    s.vel = lerp(s.vel, sample, 0.55);
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;

    s.pull = pull;
    const w = e.currentTarget.clientWidth || 390;
    s.bend = Math.max(-1, Math.min(1, dx / (w * 0.45)));
  }

  function handlePointerUp(e) {
    const s = stateRef.current;
    const drag = dragRef.current;
    if (!drag || s.unlocking) return;
    dragRef.current = null;
    s.dragging = false;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (shouldUnlock({ moved: drag.moved, pull: s.pull, vel: s.vel })) {
      startUnlock();
      return;
    }
    s.spring = SPRING_RETURN;
    s.target = 0;
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startUnlock();
    }
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ background: SKY_FALLBACK }}>
      <style>{WELCOME_KEYFRAMES}</style>

      {webgl ? <GlassBubbleCanvas stateRef={stateRef} onFrame={handleFrame} /> : null}

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

      {/* Zona inferior: tarjeta de login (sin autenticar) o el gesto.
          Sin WebGL no hay burbuja que arrastrar, así que en ese caso va un
          botón en su lugar — no ADEMÁS del área de arrastre: superpuestos,
          el botón se quedaba con el pointerdown y el gesto no arrancaba
          nunca. */}
      {signedIn && !webgl ? (
        <button
          type="button"
          onClick={onEnter}
          className="absolute inset-x-10 bottom-24 rounded-full py-3.5 text-sm font-semibold"
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.95)",
            color: DOME_INK,
          }}
        >
          {t("welcome.swipeUp")}
        </button>
      ) : null}

      {signedIn && webgl ? (
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
      ) : null}

      {!signedIn ? (
        // Tarjeta flotante de vidrio con el OAuth. Va en la variante clara
        // del vidrio (relleno blanco + tinta azul) porque acá el fondo es la
        // parte luminosa del cielo, no el fondo oscuro del dashboard donde
        // .liquid-glass-btn va en blanco.
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
      ) : null}
    </div>
  );
}
