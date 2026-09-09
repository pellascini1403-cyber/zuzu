"use client";

import { useSyncExternalStore } from "react";

// Detección de WebGL cacheada a nivel de módulo. Va por useSyncExternalStore
// y no por useState+useEffect porque el servidor tiene que devolver `false`
// de forma estable (si no, hidratación desalineada) y porque este proyecto
// trata el setState síncrono dentro de un efecto como error de build.
let cached = null;

function detect() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    cached = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    cached = false;
  }
  return cached;
}

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export default function useWebGLSupport() {
  return useSyncExternalStore(subscribe, detect, getServerSnapshot);
}
