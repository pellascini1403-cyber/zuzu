"use client";

import { useEffect, useRef } from "react";
import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { SKY_ASPECT, SKY_URL } from "@/lib/sky";
import { createGlassEnvironment } from "./glassEnvironment";

// Burbuja de vidrio líquido REAL (WebGL), no una ilustración.
//
// La versión anterior de esta pantalla dibujaba los brillos como paths de
// SVG sobre un div con backdrop-filter: se veían pintados y, sobre todo,
// no eran óptica — no refractaban nada. Acá la esfera es geometría de
// verdad con MeshPhysicalMaterial en modo transmisión: three renderiza la
// escena opaca (el cielo) a un render target y el material la vuelve a
// muestrear desviando el rayo según la normal, el ior y el grosor. O sea
// que lo que se ve DENTRO de la burbuja es el cielo genuinamente refractado,
// y se redistorsiona solo cuando la malla se deforma.
//
//   - transmission + ior + thickness -> refracción real
//   - dispersion                     -> las cáusticas de color del borde
//   - iridescence                    -> el tornasol finísimo del contorno
//   - envMap (glassEnvironment.js)   -> los reflejos especulares; no están
//                                       pintados, son el reflejo de unos
//                                       softboxes, así que se desplazan
//                                       solos al deformarse la superficie.
//
// La deformación va en el vertex shader (inyectada con onBeforeCompile), con
// la normal recalculada por diferencias finitas: sin eso la iluminación
// seguiría siendo la de una esfera y el estirado se vería plano.

export const BUBBLE_RADIUS = 82;
export const BUBBLE_BOTTOM_MARGIN = 118;

const CAMERA_FOV = 32;
// Distancia de cámara que hace que 1 unidad de mundo = 1 píxel CSS en el
// plano z=0, para poder posicionar la burbuja con las mismas coordenadas
// que el resto del DOM (título, hint, tarjeta de login).
const pixelCameraDistance = (heightPx) => heightPx / 2 / Math.tan((CAMERA_FOV * Math.PI) / 360);

// Zoom del cielo sobre el encuadre: el margen sobrante es el que permite que
// las nubes deriven despacio sin que aparezca ningún borde.
const SKY_ZOOM = 1.14;
const SKY_DRIFT_SECONDS = 90;

const SKY_DEPTH = 700; // cuánto detrás de la burbuja se apoya el cielo
// Longitud, en píxeles, del rayo refractado que atraviesa el vidrio: es lo
// que decide cuán lejos del punto de entrada se muestrea el cielo, o sea
// cuánto "aumenta" la burbuja lo que tiene detrás.
//
// OJO con la unidad: three multiplica `thickness` por la escala del modelo
// (getVolumeTransmissionRay -> `normalize(refractionVector) * thickness *
// modelScale`). Como acá la esfera es unitaria y se escala al radio en
// píxeles, `thickness` va en unidades LOCALES. Poniéndolo en píxeles el
// rayo medía ~10.000 unidades y toda la burbuja muestreaba un mismo punto
// lejano del cielo: se veía como una bola azul opaca, sin refracción.
const REFRACTION_DEPTH = 260;

const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// ---------------------------------------------------------------------
// Cielo — es un mesh de la escena, no un fondo CSS: tiene que estar DENTRO
// del render para que la transmisión de la burbuja pueda refractarlo.
// ---------------------------------------------------------------------
const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uScale;   // recorte tipo object-fit: cover
  uniform vec2 uOffset;  // deriva lenta dentro del margen que deja el zoom

  void main() {
    vec2 uv = (vUv - 0.5) * uScale + 0.5 + uOffset;
    gl_FragColor = texture2D(uMap, uv);
  }
