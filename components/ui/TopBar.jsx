// Acabado "vidrio real": gradiente de luz superior + reflejo interno +
// sombra de base, compartido con NavButton/LevelBar.
const glassStyle =
  "bg-gradient-to-b from-white/60 via-white/25 to-white/10 backdrop-blur-2xl border border-white/80 border-b-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),_inset_0_-3px_6px_rgba(0,0,0,0.06),_0_10px_20px_-4px_rgba(0,0,0,0.1)]";

// Mock: usuarios vinculados a esta mascota (1 o 2). Se reemplaza por los
// datos reales del módulo de Vinculación (QR / Código) más adelante — por
// ahora solo valida que la cápsula muestre 1 o 2 avatares dinámicamente.
const DEFAULT_USERS = [
  { id: "u1", initial: "M" },
  { id: "u2", initial: "A" },
];

export default function TopBar({
  coins = 0,
  users = DEFAULT_USERS,
  onOpenResources,
  onOpenSettings,
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 p-4">
      {users.length > 0 && (
        <div className={`flex items-center rounded-full p-1 ${glassStyle}`}>
          <div className="flex -space-x-2">
            {users.slice(0, 2).map((user) => (
              <span
                key={user.id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-b from-amber-200 to-orange-300 text-xs font-bold text-amber-900"
              >
                {user.initial}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 ${glassStyle}`}
        >
          <span>💎</span>
          <span>{coins}</span>
        </div>
        <button
          type="button"
          onClick={onOpenResources}
          aria-label="Recursos"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg text-zinc-600 ${glassStyle}`}
        >
          ⋯
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Configuración"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm text-zinc-600 ${glassStyle}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
