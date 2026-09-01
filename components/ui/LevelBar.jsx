import { UI_TEXT_STYLE } from "@/lib/typography";
import { GLASS_BG } from "@/lib/glass";

// Cápsula de vidrio translúcida, mismo lenguaje visual que NavButton/
// TopBar (borde blanco visible + brillo). El relleno de progreso (más
// abajo) no cambió: mismo degradado, misma lógica de ancho. Fondo blanco
// translúcido sutil (GLASS_BG) con el inset superior oscuro, para que el
// texto blanco resalte sin quedar pesado.
const trackStyle = `rounded-full ${GLASS_BG} backdrop-blur-md border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25)]`;

export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div
      className={`flex h-8 w-[65%] max-w-[280px] flex-none items-center gap-2 px-1.5 ${trackStyle}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-amber-400 to-orange-500 text-xs shadow-[0_0_10px_rgba(251,191,36,0.7),0_2px_4px_rgba(0,0,0,0.15)] ${UI_TEXT_STYLE}`}
      >
        {level}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`shrink-0 pr-1 text-[10px] ${UI_TEXT_STYLE}`}>
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
