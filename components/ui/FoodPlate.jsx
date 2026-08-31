// Mismo acabado "vidrio real" que LevelBar/NavButton/TopBar.
const glassStyle =
  "rounded-full bg-gradient-to-b from-white/60 via-white/25 to-white/10 backdrop-blur-2xl border border-white/80 border-b-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),_inset_0_-3px_6px_rgba(0,0,0,0.06),_0_10px_20px_-4px_rgba(0,0,0,0.1)]";

export default function FoodPlate({ hunger = 0, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Alimentar a Zuzu (hambre ${hunger}%)`}
      className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center ${glassStyle}`}
    >
      <span className="text-xl">🍽️</span>
    </button>
  );
}
