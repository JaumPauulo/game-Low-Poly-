import { useMemo } from 'react';
import * as THREE from 'three';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';
import { rawAgentMovementStore } from '../../entities/agents/agentMovementStore';
import { rawAgentStore } from '../../entities/agents/agentStore';

export function DioramaBase() {
  const { totalWidth, totalDepth } = OFFICE_LAYOUT_CONFIG.grid;
  const { baseHeight, baseColor, baseRimColor, floorColor } = OFFICE_LAYOUT_CONFIG.diorama;

  // Reutilização de materiais com roughness alta e metalness baixa
  const materials = useMemo(() => {
    return {
      floor: new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
      baseSide: new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.85,
        metalness: 0.1,
        flatShading: true,
      }),
      baseRim: new THREE.MeshStandardMaterial({
        color: baseRimColor,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true,
      }),
      floorAccent: new THREE.MeshStandardMaterial({
        color: '#e2e8f0', // Slate 200 sutil
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
    };
  }, [baseColor, baseRimColor, floorColor]);

  return (
    <group name="diorama-base-group">
      {/* 1. Base sólida recortada do diorama */}
      <mesh
        position={[0, -baseHeight / 2, 0]}
        receiveShadow
        castShadow
        material={materials.baseSide}
      >
        <boxGeometry args={[totalWidth, baseHeight, totalDepth]} />
      </mesh>

      {/* 2. Friso/Chanfro inferior de destaque do pedestal flutuante */}
      <mesh
        position={[0, -baseHeight - 0.06, 0]}
        material={materials.baseRim}
      >
        <boxGeometry args={[totalWidth + 0.15, 0.12, totalDepth + 0.15]} />
      </mesh>

      {/* 3. Lâmina superior do piso de acabamento suave */}
      <mesh
        position={[0, 0.005, 0]}
        receiveShadow
        material={materials.floor}
        onClick={(e) => {
          e.stopPropagation();
          rawAgentStore.getState().selectAgent(null);
        }}
        onPointerOver={() => {
          if (typeof document !== 'undefined') {
            document.body.style.cursor = 'default';
          }
        }}
        onPointerOut={() => {
          if (typeof document !== 'undefined') {
            document.body.style.cursor = 'default';
          }
        }}
      >
        <boxGeometry args={[totalWidth - 0.02, 0.01, totalDepth - 0.02]} />
      </mesh>

      {/* 4. Grade sutil de referência isométrica que demarca as células de 1.2 unidades */}
      <gridHelper
        args={[totalWidth, 12, '#cbd5e1', '#e2e8f0']}
        position={[0, 0.012, 0]}
      />

      {/* 5. Faixas discretas de zoneamento corporativo no piso */}
      {/* Tapete/Piso delimitador da área de reunião */}
      <mesh
        position={[3.8, 0.014, -2.5]}
        receiveShadow
        material={materials.floorAccent}
      >
        <boxGeometry args={[4.4, 0.005, 3.2]} />
      </mesh>
    </group>
  );
}
