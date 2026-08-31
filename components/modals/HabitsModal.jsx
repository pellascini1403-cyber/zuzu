import Modal from "./Modal";

export default function HabitsModal({ onClose }) {
  return (
    <Modal title="Hábitos" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí verás tu lista de micro-hábitos diarios. Próximamente.
      </p>
    </Modal>
  );
}
