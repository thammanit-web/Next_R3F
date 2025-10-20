'use client'

import React, { Suspense, useCallback, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Html, CameraControls, } from '@react-three/drei'
import * as THREE from 'three'
import { Skateboard } from '@/components/Skateboard'
import { useCustomizerControls } from "../skateboardbuild/context";

type Props = {
  wheelTextureURLs: string[]
  wheelTextureURL: string
  deckTextureURLs: string[]
  deckTextureURL: string
  griptapeTextureURLs?: string[]
  griptapeTextureURL?: string
  truckColor: string
  boltColor: string
  constantWheelSpin?: boolean
  pose?: 'upright' | 'side' | 'vertical'
  onCapture?: (dataUrl: string) => void
}

export default function Preview({
  wheelTextureURLs,
  wheelTextureURL,
  deckTextureURLs,
  deckTextureURL,
  griptapeTextureURLs,
  griptapeTextureURL,
  truckColor,
  boltColor,
  constantWheelSpin = false,
  pose = 'upright',
  onCapture,
}: Props) {

  const captureRef = useRef<null | (() => void)>(null)
  const cameraControls = useRef<CameraControls>(null);
  const floorRef = useRef<THREE.Mesh>(null);

  const { selectedWheel, selectedBolt, selectedDeck, selectedTruck,selectedGriptape } =
    useCustomizerControls();


  useEffect(() => {
    setCameraControls(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(5, 1, 1)
    );
  }, [selectedDeck]);

  useEffect(() => {
    setCameraControls(
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(1.5, 0.5, -0.5)
    );
  }, [selectedTruck]);

  useEffect(() => {
    setCameraControls(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(1, 0.5, 2)
    );
  }, [selectedWheel]);

  useEffect(() => {
    setCameraControls(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 1, 1)
    );
  }, [selectedBolt]);

    useEffect(() => {
    setCameraControls(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-5, 1, 1)
    );
  }, [selectedGriptape]);

  function setCameraControls(target: THREE.Vector3, pos: THREE.Vector3) {
    if (!cameraControls.current) return;

    cameraControls.current.setTarget(target.x, target.y, target.z, true);
    cameraControls.current.setPosition(pos.x, pos.y, pos.z, true);
  }

  function onCameraControlStart() {
    if (
      !cameraControls.current ||
      !floorRef.current ||
      cameraControls.current.colliderMeshes.length > 0
    )
      return;

    cameraControls.current.colliderMeshes = [floorRef.current];
  }

  const handleCaptureClick = () => {
    captureRef.current?.()
  }

  return (
    <Canvas camera={{ position: [5, 1, 1], fov: 30 }} shadows>
      <color attach="background" args={['#f8fafc']} />
      <hemisphereLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[3, 4, 5]}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Suspense fallback={<Html center>Loadin g preview…</Html>}>
        <SceneContent
          wheelTextureURLs={wheelTextureURLs}
          wheelTextureURL={wheelTextureURL}
          deckTextureURLs={deckTextureURLs}
          deckTextureURL={deckTextureURL}
          griptapeTextureURLs={griptapeTextureURLs}  
          griptapeTextureURL={griptapeTextureURL}
          truckColor={truckColor}
          boltColor={boltColor}
          constantWheelSpin={constantWheelSpin}
          pose={pose}
          onCapture={onCapture}
          setCaptureImpl={(fn) => (captureRef.current = fn)}
        />
      </Suspense>

      <Environment
        files={"/hdr/warehouse-hdri.hdr"}
        environmentIntensity={0.8}
      />
      <CameraControls
        ref={cameraControls}
        minDistance={1}
        maxDistance={8}
        minPolarAngle={1}
        maxPolarAngle={Math.PI / 2}
        azimuthRotateSpeed={0.5}
        polarRotateSpeed={0.5}
        dampingFactor={0.1}
        onStart={onCameraControlStart}
      />
    </Canvas>

  )
}
function SceneContent({
  wheelTextureURLs,
  wheelTextureURL,
  deckTextureURLs,
  deckTextureURL,
  griptapeTextureURLs,
  griptapeTextureURL,
  truckColor,
  boltColor,
  constantWheelSpin,
  pose,
  onCapture,
  setCaptureImpl,
}: Props & { setCaptureImpl: (fn: () => void) => void }) {
  const { gl, scene, camera } = useThree()
  const doCapture = useCallback(() => {
    gl.render(scene, camera)
    const dataUrl = gl.domElement.toDataURL('image/png')
    onCapture?.(dataUrl)
  }, [gl, scene, camera, onCapture])

  React.useEffect(() => {
    setCaptureImpl(() => doCapture)
  }, [doCapture, setCaptureImpl])

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <Skateboard
        wheelTextureURLs={wheelTextureURLs}
        wheelTextureURL={wheelTextureURL}
        deckTextureURLs={deckTextureURLs}
        deckTextureURL={deckTextureURL}
        griptapeTextureURLs={griptapeTextureURLs}
        griptapeTextureURL={griptapeTextureURL}
        truckColor={truckColor}
        boltColor={boltColor}
        constantWheelSpin={constantWheelSpin}
        pose="vertical"
      />
    </>
  )
}
