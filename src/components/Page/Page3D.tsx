"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";

interface Page3DProps {
  dataURL: string;
  width?: number;
  height?: number;
  isFlipping: boolean;
  direction: "next" | "prev" | null;
  position?: [number, number, number];
  isLeft?: boolean;
}

const SEGMENTS = 30;

export function Page3D({
  dataURL,
  width = 3,
  height = 4,
  isFlipping,
  direction,
  position = [0, 0, 0],
  isLeft = false,
}: Page3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const foldProgressRef = useRef({ value: 0 });

  const texture = useMemo(() => {
    if (!dataURL) return null;
    const tex = new THREE.TextureLoader().load(dataURL);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [dataURL]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, SEGMENTS, SEGMENTS);
    return geo;
  }, [width, height]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.0,
    });
  }, [texture]);

  useEffect(() => {
    if (!meshRef.current) return;

    if (isFlipping) {
      const targetY = direction === "next"
        ? (isLeft ? Math.PI : -Math.PI)
        : (isLeft ? -Math.PI : Math.PI);

      gsap.to(meshRef.current.rotation, {
        y: targetY,
        duration: 0.8,
        ease: "power2.inOut",
      });

      gsap.to(foldProgressRef.current, {
        value: 1,
        duration: 0.4,
        ease: "power1.in",
        yoyo: true,
        repeat: 1,
      });
    } else {
      gsap.to(meshRef.current.rotation, {
        y: 0,
        duration: 0.3,
        ease: "power1.out",
      });
      foldProgressRef.current.value = 0;
    }
  }, [isFlipping, direction, isLeft]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;

    // Simulate page curl shadow
    const fold = foldProgressRef.current.value;
    if (fold > 0) {
      mat.roughness = 0.8 + fold * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      castShadow
      receiveShadow
    />
  );
}
