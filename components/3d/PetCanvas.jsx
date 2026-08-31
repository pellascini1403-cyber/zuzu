// Placeholder de la escena 3D. Se reemplaza por el Canvas real de
// @react-three/fiber en el módulo "Componente Canvas 3D". El fondo cálido y
// el brillo detrás de la mascota viven en MainLayout, que es quien compone
// el escenario completo.
export default function PetCanvas() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center pt-16">
      <div className="flex flex-col items-center gap-3 text-orange-900/40">
        <span className="text-7xl">🐾</span>
        <p className="text-sm font-medium">El modelo 3D de Zuzu se cargará aquí</p>
      </div>
    </div>
  );
}
