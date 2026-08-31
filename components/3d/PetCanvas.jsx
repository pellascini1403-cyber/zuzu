// Placeholder de la escena 3D. Se reemplaza por el Canvas real de
// @react-three/fiber en el módulo "Componente Canvas 3D".
export default function PetCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50">
      <div className="flex flex-col items-center gap-3 text-sky-900/50">
        <span className="text-7xl">🐾</span>
        <p className="text-sm font-medium">El modelo 3D de Zuzu se cargará aquí</p>
      </div>
    </div>
  );
}
