// Overlay transparente puro: no dibuja ninguna forma propia (nada de
// border, outline, box-shadow ni border-radius). Solo posiciona el
// ícono y el texto, en las coordenadas top/left medidas sobre el marco
// correspondiente dentro de la imagen única de BottomNav.jsx.
export default function NavButton({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  size = "md",
  top,
  left,
  width,
}) {
  const isLg = size === "lg";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ top, left, width }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 bg-transparent transition-transform active:scale-95 ${active ? "scale-110" : ""}`}
    >
      {isLg ? (
        <span className="flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-2 text-3xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.4)]">
          {icon}
        </span>
      ) : (
        <span className="text-2xl">{icon}</span>
      )}
      <span className="text-xs font-medium text-amber-950/80 [text-shadow:0_1px_2px_rgba(120,53,15,0.25)]">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] font-semibold text-amber-600">{sublabel}</span>
      )}
    </button>
  );
}
