import * as THREE from "three";

// Mapa de entorno equirectangular generado en runtime (sin descargar ningún
// HDRI). Es lo que le da a la esfera sus REFLEJOS: los brillos especulares
// del vidrio no están pintados, son el reflejo real de estos "softboxes"
// sobre la superficie. Por eso se desplazan solos cuando la malla se
// deforma — es óptica, no una capa dibujada encima.
//
// Va como textura FLOAT, no como <canvas>. Un canvas es LDR: su blanco vale
// 1.0, el mismo valor que un gris claro del fondo, así que para que el
// destello se notara había que subir envMapIntensity y eso levantaba también
// el entorno entero — la esfera terminaba reflejando blanco en toda su cara
// y el vidrio se veía lechoso. Un estudio real tiene el fondo oscuro y los
// softboxes decenas de veces más brillantes que el blanco; con datos en
// coma flotante eso se puede representar, y es lo que hace que el brillo sea
// chico, nítido e intenso en vez de una mancha clara.
const ENV_W = 512;
const ENV_H = 256;

// Dónde cae cada cosa, en coordenadas (u, v) de este equirect
// ----------------------------------------------------------
// three muestrea con u = atan2(d.z, d.x)/2pi + 0.5 y v = asin(d.y)/pi + 0.5.
// Para una esfera vista de frente con la cámara en +Z, la dirección
// reflejada sale de r = 2(n·v)n - v, lo que deja:
//
//   centro de la esfera   -> u ~ 0.25, v ~ 0.5
//   arriba a la izquierda -> u ~ 0.0 / 1.0 (cae en la costura)
//   arriba a la derecha   -> u ~ 0.5
//   ...ambos a v ~ 0.75
//
// Por eso los softboxes van en esas posiciones y no "donde se ven": lo que
// se define acá es el entorno, no el brillo.
const SOFTBOXES = [
  // [u, v, ancho, alto, intensidad, dureza del borde]
  // Principal: ancho y alargado, el reflejo grande de arriba a la izquierda.
  [0.0, 0.76, 0.15, 0.1, 13, 0.55],
  // Secundario: chico y duro, el destello corto de arriba a la derecha.
  [0.5, 0.78, 0.05, 0.08, 26, 0.8],
  // Rebote frío desde abajo: sostiene el borde inferior sin levantar el fondo.
  [0.25, 0.26, 0.22, 0.1, 1.1, 0.25],
];

// Distancia horizontal teniendo en cuenta que u da la vuelta en 1.0.
function wrapDelta(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

// Gradiente vertical del entorno, en luminancia lineal. v = 0 es el nadir.
function surround(v) {
  if (v < 0.5) return 0.018 + 0.05 * (v / 0.5); // suelo oscuro
  return 0.068 + 0.3 * ((v - 0.5) / 0.5) ** 1.6; // cielo, más claro arriba
}

function buildEnvData() {
  const data = new Float32Array(ENV_W * ENV_H * 4);
  for (let y = 0; y < ENV_H; y += 1) {
    // La DataTexture no invierte en Y, así que la fila 0 es el nadir.
    const v = y / (ENV_H - 1);
    const base = surround(v);
    for (let x = 0; x < ENV_W; x += 1) {
      const u = x / ENV_W;
      let r = base;
      let g = base * 1.02;
      let b = base * 1.12; // el entorno tira levemente a frío
      for (const [su, sv, sw, sh, intensity, edge] of SOFTBOXES) {
        const du = wrapDelta(u, su) / sw;
        const dv = Math.abs(v - sv) / sh;
        // Caja redondeada: una p-norma alta da lados rectos con esquinas
        // suaves, que es la forma de un softbox real.
        const d = (du ** 4 + dv ** 4) ** 0.25;
        if (d >= 1.35) continue;
        const falloff = 1 - Math.min(1, Math.max(0, (d - edge) / (1.35 - edge)));
        const value = intensity * falloff * falloff;
        r += value;
        g += value;
        b += value * 1.01;
      }
      const i = (y * ENV_W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 1;
    }
  }
  return data;
}

// Devuelve { texture, dispose }. La PMREM hay que generarla con el mismo
// renderer que dibuja la escena.
export function createGlassEnvironment(renderer) {
  const equirect = new THREE.DataTexture(
    buildEnvData(),
    ENV_W,
    ENV_H,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  // Son valores lineales de radiancia, no colores sRGB.
  equirect.colorSpace = THREE.NoColorSpace;
  equirect.minFilter = THREE.LinearFilter;
  equirect.magFilter = THREE.LinearFilter;
  equirect.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(equirect);

  equirect.dispose();
  pmrem.dispose();

  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  };
}
