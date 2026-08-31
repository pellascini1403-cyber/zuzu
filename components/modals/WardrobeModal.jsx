import Modal from "./Modal";

export default function WardrobeModal({ onClose }) {
  return (
    <Modal title="Vestidor" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí podrás cambiar la ropa y los accesorios de Zuzu, y elegir entre
        los personajes 3D disponibles. Próximamente.
      </p>
    </Modal>
  );
}
