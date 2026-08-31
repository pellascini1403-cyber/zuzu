// Mismo acabado de cápsula translúcida que la barra de racha y el botón de
// comida, para los elementos circulares/pill de la esquina superior.
const streakGlassStyle =
  "bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_6px_16px_rgba(215,180,140,0.2)] rounded-full";

export default function TopBar({ coins = 0, onOpenResources, onOpenSettings }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-end gap-2 p-4">
      <div
        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 ${streakGlassStyle}`}
      >
        <span>💎</span>
        <span>{coins}</span>
      </div>
      <button
        type="button"
        onClick={onOpenResources}
        aria-label="Recursos"
        className={`flex h-9 w-9 items-center justify-center text-lg text-zinc-600 ${streakGlassStyle}`}
      >
        ⋯
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Configuración"
        className={`flex h-9 w-9 items-center justify-center text-sm text-zinc-600 ${streakGlassStyle}`}
      >
        ✕
      </button>
    </div>
  );
}
