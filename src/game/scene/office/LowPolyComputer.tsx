import { useMemo } from 'react';
import * as THREE from 'three';

interface LowPolyComputerProps {
  isLaptop?: boolean;
}

export function LowPolyComputer({ isLaptop = false }: LowPolyComputerProps) {
  const materials = useMemo(() => {
    return {
      hardware: new THREE.MeshStandardMaterial({
        color: '#334155', // Slate escuro fosco
        roughness: 0.6,
        metalness: 0.2,
      }),
      screen: new THREE.MeshStandardMaterial({
        color: '#93c5fd', // Azul céu suave / tela ligada sutil
        roughness: 0.3,
        metalness: 0.1,
      }),
      keyboard: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.8,
        metalness: 0.05,
      }),
      mousepad: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.9,
        metalness: 0.0,
      }),
      mug: new THREE.MeshStandardMaterial({
        color: '#fbbf24', // Caneca amarela alegre
        roughness: 0.7,
        metalness: 0.1,
      }),
    };
  }, []);

  if (isLaptop) {
    return (
      <group name="low-poly-laptop" position={[0, 0.745, 0]}>
        {/* Base do laptop */}
        <mesh position={[0, 0.01, 0.05]} castShadow material={materials.hardware}>
          <boxGeometry args={[0.38, 0.02, 0.26]} />
        </mesh>
        {/* Teclado integrado */}
        <mesh position={[0, 0.022, 0.05]} material={materials.keyboard}>
          <boxGeometry args={[0.34, 0.005, 0.22]} />
        </mesh>
        {/* Tela inclinada em 105 graus */}
        <group position={[0, 0.02, -0.07]} rotation={[-Math.PI / 8, 0, 0]}>
          {/* Tampa / borda da tela */}
          <mesh position={[0, 0.12, 0]} castShadow material={materials.hardware}>
            <boxGeometry args={[0.38, 0.24, 0.018]} />
          </mesh>
          {/* Painel do display */}
          <mesh position={[0, 0.12, 0.01]} material={materials.screen}>
            <boxGeometry args={[0.34, 0.21, 0.005]} />
          </mesh>
        </group>
        {/* Mousepad e mouse ao lado */}
        <mesh position={[0.26, 0.005, 0.05]} material={materials.mousepad}>
          <boxGeometry args={[0.16, 0.003, 0.2]} />
        </mesh>
        <mesh position={[0.26, 0.015, 0.05]} castShadow material={materials.hardware}>
          <boxGeometry args={[0.07, 0.02, 0.1]} />
        </mesh>
        {/* Caneca de café na mesa */}
        <mesh position={[-0.32, 0.05, -0.05]} castShadow material={materials.mug}>
          <cylinderGeometry args={[0.04, 0.035, 0.09, 8]} />
        </mesh>
      </group>
    );
  }

  // Desktop com monitor grande, base e teclado avulso
  return (
    <group name="low-poly-desktop" position={[0, 0.745, 0]}>
      {/* 1. Base e haste do monitor */}
      <mesh position={[0, 0.01, -0.15]} material={materials.hardware}>
        <boxGeometry args={[0.24, 0.015, 0.16]} />
      </mesh>
      <mesh position={[0, 0.15, -0.17]} material={materials.hardware}>
        <boxGeometry args={[0.06, 0.28, 0.04]} />
      </mesh>

      {/* 2. Monitor widescreen */}
      <group position={[0, 0.24, -0.15]}>
        {/* Moldura */}
        <mesh castShadow material={materials.hardware}>
          <boxGeometry args={[0.68, 0.38, 0.03]} />
        </mesh>
        {/* Tela luminosa */}
        <mesh position={[0, 0, 0.018]} material={materials.screen}>
          <boxGeometry args={[0.64, 0.34, 0.005]} />
        </mesh>
      </group>

      {/* 3. Teclado slim */}
      <mesh position={[0, 0.01, 0.1]} castShadow material={materials.keyboard}>
        <boxGeometry args={[0.42, 0.018, 0.14]} />
      </mesh>

      {/* 4. Mousepad e mouse */}
      <mesh position={[0.3, 0.005, 0.1]} material={materials.mousepad}>
        <boxGeometry args={[0.18, 0.003, 0.2]} />
      </mesh>
      <mesh position={[0.3, 0.016, 0.1]} castShadow material={materials.hardware}>
        <boxGeometry args={[0.07, 0.02, 0.1]} />
      </mesh>

      {/* 5. Caneca de café do desenvolvedor */}
      <mesh position={[-0.32, 0.05, 0.05]} castShadow material={materials.mug}>
        <cylinderGeometry args={[0.04, 0.035, 0.09, 8]} />
      </mesh>
    </group>
  );
}
