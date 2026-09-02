import { useMemo } from 'react';
import * as THREE from 'three';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';

export function CutawayWalls() {
  const { totalWidth, totalDepth } = OFFICE_LAYOUT_CONFIG.grid;
  const { wallHeight, wallThickness, wallColor, baseTrimColor } = OFFICE_LAYOUT_CONFIG.diorama;
  const { whiteboardPosition, whiteboardSize } = OFFICE_LAYOUT_CONFIG.meeting;

  const materials = useMemo(() => {
    return {
      wall: new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: 0.9,
        metalness: 0.05,
        flatShading: true,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: baseTrimColor,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      }),
      whiteboardFrame: new THREE.MeshStandardMaterial({
        color: '#64748b', // Alumínio escovado fosco
        roughness: 0.6,
        metalness: 0.2,
      }),
      whiteboardBoard: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.3,
        metalness: 0.05,
      }),
      markerRed: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 }),
      markerBlue: new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.6 }),
      acousticPanel: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.95,
        metalness: 0.0,
      }),
    };
  }, [wallColor, baseTrimColor]);

  // Cálculos de coordenadas exatas dos centros das paredes
  const halfWidth = totalWidth / 2;
  const halfDepth = totalDepth / 2;
  const wallCenterY = wallHeight / 2;

  // Parede Norte fica ao longo de Z negativo
  const northWallZ = -halfDepth + wallThickness / 2;
  // Parede Oeste fica ao longo de X negativo
  const westWallX = -halfWidth + wallThickness / 2;

  return (
    <group name="cutaway-walls-group">
      {/* 1. Parede Norte (recobre toda a largura totalWidth) */}
      <mesh
        position={[0, wallCenterY, northWallZ]}
        receiveShadow
        castShadow
        material={materials.wall}
      >
        <boxGeometry args={[totalWidth, wallHeight, wallThickness]} />
      </mesh>

      {/* Rodapé Parede Norte */}
      <mesh
        position={[0, 0.075, northWallZ + wallThickness / 2 + 0.02]}
        material={materials.trim}
      >
        <boxGeometry args={[totalWidth, 0.15, 0.04]} />
      </mesh>

      {/* 2. Parede Oeste (recobre a profundidade totalDepth descontando a espessura do canto) */}
      <mesh
        position={[westWallX, wallCenterY, wallThickness / 2]}
        receiveShadow
        castShadow
        material={materials.wall}
      >
        <boxGeometry args={[wallThickness, wallHeight, totalDepth - wallThickness]} />
      </mesh>

      {/* Rodapé Parede Oeste */}
      <mesh
        position={[westWallX + wallThickness / 2 + 0.02, 0.075, wallThickness / 2]}
        material={materials.trim}
      >
        <boxGeometry args={[0.04, 0.15, totalDepth - wallThickness]} />
      </mesh>

      {/* 3. Whiteboard na Parede Norte (Área de Reuniões) */}
      <group position={whiteboardPosition}>
        {/* Moldura do quadro */}
        <mesh position={[0, 0, 0]} material={materials.whiteboardFrame}>
          <boxGeometry args={[whiteboardSize[0], whiteboardSize[1], whiteboardSize[2]]} />
        </mesh>
        {/* Superfície branca de escrita */}
        <mesh position={[0, 0, 0.02]} material={materials.whiteboardBoard}>
          <boxGeometry args={[whiteboardSize[0] - 0.12, whiteboardSize[1] - 0.12, 0.06]} />
        </mesh>
        {/* Calha porta-marcadores na base */}
        <mesh position={[0, -whiteboardSize[1] / 2 + 0.04, 0.07]} material={materials.whiteboardFrame}>
          <boxGeometry args={[whiteboardSize[0] - 0.4, 0.04, 0.08]} />
        </mesh>
        {/* Marcadores decorativos low poly */}
        <mesh position={[-0.2, -whiteboardSize[1] / 2 + 0.08, 0.07]} material={materials.markerRed}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
        </mesh>
        <mesh position={[0.1, -whiteboardSize[1] / 2 + 0.08, 0.07]} material={materials.markerBlue}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
        </mesh>
      </group>

      {/* 4. Painéis acústicos decorativos geométricos na Parede Oeste */}
      <group position={[westWallX + wallThickness / 2 + 0.03, 1.8, -1.8]}>
        <mesh position={[0, 0, 0]} material={materials.acousticPanel}>
          <boxGeometry args={[0.04, 1.2, 1.6]} />
        </mesh>
        <mesh position={[0, 0, 2.0]} material={materials.acousticPanel}>
          <boxGeometry args={[0.04, 1.2, 1.0]} />
        </mesh>
      </group>
    </group>
  );
}
