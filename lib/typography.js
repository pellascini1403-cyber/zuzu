// Sistema de tipografía global para el texto e íconos que viven
// directamente sobre el fondo dinámico o los botones de cristal de la
// pantalla principal (labels, contadores, "..."/"X", menús) — Poppins
// 600 (semi-bold, ver app/layout.js + globals.css donde --font-sans
// queda mapeada a Poppins) en blanco puro + una sombra suave inferior,
// para que siga siendo legible sin importar qué fondo esté activo (claro
// u oscuro, comprado en la Tienda o elegido en "Personalizar escenario").
// No se usa dentro del globo de diálogo (fondo blanco opaco) ni de los
// modales/drawers (tarjetas blancas sólidas), donde el texto oscuro es
// lo que mantiene el contraste.
export const UI_TEXT_STYLE =
  "font-semibold text-white [text-shadow:0px_2px_3px_rgba(0,0,0,0.35)]";
