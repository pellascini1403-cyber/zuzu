// Microinteracción de "presionado" estilo iOS, compartida por todos los
// botones/píldoras interactivas de la interfaz: encogimiento marcado +
// baño de luz blanca global al tocar, con una transición ultra rápida
// tanto en scale como en filter para que se sienta instantáneo.
//
// PRESS_TRANSITION + PRESSED_CLASSES son la versión "manual" (estado de
// React), usada donde varias capas hermanas (vidrio, borde, ícono, texto)
// deben achicarse/iluminarse EXACTAMENTE en el mismo instante — un simple
// `:active` por elemento no alcanza ahí porque cada capa dispara su propio
// evento de puntero por separado. PRESS_FEEDBACK es el atajo con `:active`
// nativo de CSS para botones simples y autocontenidos (ícono/texto son
// hijos directos del propio elemento presionable).
export const PRESS_TRANSITION = "transition-[scale,filter] duration-150 ease-out";
export const PRESSED_CLASSES = "scale-90 brightness-[1.35]";

export const PRESS_FEEDBACK = `${PRESS_TRANSITION} active:scale-90 active:brightness-[1.35]`;
