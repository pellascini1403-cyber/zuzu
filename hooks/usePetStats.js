"use client";

import { useState } from "react";
import useStreak from "./useStreak";

// Datos de ejemplo en cliente. El nivel, la ropa, el hambre y las monedas
// de la mascota son datos compartidos que se sincronizarán en tiempo real
// entre usuarios vinculados (ver Sistema de Vinculación). Los hábitos y el
// chat con la IA, en cambio, viven en hooks separados y son privados por
// usuario. `xp` ahora viene de useStreak (racha diaria real persistida en
// localStorage) en vez de un valor fijo de ejemplo.
export default function usePetStats() {
  const [stats, setStats] = useState({
    level: 2,
    xpToNext: 50,
    hunger: 72,
    coins: 120,
  });
  const { streak, justIncreased } = useStreak();

  function feed(restore = 15) {
    setStats((prev) => ({
      ...prev,
      hunger: Math.min(prev.hunger + restore, 100),
    }));
  }

  return { ...stats, xp: streak, streakJustIncreased: justIncreased, feed };
}
