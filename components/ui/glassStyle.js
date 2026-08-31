// Token de diseño "Soft Glass 3D" (Neumorfismo suave) compartido por los
// botones y contenedores de la interfaz (ver referencia Neumo UI). Cada
// componente sigue eligiendo su propia forma y tamaño; esto solo centraliza
// el vidrio, el relieve de luz y la interacción para que no se desincronicen.
export function softGlass(borderOpacity = "60") {
  return `bg-white/40 backdrop-blur-xl border border-white/${borderOpacity} shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_inset_0_-2px_4px_rgba(0,0,0,0.05),_0_12px_24px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 active:scale-95 active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)]`;
}
