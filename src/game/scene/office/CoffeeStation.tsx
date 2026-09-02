import { useMemo } from 'react';
import * as THREE from 'three';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';

export function CoffeeStation() {
  const { counterSize, stools, smallTablePosition, counterPosition } =
    OFFICE_LAYOUT_CONFIG.coffeeStation;

  const materials = useMemo(() => {
    return {
      counterCabinet: new THREE.MeshStandardMaterial({
        color: '#475569', // Slate 600
        roughness: 0.8,
        metalness: 0.1,
      }),
      counterTop: new THREE.MeshStandardMaterial({
        color: '#f8fafc', // Mármore claro
        roughness: 0.4,
        metalness: 0.05,
      }),
      machineBody: new THREE.MeshStandardMaterial({
        color: '#0f172a', // Preto fosco
        roughness: 0.5,
        metalness: 0.3,
      }),
      machineChrome: new THREE.MeshStandardMaterial({
        color: '#cbd5e1', // Aço escovado
        roughness: 0.3,
        metalness: 0.4,
      }),
      cupRed: new THREE.MeshStandardMaterial({ color: '#f87171', roughness: 0.6 }),
      cupYellow: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.6 }),
      cupTeal: new THREE.MeshStandardMaterial({ color: '#2dd4bf', roughness: 0.6 }),
      bistroWood: new THREE.MeshStandardMaterial({
        color: '#e2d9cc',
        roughness: 0.85,
        metalness: 0.05,
      }),
      bistroFrame: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.7,
        metalness: 0.2,
      }),
      stoolCushion: new THREE.MeshStandardMaterial({
        color: '#fbbf24', // Mostarda alegre
        roughness: 0.8,
        metalness: 0.05,
      }),
    };
  }, []);

  return (
    <group name="coffee-station-group">
      {/* 1. Balcão Principal de Café */}
      <group position={counterPosition}>
        {/* Gabinete inferior */}
        <mesh position={[0, counterSize[1] / 2 - 0.03, 0]} castShadow receiveShadow material={materials.counterCabinet}>
          <boxGeometry args={[counterSize[0], counterSize[1] - 0.06, counterSize[2]]} />
        </mesh>
        {/* Tampo de pedra saliente */}
        <mesh position={[0, counterSize[1] - 0.015, 0]} castShadow receiveShadow material={materials.counterTop}>
          <boxGeometry args={[counterSize[0] + 0.08, 0.05, counterSize[2] + 0.08]} />
        </mesh>

        {/* 2. Cafeteira Express Low-Poly sobre o balcão */}
        <group position={[0, counterSize[1] + 0.01, -0.3]}>
          {/* Base da máquina com bandeja pingadeira */}
          <mesh position={[0, 0.03, 0]} castShadow material={materials.machineChrome}>
            <boxGeometry args={[0.55, 0.06, 0.45]} />
          </mesh>
          {/* Corpo principal */}
          <mesh position={[0, 0.22, -0.05]} castShadow material={materials.machineBody}>
            <boxGeometry args={[0.5, 0.34, 0.35]} />
          </mesh>
          {/* Topo / aquecedor de xícaras */}
          <mesh position={[0, 0.4, -0.05]} material={materials.machineChrome}>
            <boxGeometry args={[0.48, 0.03, 0.32]} />
          </mesh>
          {/* Grupo de extração e manopla */}
          <mesh position={[-0.12, 0.22, 0.14]} material={materials.machineChrome}>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
          </mesh>
          <mesh position={[0.12, 0.22, 0.14]} material={materials.machineChrome}>
            <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
          </mesh>
          {/* Manípulos pretos */}
          <mesh position={[-0.12, 0.2, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={materials.machineBody}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
          </mesh>
          <mesh position={[0.12, 0.2, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={materials.machineBody}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
          </mesh>

          {/* Xícara em extração */}
          <mesh position={[-0.12, 0.09, 0.14]} material={materials.cupRed}>
            <cylinderGeometry args={[0.04, 0.03, 0.06, 8]} />
          </mesh>
        </group>

        {/* Canecas guardadas e organizadas ao lado */}
        <mesh position={[0.1, counterSize[1] + 0.04, 0.5]} material={materials.cupYellow}>
          <cylinderGeometry args={[0.045, 0.038, 0.08, 8]} />
        </mesh>
        <mesh position={[-0.15, counterSize[1] + 0.04, 0.65]} material={materials.cupTeal}>
          <cylinderGeometry args={[0.045, 0.038, 0.08, 8]} />
        </mesh>
        <mesh position={[0.1, counterSize[1] + 0.04, 0.8]} material={materials.cupRed}>
          <cylinderGeometry args={[0.045, 0.038, 0.08, 8]} />
        </mesh>
      </group>

      {/* 3. Mesinha bistrô de convivência */}
      <group position={smallTablePosition}>
        {/* Tampo redondo */}
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow material={materials.bistroWood}>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 16]} />
        </mesh>
        {/* Haste e base redonda metálica */}
        <mesh position={[0, 0.36, 0]} material={materials.bistroFrame}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={materials.bistroFrame}>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 16]} />
        </mesh>

        {/* Caneca na mesinha de convivência */}
        <mesh position={[0.1, 0.76, 0.08]} material={materials.cupTeal}>
          <cylinderGeometry args={[0.035, 0.03, 0.06, 8]} />
        </mesh>
      </group>

      {/* 4. Banquetas / Stools para pausa do café */}
      {stools.map((stool) => (
        <group key={stool.id} position={stool.position}>
          {/* Assento estofado redondo */}
          <mesh position={[0, 0.52, 0]} castShadow material={materials.stoolCushion}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 12]} />
          </mesh>
          {/* Pernas da banqueta */}
          <mesh position={[0, 0.25, 0]} material={materials.bistroFrame}>
            <cylinderGeometry args={[0.15, 0.2, 0.48, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
