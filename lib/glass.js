// Tono base compartido del "vidrio esmerilado" de los botones: blanco
// translúcido muy sutil (no el gris/marrón oscuro de un ajuste anterior,
// que quedó demasiado pesado, ni el blanco opaco original) — apenas lo
// suficiente para dar un leve tinte grisáceo/cristalino de contraste al
// texto blanco de lib/typography.js sin perder la liviandad del diseño.
// El resto del efecto glass (borde blanco translúcido, backdrop-blur,
// sombras internas/externas) se define por componente ya que cada uno
// combina valores de sombra distintos en un solo shadow-[...] compuesto.
export const GLASS_BG = "bg-[rgba(255,255,255,0.25)]";
