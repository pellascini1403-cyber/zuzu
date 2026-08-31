import NavButton from "./NavButton";

const NAV_ITEMS = [
  { key: "characters", icon: "🐷", label: "Vestidor", tilt: "left" },
  { key: "habits", icon: "⭐", label: "Hábitos", sublabel: "⭐ 1", size: "lg" },
  { key: "shop", icon: "👜", label: "Tienda", tilt: "right" },
];

export default function BottomNav({ activeModal, onSelect }) {
  return (
    <nav className="flex items-end justify-center gap-1">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.key}
          icon={item.icon}
          label={item.label}
          sublabel={item.sublabel}
          size={item.size}
          tilt={item.tilt}
          active={activeModal === item.key}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </nav>
  );
}
