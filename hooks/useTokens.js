"use client";

import { useCallback, useSyncExternalStore } from "react";

// Saldo de Susu Coins persistido en localStorage — antes era un
// TOKEN_COUNT fijo en MainLayout.jsx (no había forma de acreditar
// nada). El Habit Tracker necesita sumarle monedas de verdad al
// completar un hábito, así que pasa a ser estado real con el mismo
// patrón useSyncExternalStore que useStreak/useLocalStorageFlag (evita
// useEffect+setState y el mismatch de hidratación que eso arriesga).
const STORAGE_KEY = "zuzu-tokens";
const DEFAULT_TOKENS = 1000000;
const listeners = new Set();

function readValue() {
  if (typeof window === "undefined") return DEFAULT_TOKENS;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && localStorage.getItem(STORAGE_KEY) !== null ? stored : DEFAULT_TOKENS;
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getServerSnapshot() {
  return DEFAULT_TOKENS;
}

export default function useTokens() {
  const tokens = useSyncExternalStore(subscribe, readValue, getServerSnapshot);

  const addTokens = useCallback((amount) => {
    const next = Math.max(0, readValue() + amount);
    localStorage.setItem(STORAGE_KEY, String(next));
    listeners.forEach((listener) => listener());
    return next;
  }, []);

  return { tokens, addTokens };
}
