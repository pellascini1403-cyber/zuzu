import { UI_TEXT_STYLE } from "@/lib/typography";
import { GLASS_BG } from "@/lib/glass";

// Cápsula de vidrio translúcida, mismo lenguaje visual que NavButton/
// TopBar (borde blanco visible + brillo). Fondo blanco translúcido sutil
// (GLASS_BG) con el inset superior oscuro, para que el texto blanco
// resalte sin quedar pesado.
const trackStyle = `relative rounded-full ${GLASS_BG} backdrop-blur-md border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25)]`;

export default function LevelBar({ level = 1, xp = 0, xpToNext = 100 }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div
      className={`flex h-8 w-[65%] max-w-[280px] flex-none items-center pl-1.5 pr-1.5 ${trackStyle}`}
    >
      {/* Llama 3D: reemplaza la insignia naranja, pero contenida por
          completo dentro de la cápsula (mismo tamaño/lugar que ocupaba el
          círculo original) — sin desbordar ni flotar por fuera. */}
      <img
        src="/nav/flame-pink.png"
        alt=""
        draggable={false}
        style={{ height: "22px", width: "17px" }}
        className="pointer-events-none block shrink-0 select-none object-contain drop-shadow-[0_2px_4px_rgba(219,39,119,0.35)]"
      />
      {/* La barra arranca pegada a la llama (sin gap acá); el gap sólo
          está entre la barra y el contador de la derecha. */}
      <div className="relative ml-1.5 h-5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-300 via-fuchsia-400 to-pink-500 shadow-[0_0_8px_rgba(255,105,180,0.6),inset_0_1px_2px_rgba(255,255,255,0.7)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`ml-2 shrink-0 text-[10px] ${UI_TEXT_STYLE}`}>
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
