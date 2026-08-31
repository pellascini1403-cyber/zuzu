import Modal from "./Modal";

const THEMES = [
  { id: "cozy", icon: "🏠", label: "Acogedor" },
  { id: "beach", icon: "🏖️", label: "Playa" },
  { id: "forest", icon: "🌲", label: "Bosque" },
  { id: "space", icon: "🌌", label: "Espacio" },
];

export default function ThemeDrawer({ onClose }) {
  return (
    <Modal title="Personalizar escenario" onClose={onClose}>
      <div className="grid grid-cols-4 gap-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-2 text-center transition-colors hover:bg-amber-50 active:scale-95"
          >
            <span className="text-2xl">{theme.icon}</span>
            <span className="text-[11px] font-medium text-zinc-600">{theme.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
