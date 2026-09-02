import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import type { Mesh } from 'three';
import { SCENE_CONFIG } from '../config/sceneConfig';

export function TestScene() {
  const cubeRef = useRef<Mesh>(null);

  // Rotação visual suave via referência direta, SEM disparar re-renderizações ou setState no React
  useFrame((_, delta) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <>
      {/* Câmera ortográfica provisória em ângulo isométrico 3/4 */}
      <OrthographicCamera
        makeDefault
        position={SCENE_CONFIG.camera.position}
        zoom={SCENE_CONFIG.camera.zoom}
        near={SCENE_CONFIG.camera.near}
        far={SCENE_CONFIG.camera.far}
      />

      {/* Iluminação suave com sombras difusas */}
      <ambientLight
        intensity={SCENE_CONFIG.lighting.ambientIntensity}
        color={SCENE_CONFIG.lighting.ambientColor}
      />
      <hemisphereLight
        args={[
          SCENE_CONFIG.lighting.hemisphereSkyColor,
          SCENE_CONFIG.lighting.hemisphereGroundColor,
          SCENE_CONFIG.lighting.hemisphereIntensity,
        ]}
      />
      <directionalLight
        position={SCENE_CONFIG.lighting.directionalPosition}
        intensity={SCENE_CONFIG.lighting.directionalIntensity}
        color={SCENE_CONFIG.lighting.directionalColor}
        castShadow
        shadow-mapSize-width={SCENE_CONFIG.lighting.shadowMapSize}
        shadow-mapSize-height={SCENE_CONFIG.lighting.shadowMapSize}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.0005}
      />

      {/* Base/Pedestal do diorama de teste com sombra recebida */}
      <mesh
        position={[0, -0.2, 0]}
        receiveShadow
      >
        <boxGeometry args={[SCENE_CONFIG.testScene.planeSize[0], 0.4, SCENE_CONFIG.testScene.planeSize[1]]} />
        <meshStandardMaterial
          color={SCENE_CONFIG.testScene.planeColor}
          roughness={SCENE_CONFIG.testScene.planeRoughness}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* Grade de piso sutil / Grid de referência visual */}
      <gridHelper
        args={[SCENE_CONFIG.testScene.planeSize[0], 12, '#94a3b8', '#cbd5e1']}
        position={[0, 0.01, 0]}
      />

      {/* Cubo low poly representativo */}
      <mesh
        ref={cubeRef}
        position={SCENE_CONFIG.testScene.cubePosition}
        castShadow
        receiveShadow
      >
        <boxGeometry args={SCENE_CONFIG.testScene.cubeSize} />
        <meshStandardMaterial
          color={SCENE_CONFIG.testScene.cubeColor}
          roughness={SCENE_CONFIG.testScene.cubeRoughness}
          metalness={0.05}
          flatShading
        />
      </mesh>
    </>
  );
}
