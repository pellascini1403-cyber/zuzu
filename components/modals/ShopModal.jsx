import Modal from "./Modal";

export default function ShopModal({ onClose }) {
  return (
    <Modal title="Tienda" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí podrás canjear monedas por comida, ropa, accesorios y skins para
        Zuzu. Próximamente.
      </p>
    </Modal>
  );
}
