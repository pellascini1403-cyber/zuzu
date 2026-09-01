"use client";

import { useState } from "react";
import { DEFAULT_BACKGROUND_ID } from "@/lib/backgrounds";

// Estado del fondo de escenario activo (un id de lib/backgrounds.js).
// Preparado para que "Personalizar escenario" y la Tienda llamen a
// setBackground(id) más adelante para intercambiar el fondo dinámicamente;
// todavía no hay lógica de selección conectada a ningún botón.
export default function useBackground(initialId = DEFAULT_BACKGROUND_ID) {
  const [currentBackground, setBackground] = useState(initialId);
  return { currentBackground, setBackground };
}
