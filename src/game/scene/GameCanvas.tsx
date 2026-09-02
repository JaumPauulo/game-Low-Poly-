import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../config/sceneConfig';
import { rawCameraStore } from './cameraStore';
import { OfficeScene } from './OfficeScene';

export function GameCanvas() {
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom in/out via roda do mouse de forma suave e contida
    const current = rawCameraStore.getState().zoomMultiplier;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    rawCameraStore.getState().setZoomMultiplier(current + delta);
  };

  return (
    <div
      id="game-canvas-container"
      onWheel={handleWheel}
      className="w-full h-full relative overflow-hidden select-none cursor-default"
    >
      <Canvas
        id="diorama-three-canvas"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={SCENE_CONFIG.dprLimits}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
        className="w-full h-full block"
      >
        {/* Background sólido suave para a estética de diorama */}
        <color attach="background" args={[SCENE_CONFIG.backgroundColor]} />
        <OfficeScene />
      </Canvas>
    </div>
  );
}
