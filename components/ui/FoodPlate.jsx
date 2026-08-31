import { softGlass } from "./glassStyle";

export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Alimentar a Zuzu (hambre ${hunger}%)`}
      className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full ${softGlass()}`}
    >
      <span className="text-xl">🍽️</span>
    </button>
  );
}
