import { useMemo } from 'react';
import * as THREE from 'three';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';
import { LowPolyChair } from './LowPolyChair';

export function MeetingTable() {
  const { tableSize, chairs } = OFFICE_LAYOUT_CONFIG.meeting;

  const materials = useMemo(() => {
    return {
      tableTop: new THREE.MeshStandardMaterial({
        color: '#ede8df', // Madeira clara natural escandinava
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      tableLegs: new THREE.MeshStandardMaterial({
        color: '#334155', // Grafite fosco
        roughness: 0.7,
        metalness: 0.15,
      }),
      powerBox: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.5,
        metalness: 0.2,
      }),
      presentationLaptop: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.6,
      }),
      presentationScreen: new THREE.MeshStandardMaterial({
        color: '#818cf8', // Indigo suave
        roughness: 0.3,
      }),
    };
  }, []);

  return (
    <group name="meeting-area-group">
      {/* 1. Tampo da Mesa de Reunião */}
      <mesh
        position={[0, 0.72, 0]}
        castShadow
        receiveShadow
        material={materials.tableTop}
      >
        <boxGeometry args={[tableSize[0], 0.06, tableSize[2]]} />
      </mesh>

      {/* 2. Suporte/Pernas robustas chanfradas em cada extremidade */}
      {/* Perna Esquerda */}
      <mesh
        position={[-tableSize[0] / 2 + 0.3, 0.35, 0]}
        castShadow
        material={materials.tableLegs}
      >
        <boxGeometry args={[0.12, 0.7, tableSize[2] - 0.4]} />
      </mesh>
      {/* Perna Direita */}
      <mesh
        position={[tableSize[0] / 2 - 0.3, 0.35, 0]}
        castShadow
        material={materials.tableLegs}
      >
        <boxGeometry args={[0.12, 0.7, tableSize[2] - 0.4]} />
      </mesh>

      {/* 3. Caixa de conectividade / tomadas embutida no centro */}
      <mesh position={[0, 0.752, 0]} material={materials.powerBox}>
        <boxGeometry args={[0.5, 0.01, 0.2]} />
      </mesh>

      {/* 4. Laptop central de apresentação */}
      <group position={[0.7, 0.75, 0]}>
        <mesh position={[0, 0.01, 0]} material={materials.presentationLaptop}>
          <boxGeometry args={[0.34, 0.015, 0.24]} />
        </mesh>
        <group position={[0, 0.015, -0.1]} rotation={[-Math.PI / 7, 0, 0]}>
          <mesh position={[0, 0.1, 0]} material={materials.presentationLaptop}>
            <boxGeometry args={[0.34, 0.2, 0.012]} />
          </mesh>
          <mesh position={[0, 0.1, 0.007]} material={materials.presentationScreen}>
            <boxGeometry args={[0.3, 0.17, 0.005]} />
          </mesh>
        </group>
      </group>

      {/* 5. Cadeiras de reunião posicionadas e orientadas ao redor */}
      {chairs.map((chair) => {
        // Posição relativa à mesa
        const relX = chair.position[0] - OFFICE_LAYOUT_CONFIG.meeting.tablePosition[0];
        const relZ = chair.position[2] - OFFICE_LAYOUT_CONFIG.meeting.tablePosition[2];

        return (
          <group key={chair.id} position={[relX, 0, relZ]}>
            <LowPolyChair color={chair.color} rotationY={chair.rotationY} />
          </group>
        );
      })}
    </group>
  );
}
