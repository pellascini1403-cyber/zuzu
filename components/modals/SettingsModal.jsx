import Modal from "./Modal";
import { GLASS_BG } from "@/lib/glass";
import { PRESS_FEEDBACK } from "@/lib/interaction";

// Mismo acabado "vidrio real" que los botones de la interfaz principal
// (TopBar/LevelBar/ThemeBar): fondo blanco translúcido sutil (GLASS_BG),
// borde blanco fino semi-transparente, blur de fondo y el mismo par de
// sombras inset (oscura arriba / cálida abajo) para el volumen 3D. Se
// suma una sombra exterior suave porque acá, a diferencia de la pantalla
// principal, el fondo detrás de la tarjeta es el modal blanco opaco (no
// el degradado de la app) — sin esa sombra el borde/blur casi no se
// distinguen contra blanco.
const CARD_STYLE = `flex flex-col items-center justify-center gap-2 rounded-[28px] border border-white/80 ${GLASS_BG} backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),inset_0_-6px_10px_rgba(180,120,70,0.25),0_2px_10px_rgba(0,0,0,0.08)]`;

// Placeholder de las 6 opciones de ajustes (grid 2x3). Contenido real a
// definir cuando se conecten cuenta/vinculación/preferencias; por ahora
// solo icono + etiqueta, mismo patrón que ThemeDrawer.
const SETTINGS_ITEMS = [
  { id: "profile", icon: "👤", label: "Perfil" },
  { id: "link", icon: "🔗", label: "Vincular" },
  { id: "notifications", icon: "🔔", label: "Notificaciones" },
  { id: "sound", icon: "🔊", label: "Sonido" },
  { id: "language", icon: "🌐", label: "Idioma" },
  { id: "help", icon: "❓", label: "Ayuda" },
];

export default function SettingsModal({ onClose }) {
  return (
    <Modal title="Configuración" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {SETTINGS_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`aspect-[3/4] ${PRESS_FEEDBACK} ${CARD_STYLE}`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium text-zinc-600">{item.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
