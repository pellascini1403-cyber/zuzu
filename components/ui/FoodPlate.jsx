export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Alimentar a Zuzu (hambre ${hunger}%)`}
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-gradient-to-b from-white/80 to-white/50 shadow-md backdrop-blur-md"
    >
      <span className="text-xl">🍽️</span>
    </button>
  );
}
