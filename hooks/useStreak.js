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
    return { streak: 0, justIncreased: false };
  }

  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    stored = null;
  }

  const today = todayKey();

  if (!stored || typeof stored.count !== "number" || !stored.lastVisitDate) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, lastVisitDate: today }));
    return { streak: 0, justIncreased: false };
  }

  const diff = daysBetween(stored.lastVisitDate, today);

  if (diff === 0) {
    return { streak: stored.count, justIncreased: false };
  }
  if (diff === 1) {
    const next = stored.count + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: next, lastVisitDate: today }));
    return { streak: next, justIncreased: true };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 0, lastVisitDate: today }));
  return { streak: 0, justIncreased: false };
}

function getSnapshot() {
  if (cachedSnapshot === null) {
    cachedSnapshot = computeSnapshot();
  }
  return cachedSnapshot;
}

// Debe ser un objeto estable (misma referencia) entre llamadas — si no,
// React entra en un loop de re-render durante la hidratación.
const SERVER_SNAPSHOT = { streak: 0, justIncreased: false };
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
