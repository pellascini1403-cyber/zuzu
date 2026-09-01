import { UI_TEXT_STYLE } from "@/lib/typography";
import { GLASS_BG } from "@/lib/glass";

// Mismo acabado "vidrio real" que los botones de arriba: borde blanco
// definido, relleno blanco translúcido sutil (GLASS_BG) con blur, inset
// superior oscuro para que el texto blanco resalte, y sombra cálida
// inferior para el volumen 3D.
export default function ThemeBar({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`mx-auto flex w-[90%] items-center justify-center gap-1 rounded-full border-2 border-white ${GLASS_BG} py-3 text-xs font-medium backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25)] transition-colors hover:bg-[rgba(255,255,255,0.35)] ${UI_TEXT_STYLE}`}
    >
      <span aria-hidden="true">⌃</span>
      Personalizar escenario
    </button>
  );
}
