export default function ThemeBar({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      className="absolute left-1/2 z-10 flex w-[90%] -translate-x-1/2 items-center justify-center gap-1 rounded-full bg-white/70 py-3 text-xs font-medium text-zinc-500 backdrop-blur transition-colors hover:bg-white/90"
    >
      <span aria-hidden="true">⌃</span>
      Personalizar escenario
    </button>
  );
}
