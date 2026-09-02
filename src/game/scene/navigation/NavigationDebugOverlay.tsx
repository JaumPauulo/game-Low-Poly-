import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { OFFICE_LAYOUT_CONFIG } from '../../config/officeLayout';
import { useAgentMovementStore } from '../../entities/agents/agentMovementStore';
import { useAgentStore } from '../../entities/agents/agentStore';
import { findPath } from '../../navigation/astar';
import {
  createNavigationGrid,
  createObstaclesFromConfig,
  gridToWorld,
} from '../../navigation/gridUtils';
import { useNavigationDebugStore } from './navigationDebugStore';

// Grid de navegação pré-computado a partir da configuração oficial
const officeObstacles = createObstaclesFromConfig(OFFICE_LAYOUT_CONFIG.staticObstacles);
const officeGrid = createNavigationGrid(
  OFFICE_LAYOUT_CONFIG.grid.cols,
  OFFICE_LAYOUT_CONFIG.grid.rows,
  OFFICE_LAYOUT_CONFIG.grid.cellSize,
  officeObstacles
);

export function NavigationDebugOverlay() {
  const isEnabled = useNavigationDebugStore((state) => state.isEnabled);
  const startCoord = useNavigationDebugStore((state) => state.startCoord);
  const goalCoord = useNavigationDebugStore((state) => state.goalCoord);
  const allowDestinationObstacle = useNavigationDebugStore(
    (state) => state.allowDestinationObstacle
  );

  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const movements = useAgentMovementStore((state) => state.movements);
  const selectedMovement = selectedAgentId ? movements[selectedAgentId] : null;

  // Calcula o caminho apenas quando coordenadas ou regras mudarem
  const pathResult = useMemo(() => {
    if (!isEnabled) return null;
    return findPath(officeGrid, startCoord, goalCoord, {
      allowDestinationObstacle,
    });
  }, [isEnabled, startCoord, goalCoord, allowDestinationObstacle]);

  // Se o modo de depuração estiver desligado, não renderiza nada no Three.js
  if (!isEnabled) {
    return null;
  }

  const { cellSize, columns, rows, cells } = officeGrid;

  const startWorld = gridToWorld(startCoord, { columns, rows, cellSize });
  const goalWorld = gridToWorld(goalCoord, { columns, rows, cellSize });

  // Pontos 3D para a linha do caminho do preset de debug
  const linePoints: [number, number, number][] =
    pathResult && pathResult.success && pathResult.worldPath.length > 1
      ? pathResult.worldPath.map((pt) => [pt.x, 0.08, pt.z])
      : [];

  // Pontos 3D para o trajeto dinâmico do agente selecionado
  const agentPathPoints: [number, number, number][] =
    selectedMovement && selectedMovement.path.length > 1
      ? selectedMovement.path.map((coord) => {
          const w = gridToWorld(coord, officeGrid);
          return [w.x, 0.09, w.z];
        })
      : [];

  return (
    <group name="navigation-debug-layer">
      {/* 1. Grade visual de células (Navegáveis vs Obstáculos) */}
      {cells.map((row) =>
        row.map((cell) => {
          const isStart = cell.x === startCoord.x && cell.z === startCoord.z;
          const isGoal = cell.x === goalCoord.x && cell.z === goalCoord.z;

          // Se for start ou goal, os marcadores dedicados já destacam a célula
          if (isStart || isGoal) return null;

          return (
            <mesh
              key={`cell-${cell.x}-${cell.z}`}
              position={[cell.worldX, 0.02, cell.worldZ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[cellSize * 0.85, cellSize * 0.85]} />
              <meshBasicMaterial
                color={cell.isWalkable ? '#22c55e' : '#ef4444'}
                transparent
                opacity={cell.isWalkable ? 0.16 : 0.28}
                depthWrite={false}
              />
            </mesh>
          );
        })
      )}

      {/* 2. Marcador visual de Origem (Verde Esmeralda) */}
      <group position={[startWorld.x, 0, startWorld.z]}>
        {/* Base no chão */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.65} depthWrite={false} />
        </mesh>
        {/* Pilar indicador */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.9, 12]} />
          <meshStandardMaterial color="#10b981" roughness={0.4} />
        </mesh>
        {/* Esfera indicadora no topo */}
        <mesh position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#34d399" roughness={0.3} />
        </mesh>
      </group>

      {/* 3. Marcador visual de Destino (Violeta Vibrante) */}
      <group position={[goalWorld.x, 0, goalWorld.z]}>
        {/* Base no chão */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.65} depthWrite={false} />
        </mesh>
        {/* Pilar indicador */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.9, 12]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.4} />
        </mesh>
        {/* Diamante/Cubo no topo */}
        <mesh position={[0, 0.95, 0]} rotation={[0.78, 0.78, 0]}>
          <boxGeometry args={[0.26, 0.26, 0.26]} />
          <meshStandardMaterial color="#a78bfa" roughness={0.3} />
        </mesh>
      </group>

      {/* 4. Caminho calculado do preset: linha conectando o trajeto */}
      {linePoints.length > 1 && (
        <Line
          points={linePoints}
          color="#38bdf8"
          lineWidth={4.5}
          dashed={false}
          transparent
          opacity={0.9}
        />
      )}

      {/* 5. Linha em tempo real do trajeto do agente selecionado (apenas em modo debug) */}
      {agentPathPoints.length > 1 && (
        <Line
          points={agentPathPoints}
          color="#10b981"
          lineWidth={6}
          dashed={true}
          transparent
          opacity={0.95}
        />
      )}

      {/* Waypoints do caminho */}
      {pathResult &&
        pathResult.success &&
        pathResult.worldPath.map((step, idx) => {
          // Ignora a primeira e última célula pois têm marcadores dedicados
          if (idx === 0 || idx === pathResult.worldPath.length - 1) return null;
          return (
            <mesh key={`path-step-${idx}`} position={[step.x, 0.06, step.z]}>
              <cylinderGeometry args={[0.14, 0.14, 0.06, 12]} />
              <meshStandardMaterial color="#0284c7" roughness={0.4} />
            </mesh>
          );
        })}
    </group>
  );
}
