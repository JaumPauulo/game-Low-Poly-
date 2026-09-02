import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../config/sceneConfig';
import { TestScene } from './TestScene';

export function GameCanvas() {
  return (
    <div id="game-canvas-container" className="w-full h-full relative overflow-hidden select-none">
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
        <TestScene />
      </Canvas>
    </div>
  );
}
