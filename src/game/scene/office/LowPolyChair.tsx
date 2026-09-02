import { useMemo } from 'react';
import * as THREE from 'three';

interface LowPolyChairProps {
  color?: string;
  rotationY?: number;
}

export function LowPolyChair({ color = '#38bdf8', rotationY = 0 }: LowPolyChairProps) {
  const materials = useMemo(() => {
    return {
      cushion: new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: '#1e293b', // Grafite quase preto fosco
        roughness: 0.6,
        metalness: 0.2,
      }),
      castors: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.7,
        metalness: 0.1,
      }),
    };
  }, [color]);

  return (
    <group name="low-poly-chair" rotation={[0, rotationY, 0]}>
      {/* 1. Base aranha em estrela (estrela simplificada low poly) */}
      <group position={[0, 0.04, 0]}>
        {/* Raio 1 */}
        <mesh material={materials.frame}>
          <boxGeometry args={[0.5, 0.04, 0.06]} />
        </mesh>
        {/* Raio 2 (cruzado) */}
        <mesh rotation={[0, Math.PI / 3, 0]} material={materials.frame}>
          <boxGeometry args={[0.5, 0.04, 0.06]} />
        </mesh>
        {/* Raio 3 (cruzado) */}
        <mesh rotation={[0, -Math.PI / 3, 0]} material={materials.frame}>
          <boxGeometry args={[0.5, 0.04, 0.06]} />
        </mesh>
        {/* Rodinhas esféricas low-poly nos extremos */}
        {[-0.24, 0.24].map((x, i) => (
          <mesh key={i} position={[x, -0.015, 0]} material={materials.castors}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 6]} />
          </mesh>
        ))}
      </group>

      {/* 2. Pistão central de elevação a gás */}
      <mesh position={[0, 0.24, 0]} material={materials.frame}>
        <cylinderGeometry args={[0.03, 0.03, 0.38, 8]} />
      </mesh>

      {/* 3. Assento almofadado */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow material={materials.cushion}>
        <boxGeometry args={[0.48, 0.08, 0.46]} />
      </mesh>

      {/* 4. Encosto ergonômico */}
      <group position={[0, 0.68, -0.22]}>
        {/* Haste de suporte do encosto */}
        <mesh position={[0, -0.1, 0.03]} material={materials.frame}>
          <boxGeometry args={[0.08, 0.24, 0.04]} />
        </mesh>
        {/* Almofada do encosto */}
        <mesh castShadow material={materials.cushion}>
          <boxGeometry args={[0.44, 0.42, 0.07]} />
        </mesh>
      </group>

      {/* 5. Apoios de braço minimalistas */}
      <group position={[-0.25, 0.54, 0]}>
        <mesh material={materials.frame}>
          <boxGeometry args={[0.04, 0.16, 0.26]} />
        </mesh>
      </group>
      <group position={[0.25, 0.54, 0]}>
        <mesh material={materials.frame}>
          <boxGeometry args={[0.04, 0.16, 0.26]} />
        </mesh>
      </group>
    </group>
  );
}
