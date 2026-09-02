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
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-b from-[#ffc2e8] to-[#fc99db] text-xs shadow-[inset_0_-2px_3px_rgba(190,24,93,0.25),inset_0_1px_1px_rgba(255,255,255,0.5)] ${UI_TEXT_STYLE}`}
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
          {/* Centrado puramente por flexbox: el botón ya es flex +
              items-center + justify-center, y esta imagen no lleva
              márgenes, padding, position ni translate propios — solo
              tamaño relativo (mitad del contenedor) con object-contain,
              así que flexbox la centra de forma geométrica exacta. */}
          <img
            src="/nav/profile-white.png"
            alt=""
            draggable={false}
            className="pointer-events-none block h-1/2 w-1/2 select-none object-contain drop-shadow-[0px_2px_3px_rgba(0,0,0,0.35)]"
          />
        </button>
        {/* Píldora de saldo: la moneda (85% del tamaño anterior) queda
            adentro del contenedor con un margen propio de 5px arriba/
            abajo/izquierda, sin tocar el borde blanco. Centrada
            verticalmente con el texto vía items-center (heredado del
            padre). El número crece hacia la izquierda sin mover el
            borde derecho — el contenedor padre (items-end dentro de un
            row con justify-between) ya ancla el borde derecho de esta
            columna al margen de la pantalla; esta píldora no tiene
            ancho fijo, así que solo se expande hacia la izquierda a
            medida que el texto crece. */}
        <div
          className={`flex items-center gap-1.5 rounded-full py-[5px] pr-3 pl-[5px] text-xs ${UI_TEXT_STYLE} ${glassStyle}`}
        >
          <img
            src="/nav/coin-zuzu.png"
            alt=""
            draggable={false}
            className="pointer-events-none block h-6 w-6 shrink-0 select-none object-contain drop-shadow-[0px_1px_2px_rgba(0,0,0,0.2)]"
          />
          <span>{coins}</span>
        </div>
      </div>
    </div>
  );
}
