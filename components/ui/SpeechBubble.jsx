export default function SpeechBubble({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-xl bg-white/95 px-3 py-1.5 text-xs font-medium text-amber-900/80 shadow-md backdrop-blur transition-transform active:scale-95"
    >
      {text}
      <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white/95" />
    </button>
  );
}
