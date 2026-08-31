export default function NavButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
}) {
  const isLg = size === "lg";
  const sizeClasses = isLg
    ? "-mt-6 py-4 shadow-xl bg-gradient-to-b from-amber-50 to-white"
    : "py-2.5";
  const colorClasses = active
    ? "bg-violet-100 text-violet-700"
    : isLg
      ? "text-amber-600"
      : "text-zinc-500 hover:bg-zinc-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-3xl transition-all ${sizeClasses} ${colorClasses}`}
    >
      <span className={isLg ? "text-4xl" : "text-2xl"}>{icon}</span>
      <span className={`font-medium ${isLg ? "text-sm" : "text-xs"}`}>{label}</span>
      {sublabel && (
        <span className="text-[10px] font-semibold text-amber-500">{sublabel}</span>
      )}
    </button>
  );
}
