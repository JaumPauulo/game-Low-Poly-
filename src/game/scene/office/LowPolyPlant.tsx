import { useMemo } from 'react';
import * as THREE from 'three';

interface LowPolyPlantProps {
  scale?: number;
  potType?: 'cylinder' | 'cube';
}

export function LowPolyPlant({ scale = 1, potType = 'cylinder' }: LowPolyPlantProps) {
  const materials = useMemo(() => {
    return {
      pot: new THREE.MeshStandardMaterial({
        color: '#f8fafc', // Cerâmica branca minimalista
        roughness: 0.6,
        metalness: 0.05,
        flatShading: true,
      }),
      soil: new THREE.MeshStandardMaterial({
        color: '#3f2e21', // Terra escura rica
        roughness: 0.95,
        metalness: 0.0,
      }),
      leafMain: new THREE.MeshStandardMaterial({
        color: '#22c55e', // Verde folha vibrante low-poly
        roughness: 0.8,
        metalness: 0.05,
        flatShading: true,
      }),
      leafDark: new THREE.MeshStandardMaterial({
        color: '#15803d', // Verde musgo profundo
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      leafLight: new THREE.MeshStandardMaterial({
        color: '#4ade80', // Broto verde claro
        roughness: 0.75,
        metalness: 0.05,
        flatShading: true,
      }),
      stem: new THREE.MeshStandardMaterial({
        color: '#166534',
        roughness: 0.9,
      }),
    };
  }, []);

  return (
    <group name="low-poly-plant" scale={[scale, scale, scale]}>
      {/* 1. Vaso de cerâmica */}
      {potType === 'cylinder' ? (
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={materials.pot}>
          <cylinderGeometry args={[0.26, 0.2, 0.5, 12]} />
        </mesh>
      ) : (
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow material={materials.pot}>
          <boxGeometry args={[0.45, 0.5, 0.45]} />
        </mesh>
      )}

      {/* 2. Terra */}
      <mesh position={[0, 0.47, 0]} material={materials.soil}>
        <cylinderGeometry args={[0.23, 0.23, 0.04, 10]} />
      </mesh>

      {/* 3. Caule central */}
      <mesh position={[0, 0.7, 0]} material={materials.stem}>
        <cylinderGeometry args={[0.025, 0.035, 0.5, 6]} />
      </mesh>

      {/* 4. Folhas estilizadas facetadas em camadas */}
      {/* Folha 1 (Norte) */}
      <group position={[0, 0.65, 0]} rotation={[0.4, 0, 0]}>
        <mesh position={[0, 0.25, 0.12]} rotation={[0.5, 0, 0]} castShadow material={materials.leafMain}>
          <boxGeometry args={[0.22, 0.38, 0.03]} />
        </mesh>
      </group>

      {/* Folha 2 (Leste) */}
      <group position={[0, 0.72, 0]} rotation={[0.2, Math.PI / 2, 0]}>
        <mesh position={[0, 0.28, 0.14]} rotation={[0.45, 0, 0]} castShadow material={materials.leafDark}>
          <boxGeometry args={[0.24, 0.42, 0.03]} />
        </mesh>
      </group>

      {/* Folha 3 (Sul) */}
      <group position={[0, 0.8, 0]} rotation={[-0.35, 0, 0]}>
        <mesh position={[0, 0.3, -0.12]} rotation={[-0.5, 0, 0]} castShadow material={materials.leafLight}>
          <boxGeometry args={[0.24, 0.44, 0.03]} />
        </mesh>
      </group>

      {/* Folha 4 (Oeste) */}
      <group position={[0, 0.88, 0]} rotation={[0.1, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.32, 0.15]} rotation={[0.4, 0, 0]} castShadow material={materials.leafMain}>
          <boxGeometry args={[0.26, 0.46, 0.03]} />
        </mesh>
      </group>

      {/* Folha 5 (Topo broto) */}
      <group position={[0, 1.05, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0.22, 0]} castShadow material={materials.leafLight}>
          <boxGeometry args={[0.18, 0.32, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}
