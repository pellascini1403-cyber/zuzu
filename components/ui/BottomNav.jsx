import NavButton from "./NavButton";

const NAV_ITEMS = [
  { key: "wardrobe", icon: "👕", label: "Vestidor" },
  { key: "habits", icon: "✅", label: "Hábitos" },
  { key: "shop", icon: "🛍️", label: "Tienda" },
];

export default function BottomNav({ activeModal, onSelect }) {
  return (
    <nav className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="flex w-full max-w-sm gap-2 rounded-3xl bg-white/95 p-2 shadow-2xl backdrop-blur">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={activeModal === item.key}
            onClick={() => onSelect(item.key)}
          />
        ))}
      </div>
    </nav>
  );
}
