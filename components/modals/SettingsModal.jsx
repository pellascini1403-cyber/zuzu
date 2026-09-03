import Modal from "./Modal";
import { PRESS_FEEDBACK } from "@/lib/interaction";

// Vidrio propio de estas tarjetas (no el GLASS_BG compartido — ese está
// afinado para ir sobre el degradado colorido de la pantalla principal,
// donde 0.25 de opacidad ya se distingue bien; acá, sobre el fondo
// blanco opaco del modal, con esa opacidad la tarjeta no se despega del
// fondo). Fondo blanco casi sólido + blur, borde de 1px idéntico en los
// 4 lados y una sombra exterior difusa con tinte rosa ultra suave (sin
// inset shadows): la sombra cálida rgba(180,120,70,...) que usábamos
// antes (copiada del mismo tratamiento que los botones de la pantalla
// principal) se veía marrón/sucia contra el blanco del modal.
const CARD_BG = "bg-[rgba(255,255,255,0.85)]";
const CARD_SHADOW = "shadow-[0_10px_20px_rgba(230,150,180,0.15)]";
const CARD_STYLE = `flex min-h-[152px] flex-col items-start gap-3 rounded-[28px] border border-white/80 p-4 text-left ${CARD_BG} backdrop-blur-md ${CARD_SHADOW}`;

// Placeholder de las 6 opciones de ajustes (grid 2x3). Contenido real a
// definir cuando se conecten cuenta/vinculación/preferencias; por ahora
// icono degradado + título + mini descripción, mismo patrón para todas.
const SETTINGS_ITEMS = [
  { id: "profile", title: "Perfil", description: "Tu cuenta y datos personales" },
  { id: "link", title: "Vincular", description: "Conecta otro dispositivo con QR o código" },
  { id: "notifications", title: "Notificaciones", description: "Alertas y recordatorios" },
  { id: "sound", title: "Sonido", description: "Efectos y música de la app" },
  { id: "language", title: "Idioma", description: "Cambia el idioma de la interfaz" },
  { id: "help", title: "Ayuda", description: "Preguntas frecuentes y soporte" },
];

// Degradado e iluminado compartidos por todos los íconos: mismo par de
// tonos rosa "chicle" que ya usa la app (flama/barra de nivel, avatares
// del TopBar — #fd88bf / #ffe6f2), en vez de la paleta violeta de la
// imagen de referencia, para que el acento cromático quede coherente con
// el resto de la interfaz. drop-shadow rosado da el volumen 3D suave.
function IconGradientDefs({ gradientId }) {
  return (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffe6f2" />
        <stop offset="1" stopColor="#fd88bf" />
      </linearGradient>
    </defs>
  );
}

const ICON_DROP_SHADOW = { filter: "drop-shadow(0 4px 6px rgba(219,39,119,0.35))" };

function SettingsIcon({ id }) {
  const gradientId = `settings-icon-grad-${id}`;
  const fill = `url(#${gradientId})`;

  switch (id) {
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <circle cx="12" cy="8" r="4" fill={fill} />
          <path d="M4 20a8 8 0 0 1 16 0z" fill={fill} />
        </svg>
      );
    case "link":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <path
            d="M19.9 4.1a3.75 3.75 0 0 0-5.3 0l-4.5 4.5a3.75 3.75 0 0 0 1.03 6.04.75.75 0 0 1-.64 1.35 5.25 5.25 0 0 1-1.45-8.45l4.5-4.5a5.25 5.25 0 1 1 7.42 7.42l-1.75 1.76a.75.75 0 1 1-1.07-1.06l1.76-1.76a3.75 3.75 0 0 0 0-5.3Zm-7.39 4.27a.75.75 0 0 1 1-.35 5.25 5.25 0 0 1 1.45 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.42-7.42l1.75-1.76a.75.75 0 1 1 1.07 1.06l-1.76 1.76a3.75 3.75 0 1 0 5.3 5.3l4.5-4.5a3.75 3.75 0 0 0-1.03-6.04.75.75 0 0 1-.36-1Z"
            fill={fill}
          />
        </svg>
      );
    case "notifications":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <path
            d="M12 2.25c-4.28 0-7.5 3.7-7.5 7.94v2.632c0 .544-.163 1.076-.469 1.527l-1.005 1.475c-.868 1.274.014 3.043 1.542 3.043h15.864c1.528 0 2.41-1.769 1.542-3.043l-1.005-1.475a2.75 2.75 0 0 1-.469-1.527V10.19c0-4.24-3.22-7.94-7.5-7.94Z"
            fill={fill}
          />
          <path d="M8.25 18.75a3.75 3.75 0 0 0 7.5 0h-7.5Z" fill={fill} />
        </svg>
      );
    case "sound":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <path
            d="M11.55 3.06a.75.75 0 0 1 .45.69v16.5a.75.75 0 0 1-1.255.555L5.46 16.5H2.75A1.75 1.75 0 0 1 1 14.75v-5.5C1 8.28 1.78 7.5 2.75 7.5h2.71l5.285-4.805a.75.75 0 0 1 .805-.135Z"
            fill={fill}
          />
          <path
            d="M15.8 8.3a5 5 0 0 1 0 7.4M18.4 6a8.5 8.5 0 0 1 0 12"
            fill="none"
            stroke={fill}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "language":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <circle cx="12" cy="12" r="9" fill={fill} />
          <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d="M3 12h18M4.6 7.5h14.8M4.6 16.5h14.8" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />
        </svg>
      );
    case "help":
      return (
        <svg viewBox="0 0 24 24" className="h-10 w-10" style={ICON_DROP_SHADOW}>
          <IconGradientDefs gradientId={gradientId} />
          <circle cx="12" cy="12" r="9" fill={fill} />
          <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
            ?
          </text>
        </svg>
      );
    default:
      return null;
  }
}

export default function SettingsModal({ onClose }) {
  return (
    <Modal title="Configuración" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {SETTINGS_ITEMS.map((item) => (
          <button key={item.id} type="button" className={`${PRESS_FEEDBACK} ${CARD_STYLE}`}>
            <SettingsIcon id={item.id} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-zinc-800">{item.title}</span>
              <span className="text-xs leading-snug text-zinc-400">{item.description}</span>
            </div>
            <span className="mt-auto text-base font-semibold text-zinc-300">→</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
