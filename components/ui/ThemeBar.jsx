export default function ThemeBar({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-center gap-1 bg-white/70 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 text-xs font-medium text-zinc-500 backdrop-blur transition-colors hover:bg-white/90"
    >
      <span aria-hidden="true">⌃</span>
      Personalizar escenario
    </button>
  );
}