`;

// Instancia única, a nivel de módulo: el material tiene que recibir el mismo
// objeto de uniforms en el render, y leerlo de un ref durante el render no
// está permitido en este proyecto.
const SKY_UNIFORMS = {
  uMap: { value: null },
  uScale: { value: [1, 1] },
  uOffset: { value: [0, 0] },
  uTime: { value: 0 },
};

function SkyBackdrop({ texture }) {
  const meshRef = useRef(null);

  // El plano es 1x1 y se escala por frame desde state.size: así un resize
  // (o la barra del navegador en mobile) se refleja sin reconstruir la
  // geometría ni pasar por estado de React.
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dist = pixelCameraDistance(state.size.height) + SKY_DEPTH;
    const visibleH = 2 * dist * Math.tan((CAMERA_FOV * Math.PI) / 360);
    const viewAspect = state.size.width / state.size.height;
    mesh.scale.set(visibleH * viewAspect, visibleH, 1);

    // Cover: se usa el lado que sobra y se recorta el otro, para que la foto
    // llene la pantalla sin deformarse en ninguna proporción.
    const ratio = viewAspect / SKY_ASPECT;
    let sx = ratio > 1 ? 1 : ratio;
    let sy = ratio > 1 ? 1 / ratio : 1;
    sx /= SKY_ZOOM;
    sy /= SKY_ZOOM;

    // Deriva: las nubes tienen que pasar por detrás (y por dentro) de la
    // burbuja. Va con seno/coseno y no con un desplazamiento lineal porque
    // así el recorrido es cerrado y nunca hay un salto al reiniciar el ciclo.
    SKY_UNIFORMS.uTime.value += delta;
    const phase = (SKY_UNIFORMS.uTime.value / SKY_DRIFT_SECONDS) * Math.PI * 2;
    const marginX = (1 - sx) / 2;
    const marginY = (1 - sy) / 2;
    SKY_UNIFORMS.uScale.value[0] = sx;
    SKY_UNIFORMS.uScale.value[1] = sy;
    SKY_UNIFORMS.uOffset.value[0] = Math.sin(phase) * marginX * 0.85;
    SKY_UNIFORMS.uOffset.value[1] = Math.cos(phase * 0.6) * marginY * 0.85;
    SKY_UNIFORMS.uMap.value = texture;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -SKY_DEPTH]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={SKY_UNIFORMS}
        toneMapped={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------
// Deformación (vertex shader)
// ---------------------------------------------------------------------
// La esfera es unitaria, así que `position` ya es la dirección normal. La
// deformación estira en vertical y pellizca en horizontal, con el pellizco
// mucho más fuerte abajo: eso es lo que la vuelve una gota con la punta
// hacia atrás del movimiento en vez de una cápsula. Con uPull = 0 la
// función es exactamente la identidad, o sea que en reposo es una esfera
// perfecta, no una aproximación.
const DEFORM_COMMON = /* glsl */ `
  uniform float uPull;
  uniform float uBend;
  vec3 zuzuDeformed;

  vec3 zuzuDeform(vec3 p) {
    // El gesto va en los dos sentidos, así que la deformación trabaja con la
    // MAGNITUD del arrastre y se orienta con su signo: la cola siempre queda
    // del lado contrario al que se tira. Tirando hacia arriba afina abajo;
    // tirando hacia abajo afina arriba.
    float mag = abs(uPull);
    float t = clamp(p.y * 0.5 + 0.5, 0.0, 1.0);           // 0 abajo, 1 arriba
    float s = uPull >= 0.0 ? t : 1.0 - t;                 // 0 = extremo que arrastra la cola
    float yScale = 1.0 + mag * mix(1.15, 0.36, s);        // la cola cede más
    float pinch = (1.0 - 0.20 * mag) * mix(1.0 - 0.52 * mag, 1.0, smoothstep(-0.05, 0.78, s));
    vec3 q = vec3(p.x * pinch, p.y * yScale, p.z * pinch);
    q.x += uBend * 0.55 * t;                              // inercia lateral
    return q;
  }
