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

// Gradiente vertical de respaldo, en luminancia lineal. v = 0 es el nadir.
function surround(v) {
  if (v < 0.5) return 0.018 + 0.05 * (v / 0.5); // suelo oscuro
  return 0.068 + 0.3 * ((v - 0.5) / 0.5) ** 1.6; // cielo, más claro arriba
}

// Base del entorno tomada de la MISMA foto que está de fondo. Es lo que
// integra la burbuja con el cielo nuevo: los reflejos difusos llevan el azul
// de arriba y el blanco cálido de las nubes de abajo, en vez de un gris de
// estudio que no tendría nada que ver con lo que hay detrás.
//
// Va muy atenuada (SURROUND_GAIN) y desenfocada a propósito. Sin atenuar, un
// entorno tan claro hace que la esfera refleje blanco en toda su cara y el
// vidrio se vea lechoso; lo que se busca de la foto es el COLOR, mientras el
// contraste y los destellos siguen viniendo de los softboxes en HDR.
const SURROUND_GAIN = 0.42;
const SRGB_TO_LINEAR = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function sampleImage(image) {
  const canvas = document.createElement("canvas");
  canvas.width = ENV_W;
  canvas.height = ENV_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // Desenfocada: de la foto interesa el campo de color, no su detalle, y un
  // detalle nítido en el reflejo del clearcoat delataría que es una textura
  // estirada sobre 360 grados.
  ctx.filter = "blur(9px)";
  // Espejada en Y: la DataTexture no invierte, así que la fila 0 del array
  // es el nadir y tiene que corresponder a la parte BAJA de la foto.
  ctx.translate(0, ENV_H);
  ctx.scale(1, -1);
  ctx.drawImage(image, 0, 0, ENV_W, ENV_H);
  try {
    return ctx.getImageData(0, 0, ENV_W, ENV_H).data;
  } catch {
    return null; // canvas contaminado: se cae al gradiente de respaldo
  }
}

function buildEnvData(image) {
  const photo = image ? sampleImage(image) : null;
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
      if (photo) {
        const p = (y * ENV_W + x) * 4;
        // Se ATENÚA hacia el nadir para que el borde de abajo del vidrio
        // conserve un tono oscuro contra el que recortarse.
        const gain = SURROUND_GAIN * (0.25 + 0.75 * v);
        r = SRGB_TO_LINEAR(photo[p] / 255) * gain;
        g = SRGB_TO_LINEAR(photo[p + 1] / 255) * gain;
        b = SRGB_TO_LINEAR(photo[p + 2] / 255) * gain;
      }
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
// renderer que dibuja la escena. `image` es la foto del fondo: si viene, el
// entorno se construye a partir de ella.
export function createGlassEnvironment(renderer, image) {
  const equirect = new THREE.DataTexture(
    buildEnvData(image),
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
