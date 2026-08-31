import Modal from "./Modal";

const FOOD_ITEMS = [
  { id: "apple", icon: "🍎", label: "Manzana", restore: 10 },
  { id: "cake", icon: "🍰", label: "Pastel", restore: 25 },
  { id: "fish", icon: "🐟", label: "Pescado", restore: 20 },
  { id: "milk", icon: "🥛", label: "Leche", restore: 15 },
];

export default function FoodDrawer({ onClose, onFeed }) {
  return (
    <Modal title="Alimentar a Zuzu" onClose={onClose}>
      <div className="grid grid-cols-4 gap-3">
        {FOOD_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFeed(item.restore)}
            className="flex flex-col items-center gap-1 rounded-2xl bg-zinc-50 p-2 text-center transition-colors hover:bg-amber-50 active:scale-95"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[11px] font-medium text-zinc-600">{item.label}</span>
            <span className="text-[10px] text-amber-500">+{item.restore}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
