export default function ThemeBar({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="absolute bottom-0 left-1/2 z-10 flex w-[90%] -translate-x-1/2 items-center justify-center gap-1 rounded-t-[28px] bg-white/70 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-xs font-medium text-zinc-500 backdrop-blur transition-colors hover:bg-white/90"
    >
      <span aria-hidden="true">⌃</span>
      Personalizar escenario
    </button>
  );
}
