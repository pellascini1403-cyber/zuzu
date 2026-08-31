"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF, useAnimations } from "@react-three/drei";

const MODEL_URL = "/models/fox.glb";
const IDLE_CLIP = "Survey";
// Altura objetivo en unidades de escena. Cada modelo .glb trae sus propias
// unidades nativas (este de prueba mide ~79 de alto); normalizar aquí evita
// tener que recalibrar cámara, luces y sombra cada vez que se cambie de
// modelo — incluido el definitivo de Zuzu más adelante.
const TARGET_HEIGHT = 1.6;

// Modelo de prueba (glTF Fox, CC-BY 4.0 — PixelMannen / @tomkranis / Sketchfab,
// vía Khronos glTF-Sample-Models) para validar el pipeline de carga + animación
// con @react-three/drei antes de integrar el modelo definitivo de Zuzu, que
// usará la misma API (useGLTF + useAnimations).
export default function PetModel({ onClick }) {
  const group = useRef(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const height = box.max.y - box.min.y || 1;
    return TARGET_HEIGHT / height;
  }, [scene]);

  useEffect(() => {
    const idle = actions[IDLE_CLIP];
    idle?.reset().fadeIn(0.4).play();
    return () => idle?.fadeOut(0.4);
  }, [actions]);

  return (
    <group
      ref={group}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
