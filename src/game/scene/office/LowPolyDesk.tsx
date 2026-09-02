import { useMemo } from 'react';
import * as THREE from 'three';

interface LowPolyDeskProps {
  accentColor?: string;
}

export function LowPolyDesk({ accentColor = '#38bdf8' }: LowPolyDeskProps) {
  const materials = useMemo(() => {
    return {
      top: new THREE.MeshStandardMaterial({
        color: '#f1ede4', // Carvalho claro escandinavo
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      legs: new THREE.MeshStandardMaterial({
        color: '#475569', // Cinza ardósia escuro
        roughness: 0.7,
        metalness: 0.15,
      }),
      drawer: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.8,
        metalness: 0.05,
      }),
      handle: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.5,
        metalness: 0.2,
      }),
      screenDivider: new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.95,
        metalness: 0.0,
      }),
    };
  }, [accentColor]);

  return (
    <group name="low-poly-desk">
      {/* 1. Tampo da mesa */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow material={materials.top}>
        <boxGeometry args={[1.5, 0.05, 0.8]} />
      </mesh>

      {/* 2. Pés da mesa (estrutura metálica lateral) */}
      {/* Perna Esquerda */}
      <mesh position={[-0.68, 0.35, 0]} castShadow material={materials.legs}>
        <boxGeometry args={[0.05, 0.7, 0.74]} />
      </mesh>
      {/* Perna Direita */}
      <mesh position={[0.68, 0.35, 0]} castShadow material={materials.legs}>
        <boxGeometry args={[0.05, 0.7, 0.74]} />
      </mesh>

      {/* 3. Gaveteiro compacto sob o tampo (lado direito) */}
      <group position={[0.42, 0.36, 0]}>
        <mesh castShadow receiveShadow material={materials.drawer}>
          <boxGeometry args={[0.42, 0.65, 0.72]} />
        </mesh>
        {/* Puxadores minimalistas */}
        <mesh position={[0, 0.15, 0.37]} material={materials.handle}>
          <boxGeometry args={[0.16, 0.025, 0.02]} />
        </mesh>
        <mesh position={[0, -0.12, 0.37]} material={materials.handle}>
          <boxGeometry args={[0.16, 0.025, 0.02]} />
        </mesh>
      </group>

      {/* 4. Divisória de feltro acústica na parte de trás da mesa */}
      <mesh position={[0, 0.95, -0.38]} castShadow material={materials.screenDivider}>
        <boxGeometry args={[1.46, 0.42, 0.03]} />
      </mesh>
    </group>
  );
}
