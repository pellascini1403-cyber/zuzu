export default function NavButton({ icon, label, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${
        active ? "bg-violet-100 text-violet-700" : "text-zinc-500 hover:bg-zinc-100"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
