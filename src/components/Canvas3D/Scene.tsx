"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import { Page3D } from "@/components/Page/Page3D";

interface SceneProps {
  leftPageURL: string;
  rightPageURL: string;
  isFlipping: boolean;
  direction: "next" | "prev" | null;
}

function BookSpread({ leftPageURL, rightPageURL, isFlipping, direction }: SceneProps) {
  const PAGE_W = 3;
  const PAGE_H = 4;
  const GAP = 0.05;

  return (
    <>
      {/* Left page */}
      {leftPageURL && (
        <Page3D
          dataURL={leftPageURL}
          width={PAGE_W}
          height={PAGE_H}
          isFlipping={isFlipping && direction === "prev"}
          direction={direction}
          position={[-(PAGE_W / 2 + GAP), 0, 0]}
          isLeft={true}
        />
      )}

      {/* Right page */}
      {rightPageURL && (
        <Page3D
          dataURL={rightPageURL}
          width={PAGE_W}
          height={PAGE_H}
          isFlipping={isFlipping && direction === "next"}
          direction={direction}
          position={[PAGE_W / 2 + GAP, 0, 0]}
          isLeft={false}
        />
      )}

      {/* Book spine */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[0.12, PAGE_H, 0.02]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
    </>
  );
}

export function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-5, 3, 2]} intensity={0.3} />

        <BookSpread {...props} />

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.4}
          scale={12}
          blur={2}
          far={4}
        />

        <Environment preset="studio" />

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minDistance={4}
          maxDistance={14}
        />
      </Suspense>
    </Canvas>
  );
}
