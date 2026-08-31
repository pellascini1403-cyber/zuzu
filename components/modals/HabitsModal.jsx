import Modal from "./Modal";

export default function HabitsModal({ onClose }) {
  return (
    <Modal title="Centro de Hábitos" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí verás tu lista de micro-hábitos diarios y ganarás recompensas al
        completarlos. Este historial es privado, solo tuyo. Próximamente.
      </p>
    </Modal>
  );
}
