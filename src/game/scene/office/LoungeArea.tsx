import { useMemo } from 'react';
import * as THREE from 'three';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';

export function LoungeArea() {
  const {
    sofaPosition,
    sofaRotationY,
    sofaSize,
    coffeeTablePosition,
    coffeeTableSize,
    rugPosition,
    rugSize,
    lampPosition,
  } = OFFICE_LAYOUT_CONFIG.lounge;

  const materials = useMemo(() => {
    return {
      rug: new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Slate 200 macio
        roughness: 0.95,
        metalness: 0.0,
      }),
      sofaUpholstery: new THREE.MeshStandardMaterial({
        color: '#f59e0b', // Mostarda aconchegante pastel
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      sofaWood: new THREE.MeshStandardMaterial({
        color: '#78350f', // Madeira nogueira
        roughness: 0.7,
        metalness: 0.1,
      }),
      cushionAccent: new THREE.MeshStandardMaterial({
        color: '#38bdf8', // Almofada azul celeste
        roughness: 0.85,
      }),
      coffeeTableTop: new THREE.MeshStandardMaterial({
        color: '#f1ede4', // Madeira clara
        roughness: 0.8,
        metalness: 0.05,
      }),
      tableLegs: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.6,
        metalness: 0.2,
      }),
      magazine: new THREE.MeshStandardMaterial({
        color: '#f43f5e', // Capa de revista vibrante
        roughness: 0.5,
      }),
      lampMetal: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.5,
        metalness: 0.3,
      }),
      lampShade: new THREE.MeshStandardMaterial({
        color: '#fffbeb', // Cúpula linho claro
        roughness: 0.6,
      }),
    };
  }, []);

  return (
    <group name="lounge-area-group">
      {/* 1. Tapete demarcador do lounge no chão */}
      <mesh
        position={rugPosition}
        receiveShadow
        material={materials.rug}
      >
        <boxGeometry args={[rugSize[0], 0.008, rugSize[1]]} />
      </mesh>

      {/* 2. Sofá moderno low-poly de 3 lugares */}
      <group position={sofaPosition} rotation={[0, sofaRotationY, 0]}>
        {/* Base de madeira sob o estofado */}
        <mesh position={[0, 0.16, 0]} material={materials.sofaWood}>
          <boxGeometry args={[sofaSize[0], 0.06, sofaSize[2]]} />
        </mesh>
        {/* Pés palito em ângulo */}
        {[-sofaSize[0] / 2 + 0.15, sofaSize[0] / 2 - 0.15].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.08, -sofaSize[2] / 2 + 0.12]} material={materials.sofaWood}>
              <cylinderGeometry args={[0.025, 0.015, 0.16, 6]} />
            </mesh>
            <mesh position={[x, 0.08, sofaSize[2] / 2 - 0.12]} material={materials.sofaWood}>
              <cylinderGeometry args={[0.025, 0.015, 0.16, 6]} />
            </mesh>
          </group>
        ))}

        {/* Assento estofado grande */}
        <mesh position={[0, 0.32, 0.06]} castShadow receiveShadow material={materials.sofaUpholstery}>
          <boxGeometry args={[sofaSize[0] - 0.08, 0.24, sofaSize[2] - 0.12]} />
        </mesh>

        {/* Encosto estofado traseiro */}
        <mesh position={[0, 0.56, -sofaSize[2] / 2 + 0.12]} castShadow material={materials.sofaUpholstery}>
          <boxGeometry args={[sofaSize[0] - 0.08, 0.42, 0.2]} />
        </mesh>

        {/* Braço esquerdo e direito */}
        <mesh position={[-sofaSize[0] / 2 + 0.08, 0.44, 0.02]} castShadow material={materials.sofaUpholstery}>
          <boxGeometry args={[0.16, 0.32, sofaSize[2] - 0.04]} />
        </mesh>
        <mesh position={[sofaSize[0] / 2 - 0.08, 0.44, 0.02]} castShadow material={materials.sofaUpholstery}>
          <boxGeometry args={[0.16, 0.32, sofaSize[2] - 0.04]} />
        </mesh>

        {/* Almofadas decorativas soltas */}
        <mesh position={[-0.8, 0.48, -0.15]} rotation={[0, 0.2, 0.2]} castShadow material={materials.cushionAccent}>
          <boxGeometry args={[0.32, 0.32, 0.12]} />
        </mesh>
        <mesh position={[0.8, 0.48, -0.15]} rotation={[0, -0.2, -0.2]} castShadow material={materials.cushionAccent}>
          <boxGeometry args={[0.32, 0.32, 0.12]} />
        </mesh>
      </group>

      {/* 3. Mesinha de centro baixa (Coffee Table) */}
      <group position={coffeeTablePosition}>
        {/* Tampo retangular arredondado */}
        <mesh position={[0, coffeeTableSize[1] - 0.02, 0]} castShadow receiveShadow material={materials.coffeeTableTop}>
          <boxGeometry args={[coffeeTableSize[0], 0.04, coffeeTableSize[2]]} />
        </mesh>
        {/* Pés metálicos finos */}
        {[-coffeeTableSize[0] / 2 + 0.15, coffeeTableSize[0] / 2 - 0.15].map((x, i) => (
          <group key={i}>
            <mesh position={[x, (coffeeTableSize[1] - 0.04) / 2, -coffeeTableSize[2] / 2 + 0.15]} material={materials.tableLegs}>
              <cylinderGeometry args={[0.02, 0.015, coffeeTableSize[1] - 0.04, 6]} />
            </mesh>
            <mesh position={[x, (coffeeTableSize[1] - 0.04) / 2, coffeeTableSize[2] / 2 - 0.15]} material={materials.tableLegs}>
              <cylinderGeometry args={[0.02, 0.015, coffeeTableSize[1] - 0.04, 6]} />
            </mesh>
          </group>
        ))}

        {/* Livro / Revista de design corporativo sobre a mesa */}
        <mesh position={[-0.2, coffeeTableSize[1] + 0.006, 0.05]} rotation={[0, 0.3, 0]} material={materials.magazine}>
          <boxGeometry args={[0.3, 0.012, 0.22]} />
        </mesh>
      </group>

      {/* 4. Luminária de piso estilizada (Floor Lamp) */}
      <group position={lampPosition}>
        {/* Base metálica redonda */}
        <mesh position={[0, 0.02, 0]} material={materials.lampMetal}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
        </mesh>
        {/* Haste alta vertical */}
        <mesh position={[0, 1.05, 0]} material={materials.lampMetal}>
          <cylinderGeometry args={[0.02, 0.02, 2.05, 8]} />
        </mesh>
        {/* Cúpula cônica elegante */}
        <mesh position={[0, 2.05, 0]} castShadow material={materials.lampShade}>
          <cylinderGeometry args={[0.18, 0.28, 0.34, 16]} />
        </mesh>
      </group>
    </group>
  );
}
