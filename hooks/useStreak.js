"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zuzu-streak";

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// Diferencia en días de calendario completos entre dos claves "YYYY-MM-DD".
function daysBetween(a, b) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const diffMs = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(diffMs / 86400000);
}

// Racha diaria persistida en localStorage (no hay backend todavía; esto
// queda listo para reemplazarse por el valor sincronizado real del
// Sistema de Vinculación más adelante). Reglas:
// - Primera vez que se abre la app: racha en 0 (barra vacía).
// - Volver a abrir la app el MISMO día calendario: no cambia la racha.
// - Volver a abrir al día calendario siguiente (consecutivo): +1, y se
//   marca `justIncreased` para que LevelBar anime el relleno.
// - Volver a abrir después de saltarse uno o más días: la racha se
//   reinicia a 0 (se cortó la consecutividad).
// `bestStreak` es el récord histórico (el `count` más alto alcanzado
// alguna vez), independiente de que la racha actual se haya cortado —
// se guarda aparte como `best` en el mismo objeto de localStorage y
// nunca baja, solo sube cuando `count` lo supera.
// `justReset` (filosofía "Zero Guilt" del Habit Tracker): true SOLO el
// primer render después de perder una racha que ya tenía días
// acumulados (count previo > 0 y se saltó uno o más días) — NUNCA en la
// primera visita (streak siempre en 0, nada que "perder" todavía). Sirve
// para mostrar un mensaje compasivo una única vez ("ZUZU rested
// yesterday!") en vez de arrancar en 0 en silencio como si fuera
// software, sin culpar al usuario.
//
// Se implementa con useSyncExternalStore (en vez de leer localStorage en
// un useEffect + setState) para no depender de window durante el render
// del servidor sin arriesgar un mismatch de hidratación: getServerSnapshot
// fija el valor inicial en 0/sin animar, y getSnapshot recién lee/actualiza
// localStorage del lado del cliente, una sola vez por sesión (cacheado a
// nivel de módulo).
let cachedSnapshot = null;

function computeSnapshot() {
  if (typeof window === "undefined") {
    return { streak: 0, bestStreak: 0, justIncreased: false, justReset: false };
  }

  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    stored = null;
  }

  const today = todayKey();

  if (!stored || typeof stored.count !== "number" || !stored.lastVisitDate) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, best: 0, lastVisitDate: today }));
    return { streak: 0, bestStreak: 0, justIncreased: false, justReset: false };
  }

  const best = typeof stored.best === "number" ? stored.best : stored.count;
  const diff = daysBetween(stored.lastVisitDate, today);

  if (diff === 0) {
    return { streak: stored.count, bestStreak: Math.max(best, stored.count), justIncreased: false, justReset: false };
  }
  if (diff === 1) {
    const next = stored.count + 1;
    const nextBest = Math.max(best, next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: next, best: nextBest, lastVisitDate: today }));
    return { streak: next, bestStreak: nextBest, justIncreased: true, justReset: false };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, best, lastVisitDate: today }));
  return { streak: 0, bestStreak: best, justIncreased: false, justReset: stored.count > 0 };
}

function getSnapshot() {
  if (cachedSnapshot === null) {
    cachedSnapshot = computeSnapshot();
  }
  return cachedSnapshot;
}

// Debe ser un objeto estable (misma referencia) entre llamadas — si no,
// React entra en un loop de re-render durante la hidratación.
const SERVER_SNAPSHOT = { streak: 0, bestStreak: 0, justIncreased: false, justReset: false };
function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

// El valor no cambia después del cálculo inicial dentro de una misma
// sesión, así que no hay nada externo a lo que suscribirse.
function subscribe() {
  return () => {};
}

export default function useStreak() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
