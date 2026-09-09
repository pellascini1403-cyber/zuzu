// Umbrales y decisión del gesto de entrada. Viven fuera del componente para
// poder verificarlos por tabla: la decisión depende de tres números y de
// nada más, y sintetizar velocidades de gesto exactas dentro de un navegador
// es mucho menos confiable que compararlas acá.

// Píxeles de arrastre que equivalen a pull = 1.
export const UNLOCK_DISTANCE = 170;

// Fracción de arrastre a partir de la cual se desbloquea al soltar.
export const UNLOCK_THRESHOLD = 0.55;

// Velocidad hacia arriba que desbloquea aunque no se haya llegado a esa
// fracción — un flick corto y rápido también entra. Se mide en fracciones
// de UNLOCK_DISTANCE por segundo: 3.2 ≈ 545 px/s, que es un flick de
// verdad. Medido en el navegador, un arrastre deliberado y lento ronda
// 1-1.5, así que con un umbral bajo se desbloqueaba sin querer al soltar a
// mitad de camino.
export const UNLOCK_VELOCITY = 3.2;

// Además del flick hay que haber estirado un mínimo, para que un temblor
// rápido al apoyar el dedo no cuente como gesto.
export const UNLOCK_VELOCITY_MIN_PULL = 0.22;

// Por debajo de esto no hubo arrastre: fue un tap.
export const TAP_SLOP = 8;

// Resorte sub-amortiguado (el crítico para k=190 sería c≈27): al soltar
// antes del umbral la burbuja rebota en vez de frenar en seco.
export const SPRING_RETURN = { k: 190, c: 17 };
export const SPRING_UNLOCK = { k: 210, c: 26 };
export const EXPAND_MS = 420;

// moved: píxeles totales recorridos por el puntero
// pull:  fracción de UNLOCK_DISTANCE estirada al soltar
// vel:   velocidad hacia arriba, en fracciones de UNLOCK_DISTANCE por segundo
export function shouldUnlock({ moved, pull, vel }) {
  // Un tap limpio también entra: el gesto no puede ser el ÚNICO camino —
  // sin esto la pantalla quedaría inaccesible por teclado o con un click.
  if (moved < TAP_SLOP) return true;
  if (pull >= UNLOCK_THRESHOLD) return true;
  return vel >= UNLOCK_VELOCITY && pull >= UNLOCK_VELOCITY_MIN_PULL;
}
