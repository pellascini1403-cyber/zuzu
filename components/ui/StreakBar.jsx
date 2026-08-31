export default function StreakBar({ streak = 0 }) {
  return (
    <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
      <div className="flex w-full max-w-xs items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur">
        <span className="text-xl">🔥</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{ width: `${Math.min(streak * 10, 100)}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-orange-600">{streak}d</span>
      </div>
    </div>
  );
}
