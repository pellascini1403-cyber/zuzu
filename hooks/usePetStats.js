"use client";

import { useState } from "react";

// Datos de ejemplo en cliente. El nivel, la ropa, el hambre y las monedas
// de la mascota son datos compartidos que se sincronizarán en tiempo real
// entre usuarios vinculados (ver Sistema de Vinculación). Los hábitos y el
// chat con la IA, en cambio, viven en hooks separados y son privados por
// usuario.
export default function usePetStats() {
  const [stats, setStats] = useState({
    streak: 5,
    hunger: 72,
    coins: 120,
  });

  function feed() {
    setStats((prev) => ({ ...prev, hunger: Math.min(prev.hunger + 15, 100) }));
  }

  return { ...stats, feed };
}
