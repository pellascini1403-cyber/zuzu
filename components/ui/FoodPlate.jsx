export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Alimentar a Zuzu (hambre ${hunger}%)`}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-sm backdrop-blur-md"
    >
      <span className="text-xl">🍽️</span>
    </button>
  );
}
