import { UI_TEXT_STYLE } from "@/lib/typography";

// Acabado "vidrio real": gradiente blanco translúcido sutil (mismo tono
// base que GLASS_BG en lib/glass.js, en degradado en vez de plano) +
// inset superior oscuro + sombra de base, compartido con NavButton/
// LevelBar. Suficiente tinte para que el texto blanco de estos botones
// resalte, sin quedar pesado ni volver al blanco opaco original.
const glassStyle =
  "bg-gradient-to-b from-[rgba(255,255,255,0.38)] via-[rgba(255,255,255,0.22)] to-[rgba(255,255,255,0.10)] backdrop-blur-2xl border border-white/80 border-b-white/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),_inset_0_-3px_6px_rgba(0,0,0,0.06),_0_10px_20px_-4px_rgba(0,0,0,0.1)]";

// Mock: usuarios vinculados a esta mascota (1 o 2). Se reemplaza por los
// datos reales del módulo de Vinculación (QR / Código) más adelante — por
// ahora solo valida que la cápsula muestre 1 o 2 avatares dinámicamente.
const DEFAULT_USERS = [
  { id: "u1", initial: "M" },
  { id: "u2", initial: "A" },
];

export default function TopBar({
  coins = 0,
  users = DEFAULT_USERS,
  onOpenResources,
  onOpenSettings,
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-4">
      {/* Columna izquierda: botón de recursos (ícono de engranaje) arriba,
          en posición simétrica al botón de perfil de la derecha; avatares
          debajo, alineados a la izquierda y a la misma altura que la
          píldora de tokens de la columna derecha. */}
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={onOpenResources}
          aria-label="Recursos"
          className={`flex h-10 w-10 items-center justify-center rounded-full ${glassStyle}`}
        >
          <img
            src="/nav/gear-white.png"
            alt=""
            draggable={false}
            className="pointer-events-none block h-6 w-6 select-none object-contain drop-shadow-[0px_2px_3px_rgba(0,0,0,0.35)]"
          />
        </button>
        {users.length > 0 && (
          <div className={`flex items-center rounded-full p-1 ${glassStyle}`}>
            <div className="flex -space-x-2">
              {users.slice(0, 2).map((user) => (
                <span
                  key={user.id}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-b from-amber-200 to-orange-300 text-xs ${UI_TEXT_STYLE}`}
                >
                  {user.initial}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha: botón de perfil arriba (mismo lugar/handler que
          antes tenía el botón de cerrar — abre SettingsModal, que ya es
          donde vive la cuenta/vinculación), píldora de tokens debajo, con
          el mismo borde derecho (items-end). */}
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Perfil"
          className={`flex h-10 w-10 items-center justify-center rounded-full ${glassStyle}`}
        >
          {/* La silueta de perfil tiene mucha más masa visual en los
              hombros que en la cabeza, así que su centro de masa real
              (medido por píxel) queda bien por debajo del centro de su
              propio bounding box — centrar solo la caja hacía que el
              símbolo se viera corrido hacia abajo dentro del círculo. Se
              compensa con un translate-y hacia arriba, calibrado
              midiendo el centroide real de los píxeles renderizados. */}
          <img
            src="/nav/profile-white.png"
            alt=""
            draggable={false}
            className="pointer-events-none relative block h-4 w-4 translate-x-[2.3px] -translate-y-[6px] select-none object-contain drop-shadow-[0px_2px_3px_rgba(0,0,0,0.35)]"
          />
        </button>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${UI_TEXT_STYLE} ${glassStyle}`}
        >
          <span>💎</span>
          <span>{coins}</span>
        </div>
      </div>
    </div>
  );
}
