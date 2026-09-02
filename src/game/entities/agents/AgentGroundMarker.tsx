import { useMemo } from 'react';
import * as THREE from 'three';

interface AgentGroundMarkerProps {
  color: string;
  isSelected: boolean;
  isHovered: boolean;
}

export function AgentGroundMarker({ color, isSelected, isHovered }: AgentGroundMarkerProps) {
  const materials = useMemo(() => {
    return {
      activeRing: new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      }),
      hoverRing: new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
      innerDisc: new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    };
  }, [color]);

  const isVisible = isSelected || isHovered;

  if (!isVisible) {
    return null;
  }

  return (
    <group position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Disco interno sutil */}
      <mesh material={materials.innerDisc}>
        <circleGeometry args={[0.42, 24]} />
      </mesh>

      {/* Anel externo destacado */}
      <mesh material={isSelected ? materials.activeRing : materials.hoverRing}>
        <ringGeometry args={[0.4, 0.48, 24]} />
      </mesh>
    </group>
  );
}
