export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Alimentar a Zuzu"
      className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur transition-transform active:scale-95"
    >
      <span className="text-2xl">🍽️</span>
      <span className="text-[10px] font-semibold text-amber-700">{hunger}%</span>
    </button>
  );
}
