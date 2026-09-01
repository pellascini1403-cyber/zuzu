// Tono base compartido del "vidrio esmerilado" de los botones: un gris/
// beige oscuro translúcido (en vez del blanco brillante anterior), para
// que el texto blanco de lib/typography.js resalte con buen contraste.
// El resto del efecto glass (borde blanco translúcido, backdrop-blur,
// sombras internas/externas) se define por componente ya que cada uno
// combina valores de sombra distintos en un solo shadow-[...] compuesto.
export const GLASS_BG = "bg-[rgba(40,30,20,0.15)]";
