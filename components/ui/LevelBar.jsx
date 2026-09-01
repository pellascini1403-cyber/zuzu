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
      className={`flex h-8 w-[65%] max-w-[280px] flex-none items-center gap-2 px-1.5 ${trackStyle}`}
    >
      {/* Reserva el mismo espacio que ocupaba la insignia redonda anterior,
          para que la barra de progreso no se mueva. */}
      <span aria-hidden="true" className="block h-6 w-6 shrink-0" />
      {/* Llama 3D: reemplaza la insignia naranja. Escalada más grande que
          su antigua caja y desplazada con translate para que sobresalga
          ligeramente por encima y por fuera del borde izquierdo de la
          cápsula de cristal. Sin overflow-hidden en este contenedor ni en
          el padre (MainLayout), así que no se recorta. */}
      <img
        src="/nav/flame-pink.png"
        alt=""
        draggable={false}
        style={{ height: "46px", width: "36px" }}
        className="pointer-events-none absolute left-0 top-1/2 -translate-x-[38%] -translate-y-1/2 select-none object-contain drop-shadow-[0_4px_8px_rgba(219,39,119,0.35)]"
      />
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] backdrop-blur-sm transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={`shrink-0 pr-1 text-[10px] ${UI_TEXT_STYLE}`}>
        {xp}/{xpToNext}
      </span>
    </div>
  );
}
