import Modal from "./Modal";

export default function SettingsModal({ onClose }) {
  return (
    <Modal title="Configuración" onClose={onClose}>
      <p className="text-sm text-zinc-500">
        Aquí gestionarás tu cuenta y el código para vincular tu mascota con
        otro dispositivo. Próximamente.
      </p>
    </Modal>
  );
}
