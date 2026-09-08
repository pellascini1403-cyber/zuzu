"use client";

import { useCallback, useSyncExternalStore } from "react";

// Habit Tracker — persistido en localStorage (no hay backend todavía,
// mismo criterio que useStreak/useTokens). Filosofía "Zero Guilt"
// explícita en el modelo de datos: no existe ningún campo de "racha
// perdida" ni penalización por hábito — cada día es independiente,
// `completedDates` solo ACUMULA marcas, nunca resetea nada a la fuerza.
//
// Forma de un hábito:
//   {
//     id, emoji, title, coinReward,
//     microTitle: string | null,       // versión "modo emergencia" (opcional)
//     schedule: { type: "days", days: number[] }       // 0=domingo … 6=sábado
//              | { type: "weekly", timesPerWeek: number }
//              | { type: "noPressure" },                // sin días fijos
//     completedDates: { "YYYY-MM-DD": "main" | "micro" },
//   }
const STORAGE_KEY = "zuzu-habits";
const listeners = new Set();

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// Semilla de ejemplo — 3 hábitos que muestran las 3 formas de
// scheduling y el modo "Read 20 mins" vs "Read 1 page" pedido
// explícito como ejemplo de micro-hábito.
function seedHabits() {
  return [
    {
      id: "habit-read",
      emoji: "📖",
      title: "Read 20 mins",
      coinReward: 10,
      microTitle: "Read 1 page",
      schedule: { type: "noPressure" },
      completedDates: {},
    },
    {
      id: "habit-water",
      emoji: "💧",
      title: "Drink water",
      coinReward: 5,
      microTitle: null,
      schedule: { type: "days", days: [0, 1, 2, 3, 4, 5, 6] },
      completedDates: {},
    },
    {
      id: "habit-meditate",
      emoji: "🧘",
      title: "Meditate",
      coinReward: 15,
      microTitle: "Take 3 deep breaths",
      schedule: { type: "weekly", timesPerWeek: 3 },
      completedDates: {},
    },
  ];
}

function readRaw() {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeRaw(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  listeners.forEach((listener) => listener());
}

// Cachea el último snapshot derivado (misma referencia mientras no
// cambien ni el JSON crudo de localStorage ni el día) — igual que
// cachedSnapshot en useStreak.js. Sin esto, cada llamada a
// getSnapshot devolvería un array/objetos NUEVOS aunque nada haya
// cambiado en los datos, y React dispara "The result of getSnapshot
// should be cached to avoid an infinite loop" (lo mismo que ya se
// evitó en getServerSnapshot más abajo, pero también aplica acá).
let cache = { rawJSON: null, today: null, result: null };

function readHabits() {
  if (typeof window === "undefined") return EMPTY_HABITS;
  const rawJSON = localStorage.getItem(STORAGE_KEY);
  const today = todayKey();
  if (cache.rawJSON === rawJSON && cache.today === today) {
    return cache.result;
  }

  let habits = readRaw();
  if (!habits) {
    habits = seedHabits();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }
  const result = habits.map((h) => ({ ...h, completedToday: h.completedDates?.[today] ?? null }));
  cache = { rawJSON: localStorage.getItem(STORAGE_KEY), today, result };
  return result;
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Debe ser la MISMA referencia entre llamadas (useSyncExternalStore
// compara por ===) — un `[]` literal nuevo en cada llamada dispara
// "The result of getServerSnapshot should be cached to avoid an
// infinite loop" (mismo tipo de bug que SERVER_SNAPSHOT ya evita en
// useStreak.js con un objeto module-level en vez de un literal inline).
const EMPTY_HABITS = [];
function getServerSnapshot() {
  return EMPTY_HABITS;
}

export default function useHabits() {
  const habits = useSyncExternalStore(subscribe, readHabits, getServerSnapshot);

  // Completa (o re-completa en modo micro) el hábito de hoy. No hace
  // nada si ya estaba marcado hoy — evita acreditar monedas dos veces
  // por el mismo día, sin mostrar ningún error/bloqueo negativo: el
  // botón simplemente ya se ve como "hecho".
  const completeHabit = useCallback((id, { micro = false } = {}) => {
    const habits = readRaw() ?? seedHabits();
    const today = todayKey();
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.completedDates?.[today]) {
      return { alreadyDone: true, coinsAwarded: 0, bonusAwarded: 0 };
    }

    const base = micro ? Math.max(1, Math.round(habit.coinReward / 2)) : habit.coinReward;
    // Recompensa variable ("Critical Hit!"): ~20% de probabilidad de un
    // bonus — variable-ratio reward, no una penalización disfrazada.
    const isCritical = Math.random() < 0.2;
    const bonus = isCritical ? Math.max(1, Math.round(base * 0.5)) : 0;

    const next = habits.map((h) =>
      h.id === id ? { ...h, completedDates: { ...h.completedDates, [today]: micro ? "micro" : "main" } } : h
    );
    writeRaw(next);

    return { alreadyDone: false, coinsAwarded: base + bonus, bonusAwarded: bonus, isCritical, habit };
  }, []);

  const addHabit = useCallback((habit) => {
    const habits = readRaw() ?? seedHabits();
    const newHabit = {
      id: `habit-${Date.now()}`,
      emoji: habit.emoji || "✅",
      title: habit.title,
      coinReward: habit.coinReward ?? 10,
      microTitle: habit.microTitle || null,
      schedule: habit.schedule || { type: "noPressure" },
      completedDates: {},
    };
    writeRaw([...habits, newHabit]);
    return newHabit;
  }, []);

  const updateHabit = useCallback((id, updates) => {
    const habits = readRaw() ?? seedHabits();
    writeRaw(habits.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback((id) => {
    const habits = readRaw() ?? seedHabits();
    writeRaw(habits.filter((h) => h.id !== id));
  }, []);

  return { habits, completeHabit, addHabit, updateHabit, deleteHabit };
}
