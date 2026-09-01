// Registro central de fondos de escenario disponibles. Cada entrada
// describe cómo pintar el fondo full-bleed (components/ui/BackgroundLayer.jsx)
// para ese id. Un fondo nuevo desbloqueado en la Tienda o elegido desde
// "Personalizar escenario" (ver THEMES en components/modals/ThemeDrawer.jsx)
// solo necesita agregar una entrada acá — BackgroundLayer, MainLayout y
// hooks/useBackground.js ya quedan preparados para leerla sin más cambios.
//
// Por ahora solo existe "default" (el degradado + brillo radial actuales,
// reubicados acá tal cual, sin cambios visuales).
export const DEFAULT_BACKGROUND_ID = "default";

export const BACKGROUNDS = {
  default: {
    label: "Amanecer cálido",
    className: "bg-gradient-to-b from-[#FFF9F2] via-[#FCECD7] to-[#F5E2C8]",
    glowClassName:
      "bg-[radial-gradient(circle_at_50%_42%,rgba(255,196,110,0.55),transparent_60%)]",
  },
};

export function getBackground(id) {
  return BACKGROUNDS[id] ?? BACKGROUNDS[DEFAULT_BACKGROUND_ID];
}
