"use client";

import { useCallback, useSyncExternalStore } from "react";

// Misma estrategia que useLocalStorageFlag.js (useSyncExternalStore en vez
// de useEffect+setState, para no disparar "cascading renders") pero para
// un valor de tipo string sin coerción a booleano — usado para persistir
// el código de idioma elegido ("en", "es", "zh", ...).
const listenersByKey = new Map();

function getListeners(key) {
  if (!listenersByKey.has(key)) listenersByKey.set(key, new Set());
  return listenersByKey.get(key);
}

function readValue(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  return stored === null ? defaultValue : stored;
}

export default function useLocalStorageString(key, defaultValue = "") {
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
      localStorage.setItem(key, next);
      getListeners(key).forEach((listener) => listener());
    },
    [key]
  );

  return [value, setValue];
}
