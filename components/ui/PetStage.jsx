import SpeechBubble from "./SpeechBubble";

// Globo de diálogo sobre la cabeza del personaje. El propio modelo 3D
// (components/3d/PetModel.jsx) recibe sus propios eventos de puntero y abre
// el mismo Chat de IA al hacer click.
export default function PetStage({ message = "想和你说说话", onOpenChat }) {
  return (
    <div className="absolute inset-x-0 top-[16%] z-10 flex justify-center px-6">
      <SpeechBubble text={message} onClick={onOpenChat} />
    </div>
  );
}
