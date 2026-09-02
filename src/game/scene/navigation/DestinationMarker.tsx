import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { AGENT_CATALOG } from '../../config/agentCatalog';
import { useAgentMovementStore } from '../../entities/agents/agentMovementStore';
import { useAgentStore } from '../../entities/agents/agentStore';
import { gridToWorld } from '../../navigation/gridUtils';

export function DestinationMarker() {
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const movements = useAgentMovementStore((state) => state.movements);
  const grid = useAgentMovementStore((state) => state.grid);

  const markerRef = useRef<THREE.Group>(null);
  const ringMeshRef = useRef<THREE.Mesh>(null);

  const selectedAgent = AGENT_CATALOG.find((a) => a.id === selectedAgentId);
  const currentMovement = selectedAgentId ? movements[selectedAgentId] : null;

  const targetGrid = currentMovement?.targetGrid;
  const isMoving = currentMovement?.isMoving ?? false;

  useFrame((state) => {
    if (!markerRef.current || !ringMeshRef.current || !isMoving) return;

    // Pulso sutil de escala e rotação no marcador de destino
    const t = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 5) * 0.08;
    ringMeshRef.current.scale.set(scale, scale, 1);

    // Flutuação suave do ponteiro
    markerRef.current.position.y = 0.03 + Math.sin(t * 4) * 0.03;
  });

  if (!selectedAgentId || !selectedAgent || !targetGrid || !isMoving) {
    return null;
  }

  const worldPos = gridToWorld(targetGrid, grid);
  const color = selectedAgent.appearance.primaryColor;

  return (
    <group ref={markerRef} position={[worldPos.x, 0.03, worldPos.z]}>
      {/* 1. Anel externo pulsante no piso */}
      <mesh
        ref={ringMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.36, 0.44, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Ponto central discreto no piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.12, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Indicador cônico low-poly apontando para o piso */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.25, 4]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
          flatShading
        />
      </mesh>
    </group>
  );
}
