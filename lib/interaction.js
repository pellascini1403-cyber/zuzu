// Microinteracción de "presionado" estilo iOS, compartida por todos los
// botones/píldoras interactivas de la interfaz: encogimiento suave +
// brillo leve al tocar, con una transición ultra rápida tanto en
// transform como en filter para que se sienta instantáneo.
export const PRESS_FEEDBACK =
  "transition-[transform,filter] duration-150 ease-out active:scale-95 active:brightness-[1.15]";
