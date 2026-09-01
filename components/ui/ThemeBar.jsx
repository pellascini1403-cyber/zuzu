// Mismo acabado "vidrio real" que los botones de arriba: borde blanco
// definido, relleno translúcido con blur, brillo superior y sombra cálida
// inferior para el volumen 3D.
export default function ThemeBar({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-auto flex w-[90%] items-center justify-center gap-1 rounded-full border-2 border-white bg-white/40 py-3 text-xs font-medium text-zinc-600 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-6px_10px_rgba(180,120,70,0.25)] transition-colors hover:bg-white/60"
    >
      <span aria-hidden="true">⌃</span>
      Personalizar escenario
    </button>
  );
}