`;

// Normal por diferencias finitas sobre la propia deformación: se evalúa en
// dos tangentes y se hace el producto vectorial. Es la diferencia entre que
// el estirado se ilumine como una gota o que siga reflejando como si fuera
// una esfera.
const DEFORM_NORMAL = /* glsl */ `
  vec3 zn = normalize(position);
  vec3 zAxis = abs(zn.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 zta = normalize(cross(zn, zAxis));
  vec3 ztb = normalize(cross(zn, zta));
  zuzuDeformed = zuzuDeform(zn);
  vec3 zp1 = zuzuDeform(normalize(zn + zta * 0.02));
  vec3 zp2 = zuzuDeform(normalize(zn + ztb * 0.02));
  vec3 zNormal = normalize(cross(zp1 - zuzuDeformed, zp2 - zuzuDeformed));
  if (dot(zNormal, zn) < 0.0) zNormal = -zNormal;
  vec3 objectNormal = zNormal;
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`;

function GlassSphere({ stateRef, onFrame, skyImage }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const uniformsRef = useRef({ uPull: { value: 0 }, uBend: { value: 0 } });
  const envRef = useRef(null);
  const setupRef = useRef({ done: false, height: 0 });

  // Inyección de la deformación en el vertex shader del material estándar.
  useEffect(() => {
    const material = materialRef.current;
    const uniforms = uniformsRef.current;
    if (!material) return;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uPull = uniforms.uPull;
      shader.uniforms.uBend = uniforms.uBend;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${DEFORM_COMMON}`)
        .replace("#include <beginnormal_vertex>", DEFORM_NORMAL)
        .replace("#include <begin_vertex>", "vec3 transformed = zuzuDeformed;");
    };
    material.needsUpdate = true;
  }, []);

  useEffect(
    () => () => {
      envRef.current?.dispose();
      envRef.current = null;
    },
    []
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    const uniforms = uniformsRef.current;
    const setup = setupRef.current;
    const s = stateRef.current;
    if (!mesh || !material || !s) return;

    const w = state.size.width;
    const h = state.size.height;

    // Setup único: entorno generado (los reflejos) y la resolución del pase
    // de transmisión. Va acá y no en un efecto porque `gl`/`scene` llegan
    // como argumento del frame, no como valor devuelto por un hook.
    if (!setup.done) {
      setup.done = true;
      const env = createGlassEnvironment(state.gl, skyImage);
      envRef.current = env;
      state.scene.environment = env.texture;
      // El pase de transmisión es una segunda pasada de toda la escena por
      // frame; a media resolución es indistinguible detrás del vidrio y
      // ahorra bastante en móvil.
      state.gl.transmissionResolutionScale = 0.5;
    }

    // Cámara en píxeles: 1 unidad de mundo = 1 px CSS en el plano z=0.
    if (setup.height !== h) {
      setup.height = h;
      const dist = pixelCameraDistance(h);
      state.camera.fov = CAMERA_FOV;
      state.camera.near = 10;
      state.camera.far = dist + SKY_DEPTH * 2;
      state.camera.position.set(0, 0, dist);
      state.camera.updateProjectionMatrix();
    }

    // Integración del resorte. Vive acá y no en un rAF aparte: R3F ya tiene
    // su propio loop, y dos loops compitiendo por el mismo estado es una
    // fuente segura de jitter.
    const dt = Math.min(delta, 0.04);
    if (!s.dragging) {
      const steps = Math.max(1, Math.ceil(dt / 0.008));
      const step = dt / steps;
      for (let i = 0; i < steps; i += 1) {
        const force = -s.spring.k * (s.pull - s.target) - s.spring.c * s.vel;
        s.vel += force * step;
        s.pull += s.vel * step;
      }
      s.bend *= 0.86;
    }
    if (s.unlocking) {
      s.expand = Math.min(1, (performance.now() - s.expandStart) / s.expandMs);
    }

    const restCy = s.signedIn ? h - BUBBLE_BOTTOM_MARGIN - BUBBLE_RADIUS : h * 0.46;
    // Recorrido asimétrico: hacia arriba hay pantalla de sobra, hacia abajo
    // la burbuja ya está apoyada, así que estirando para abajo casi no se
    // desplaza y lo que se ve es la deformación por tensión, no una salida
    // de cuadro.
    const travel = s.pull >= 0 ? 0.42 : 0.1;
    let cy = restCy - s.pull * h * travel;
    let cx = 0;
    let radius = BUBBLE_RADIUS;
    let pull = s.pull;
    let bend = s.bend;

    if (s.expand > 0) {
      // Al desbloquear la gota vuelve a ser esfera y crece hasta pasar la
      // diagonal de la pantalla: ese lavado de vidrio es lo que tapa el
      // cambio al dashboard.
      const e = easeOutCubic(s.expand);
      cy = lerp(cy, h / 2, e);
      cx = lerp(cx, 0, e);
      radius = lerp(radius, Math.hypot(w, h) * 0.78, e);
      pull = lerp(pull, 0, e);
      bend = lerp(bend, 0, e);
    }

    uniforms.uPull.value = pull;
    uniforms.uBend.value = bend;
    mesh.position.set(cx, h / 2 - cy, 0);
    mesh.scale.setScalar(radius);
    // thickness local = profundidad en píxeles / radio, para que el rayo
    // refractado mida siempre lo mismo en pantalla aunque la burbuja crezca.
    material.thickness = REFRACTION_DEPTH / radius;

    onFrame?.(s.pull, s.expand);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <sphereGeometry args={[1, 128, 96]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#ffffff"
        transmission={1}
        thickness={REFRACTION_DEPTH / BUBBLE_RADIUS}
        ior={1.46}
        dispersion={0.45}
        // La rugosidad de la base es la que DESENFOCA lo refractado (three
        // muestrea el target de transmisión con un LOD según roughness), así
        // que las nubes que se ven a través del vidrio salen suavizadas y no
        // recortadas. Los destellos nítidos no se pierden porque los aporta el
        // clearcoat, que va con su propia rugosidad casi nula.
        roughness={0.16}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.02}
        iridescence={0.3}
        iridescenceIOR={1.32}
        iridescenceThicknessRange={[120, 420]}
        envMapIntensity={1.0}
        attenuationColor="#dceeff"
        attenuationDistance={520}
        specularIntensity={1}
      />
    </mesh>
  );
}

function Scene({ stateRef, onFrame }) {
  const texture = useTexture(SKY_URL);
  return (
    <>
      <SkyBackdrop texture={texture} />
      {/* Sin luces direccionales a propósito. Sobre un vidrio con roughness
          tan baja una luz puntual da un punto de brillo diminuto y duro que
          se lee como un artefacto; los reflejos de verdad los pone el mapa
          de entorno, que además es lo que hace que se desplacen solos
          cuando la superficie se deforma. */}
      <ambientLight intensity={0.05} />
      <GlassSphere stateRef={stateRef} onFrame={onFrame} skyImage={texture.image} />
    </>
  );
}

export default function GlassBubbleCanvas({ stateRef, onFrame }) {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 2]}
      flat
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: CAMERA_FOV, position: [0, 0, 1400] }}
    >
      <Suspense fallback={null}>
        <Scene stateRef={stateRef} onFrame={onFrame} />
      </Suspense>
    </Canvas>
  );
}

useTexture.preload(SKY_URL);
