// Estilo para la barra de racha y botón de comida
const streakGlassStyle =
  "bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_6px_16px_rgba(215,180,140,0.2)] rounded-full";

export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Alimentar a Zuzu (hambre ${hunger}%)`}
      className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center ${streakGlassStyle}`}
    >
      <span className="text-xl">🍽️</span>
    </button>
  );
}
