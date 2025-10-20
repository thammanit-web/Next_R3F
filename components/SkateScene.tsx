"use client";

import * as THREE from "three";
import { Skateboard } from "@/components/Skateboard";
import { ContactShadows, Environment, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import gsap from "gsap";
import { WavyPaths } from "./WavyPaths";


const INITIAL_CAMERA_POSITION = [2, 1.5, 1.5] as const;

type Props = {
  deckTextureURL: string;
  wheelTextureURL: string;
  truckColor: string;
  boltColor: string;
  griptapeTextureURL?: string;
};

export type SceneHandle = {
  ollie: () => void;
  kickflip: () => void;
  frontside360: () => void;
};

export function InteractiveSkateboard({
  deckTextureURL,
  wheelTextureURL,
  truckColor,
  boltColor,
  griptapeTextureURL
}: Props) {

  const sceneRef = useRef<SceneHandle>(null);

  return (

    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Canvas
          className="min-h-[60rem] justify-center w-full"
          camera={{ position: INITIAL_CAMERA_POSITION, fov: 40 }}
        >
          <OrbitControls />
          <Suspense fallback={null}>
            <Scene
              ref={sceneRef}
              griptapeTextureURL={griptapeTextureURL}
              deckTextureURL={deckTextureURL}
              wheelTextureURL={wheelTextureURL}
              truckColor={truckColor}
              boltColor={boltColor}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 transform gap-4">
        <button
          onClick={() => sceneRef.current?.frontside360()}
          className="rounded-md bg-white px-4 py-2 text-black shadow-lg border border-gray-600 transition hover:bg-gray-300 cursor-pointer"
        >
          Frontside 360
        </button>
        <button
          onClick={() => sceneRef.current?.kickflip()}
          className="rounded-md bg-white px-4 py-2 text-black shadow-lg border border-gray-600 transition hover:bg-gray-300 cursor-pointer"
        >
          Kickflip
        </button>
        <button
          onClick={() => sceneRef.current?.ollie()}
          className="rounded-md bg-white px-4 py-2 text-black shadow-lg border border-gray-600 transition hover:bg-gray-300 cursor-pointer"
        >
          Ollie
        </button>
      </div>
    </div>
  );
}

const Scene = forwardRef<SceneHandle, Props>(({
  deckTextureURL,
  wheelTextureURL,
  truckColor,
  boltColor,
  griptapeTextureURL
}, ref) => {
  const containerRef = useRef<THREE.Group>(null);
  const originRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(new THREE.Vector3(-0.2, 0.15, 0));
    setZoom();
    window.addEventListener("resize", setZoom);

    function setZoom() {
      const scale = Math.max(Math.min(1000 / window.innerWidth, 2.2), 1);
      camera.position.x = INITIAL_CAMERA_POSITION[0] * scale;
      camera.position.y = INITIAL_CAMERA_POSITION[1] * scale;
      camera.position.z = INITIAL_CAMERA_POSITION[2] * scale;
    }

    return () => window.removeEventListener("resize", setZoom);
  }, [camera]);

  function ollie(board: THREE.Group) {
    jumpBoard(board);
    gsap
      .timeline()
      .to(board.rotation, { x: -0.6, duration: 0.26, ease: "none" })
      .to(board.rotation, { x: 0.4, duration: 0.82, ease: "power2.in" })
      .to(board.rotation, { x: 0, duration: 0.12, ease: "none" });
  }

  function kickflip(board: THREE.Group) {
    jumpBoard(board);
    gsap
      .timeline()
      .to(board.rotation, { x: -0.6, duration: 0.26, ease: "none" })
      .to(board.rotation, { x: 0.4, duration: 0.82, ease: "power2.in" })
      .to(
        board.rotation,
        { z: `+=${Math.PI * 2}`, duration: 0.78, ease: "none" },
        0.3
      )
      .to(board.rotation, { x: 0, duration: 0.12, ease: "none" });
  }

  function frontside360(board: THREE.Group, origin: THREE.Group) {
    jumpBoard(board);
    gsap
      .timeline()
      .to(board.rotation, { x: -0.6, duration: 0.26, ease: "none" })
      .to(board.rotation, { x: 0.4, duration: 0.82, ease: "power2.in" })
      .to(
        origin.rotation,
        { y: `+=${Math.PI * 2}`, duration: 0.77, ease: "none" },
        0.3
      )
      .to(board.rotation, { x: 0, duration: 0.14, ease: "none" });
  }

  function jumpBoard(board: THREE.Group) {
    setAnimating(true);
    gsap
      .timeline({ onComplete: () => setAnimating(false) })
      .to(board.position, {
        y: 0.8,
        duration: 0.51,
        ease: "power2.out",
        delay: 0.26,
      })
      .to(board.position, { y: 0, duration: 0.43, ease: "power2.in" });
  }

  // Step 2.1: ใช้ useImperativeHandle เพื่อ expose ฟังก์ชัน
  useImperativeHandle(ref, () => ({
    ollie: () => {
      const board = containerRef.current;
      if (board && !animating) {
        ollie(board);
      }
    },
    kickflip: () => {
      const board = containerRef.current;
      if (board && !animating) {
        kickflip(board);
      }
    },
    frontside360: () => {
      const board = containerRef.current;
      const origin = originRef.current;
      if (board && origin && !animating) {
        frontside360(board, origin);
      }
    },
  }));


  return (
    <group>
      <Environment files={"/hdr/warehouse-256.hdr"} />
      <group ref={originRef}>
        <group ref={containerRef} position={[0, 0, -0.635]}>
          <group position={[0, -0.086, 0.635]}>
            <Skateboard
              wheelTextureURLs={[wheelTextureURL]}
              wheelTextureURL={wheelTextureURL}
              deckTextureURLs={[deckTextureURL]}
              deckTextureURL={deckTextureURL}
              griptapeTextureURLs={griptapeTextureURL ? [griptapeTextureURL] : []}
              griptapeTextureURL={griptapeTextureURL ?? undefined}
              truckColor={truckColor}
              boltColor={boltColor}
              pose="upright"
              constantWheelSpin
            />
          </group>
        </group>
      </group>
      <ContactShadows opacity={0.6} position={[0, -0.08, 0]} />
    </group>
  );
});


Scene.displayName = 'Scene';