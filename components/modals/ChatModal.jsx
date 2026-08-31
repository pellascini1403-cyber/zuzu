import Modal from "./Modal";

export default function ChatModal({ onClose }) {
  return (
    <Modal title="Chat con Zuzu" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="self-start rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          想和你说说话 💬
        </div>
        <p className="text-sm text-zinc-500">
          Aquí podrás chatear con Zuzu a través de la IA. El historial de esta
          conversación es privado, solo tuyo. Próximamente.
        </p>
      </div>
    </Modal>
  );
}
