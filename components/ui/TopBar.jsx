import { softGlass } from "./glassStyle";

export default function TopBar({ coins = 0, onOpenResources, onOpenSettings }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-end gap-2 p-4">
      <div
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 ${softGlass()}`}
      >
        <span>💎</span>
        <span>{coins}</span>
      </div>
      <button
        type="button"
        onClick={onOpenResources}
        aria-label="Recursos"
        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-600 ${softGlass()}`}
      >
        ⋯
      </button>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Configuración"
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm text-zinc-600 ${softGlass()}`}
      >
        ✕
      </button>
    </div>
  );
}
