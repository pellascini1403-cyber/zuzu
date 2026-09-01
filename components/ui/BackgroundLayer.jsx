import { getBackground } from "@/lib/backgrounds";

// Capa de fondo global, full-bleed (inset-0) y siempre detrás del resto de
// la UI (z-0) — barra superior, mascota, racha, botonera y personalización
// viven todas por encima de esta capa. Pinta el fondo activo según
// `background` (un id de lib/backgrounds.js), así que es 100% intercambiable
// desde la Tienda o "Personalizar escenario" sin tocar este componente.
export default function BackgroundLayer({ background }) {
  const bg = getBackground(background);

  return (
    <div className={`absolute inset-0 z-0 ${bg.className}`}>
      {bg.glowClassName && <div className={`absolute inset-0 ${bg.glowClassName}`} />}
    </div>
  );
}
