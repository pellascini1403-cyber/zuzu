import NavButton from "./NavButton";

const NAV_ITEMS = [
  { key: "characters", icon: "🐷", label: "Vestidor" },
  { key: "habits", icon: "⭐", label: "Hábitos", sublabel: "⭐ 1", size: "lg" },
  { key: "shop", icon: "👜", label: "Tienda" },
];

export default function BottomNav({ activeModal, onSelect }) {
  return (
    <nav className="mx-auto flex w-full max-w-sm items-end justify-center gap-4">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          sublabel={item.sublabel}
          size={item.size}
          active={activeModal === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </nav>
  );
}
