import SpeechBubble from "./SpeechBubble";

// Envuelve el Canvas 3D con el globo de diálogo y la zona clicable del
// personaje. Ambos abren el Chat de IA; la zona clicable es un marcador de
// posición hasta que el modelo 3D real reciba sus propios eventos de puntero.
export default function PetStage({ message = "想和你说说话", onOpenChat }) {
  return (
    <div className="absolute inset-x-0 top-[16%] z-10 flex flex-col items-center gap-3 px-6">
      <SpeechBubble text={message} onClick={onOpenChat} />
      <button
        type="button"
        onClick={onOpenChat}
        aria-label="Hablar con Zuzu"
        className="h-56 w-56 rounded-full sm:h-64 sm:w-64"
      />
    </div>
  );
}
