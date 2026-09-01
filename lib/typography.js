// Sistema de tipografía global para el texto que vive directamente sobre
// el fondo dinámico de la pantalla principal (labels de botones,
// contadores, globo de diálogo, menús) — blanco puro + una sombra suave
// inferior, para que siga siendo legible sin importar qué fondo esté
// activo (claro u oscuro, comprado en la Tienda o elegido en
// "Personalizar escenario"). No se usa dentro de los modales/drawers: esos
// viven sobre tarjetas blancas sólidas, donde el texto oscuro es lo que
// mantiene el contraste.
export const UI_TEXT_STYLE =
  "text-white [text-shadow:0px_2px_4px_rgba(0,0,0,0.25)]";
