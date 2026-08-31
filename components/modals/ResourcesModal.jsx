import Modal from "./Modal";

export default function ResourcesModal({ onClose }) {
  return (
    <Modal title="Recursos" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí verás el detalle de tus monedas y gemas. Próximamente.
      </p>
    </Modal>
  );
}
