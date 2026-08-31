export default function SpeechBubble({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-2xl bg-white/95 px-4 py-2 text-sm font-medium text-zinc-700 shadow-lg backdrop-blur transition-transform active:scale-95"
    >
      {text}
      <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white/95" />
    </button>
  );
}
