export default function TopBar({ coins = 0, onOpenResources, onOpenSettings }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-end gap-2 p-4">
      <div className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow backdrop-blur">
        <span>💎</span>
        <span>{coins}</span>
      </div>
      <button
        type="button"
        onClick={onOpenResources}
        aria-label="Recursos"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-lg text-zinc-600 shadow backdrop-blur transition-colors hover:bg-white"
      >
        ⋯
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Configuración"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-sm text-zinc-600 shadow backdrop-blur transition-colors hover:bg-white"
      >
        ✕
      </button>
    </div>
  );
}
