"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows } from "@react-three/drei";
import PetModel from "./PetModel";

// Escena 3D real. El fondo cálido y el brillo detrás de la mascota viven en
// MainLayout; este componente solo monta el Canvas, la luz y el modelo.
// <Bounds> encuadra la cámara automáticamente según el tamaño real del
// modelo cargado, así que no depende de sus unidades/escala nativas — sirve
// igual cuando se reemplace el modelo de prueba por el definitivo de Zuzu.
export default function PetCanvas({ onOpenChat }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows camera={{ position: [2.8, 1, 0], fov: 30 }}>
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.3}>
            <PetModel onClick={onOpenChat} />
          </Bounds>
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.35}
            scale={3}
            blur={2.4}
            far={1.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
