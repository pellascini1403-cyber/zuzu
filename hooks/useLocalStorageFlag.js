"use client";

import { useCallback, useSyncExternalStore } from "react";

// useLocalStorageFlag: booleano persistido en localStorage, leído con
// useSyncExternalStore en vez de useEffect+setState — ese segundo
// patrón dispara "cascading renders" (el linter de este proyecto ya
// lo marca como error) y además arriesga un mismatch de hidratación
// servidor/cliente. Mismo enfoque que useStreak.js, generalizado para
// cualquier flag simple (dark mode, pausar notificaciones, etc.) que
// no necesite lógica de fecha/racha.
const listenersByKey = new Map();

function getListeners(key) {
  if (!listenersByKey.has(key)) listenersByKey.set(key, new Set());
  return listenersByKey.get(key);
}

function readValue(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored === null ? defaultValue : stored === "true";
}

export default function useLocalStorageFlag(key, defaultValue = false) {
  const subscribe = useCallback(
    (callback) => {
      const listeners = getListeners(key);
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    [key]
  );
  const getSnapshot = useCallback(() => readValue(key, defaultValue), [key, defaultValue]);
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next) => {
      localStorage.setItem(key, String(next));
      getListeners(key).forEach((listener) => listener());
    },
    [key]
  );

  return [value, setValue];
}
