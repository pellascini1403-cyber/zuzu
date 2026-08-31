export default function FoodPlate({ hunger = 0, onFeed }) {
  return (
    <button
      type="button"
      onClick={onFeed}
      aria-label="Alimentar a Zuzu"
      className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur transition-transform active:scale-95"
    >
      <span className="text-3xl">🍖</span>
      <span className="text-[10px] font-semibold text-amber-700">{hunger}%</span>
    </button>
  );
}
