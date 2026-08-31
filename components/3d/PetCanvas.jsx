// Placeholder de la escena 3D. Se reemplaza por el Canvas real de
// @react-three/fiber en el módulo "Componente Canvas 3D".
export default function PetCanvas() {
  return (
    <div className="absolute inset-0 z-0 bg-gradient-to-b from-amber-100 via-orange-50 to-amber-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_10%,rgba(255,255,255,0.6),transparent)]" />
      <div className="absolute inset-0 flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3 text-orange-900/40">
          <span className="text-7xl">🐾</span>
          <p className="text-sm font-medium">El modelo 3D de Zuzu se cargará aquí</p>
        </div>
      </div>
    </div>
  );
}
