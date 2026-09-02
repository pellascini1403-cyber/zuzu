import { UI_TEXT_STYLE } from "@/lib/typography";
import { GLASS_BG } from "@/lib/glass";

// Cápsula de vidrio translúcida, mismo lenguaje visual que NavButton/
// TopBar (borde blanco visible + brillo). Fondo blanco translúcido sutil
// (GLASS_BG) con el inset superior oscuro, para que el texto blanco
// resalte sin quedar pesado.
const trackStyle = `relative rounded-full ${GLASS_BG} backdrop-blur-md border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25)]`;

export default function LevelBar({ xp = 0, xpToNext = 100, animateFill = false }) {
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
          está entre la barra y el contador de la derecha. Degradado
          monocromático en rosa: el extremo izquierdo usa el mismo tono
          "chicle" del asset de la llama/estrella (muestreado del propio
          PNG: rgb(253,136,191) ≈ #fd88bf), sin rojo/coral/naranja, hacia
          un rosa casi blanco a la derecha. El ancho refleja xp/xpToNext
          (la racha real de hooks/useStreak.js). La transición (animación
          del relleno) solo se activa cuando `animateFill` es true — es
          decir, cuando el usuario entra en un día nuevo y la racha subió;
          en una recarga del mismo día el relleno aparece directo, sin
          animar de 0 hacia el valor real. */}
      <div className="relative ml-1.5 h-5 flex-1 overflow-hidden rounded-full">
        <div
          className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#fd88bf] to-[#ffe6f2] shadow-[0_0_8px_rgba(253,136,191,0.6),inset_0_1px_2px_rgba(255,255,255,0.7)] ${
            animateFill ? "transition-all duration-700 ease-out" : ""
          }`}
          style={{ width: `${progress}%` }}
        >
          {/* Brillo diagonal estilo cristal, concentrado sobre el borde de
              avance del relleno. */}
          <div className="absolute inset-y-0 right-0 w-2/5 rounded-r-full bg-gradient-to-r from-transparent to-white/60" />
        </div>
      </div>
      <span className={`ml-2 shrink-0 text-[10px] ${UI_TEXT_STYLE}`}>
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
