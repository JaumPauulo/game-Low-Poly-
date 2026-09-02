/**
 * Gerenciador puro de cinemática e movimentação de agentes sobre o NavigationGrid.
 * Estritamente desacoplado de React e Three.js (TypeScript puro).
 */

import { findPath } from './astar';
import { gridToWorld, isInsideGrid, isWalkable, worldToGrid } from './gridUtils';
import { OccupancyManager } from './occupancy';
import { GridCoordinate, NavigationGrid, NavigationObstacle, WorldCoordinate2D } from './types';

export type MovementStatus = 'idle' | 'moving' | 'waiting' | 'arrived' | 'blocked';

export interface AgentMovement {
  agentId: string;
  currentGrid: GridCoordinate;
  targetGrid: GridCoordinate | null;
  path: GridCoordinate[];
  pathIndex: number;
  currentWorldPos: WorldCoordinate2D;
  targetWorldPos: WorldCoordinate2D | null;
  rotationY: number;
  targetRotationY: number;
  isMoving: boolean;
  status: MovementStatus;
  speed: number; // unidades de mundo por segundo
  waitTimer: number; // segundos esperando se a próxima célula estiver ocupada
  maxWaitBeforeReroute: number; // limite para tentar nova rota (evita deadlock)
}

export interface MovementStepResult {
  isMoving: boolean;
  hasArrived: boolean;
  status: MovementStatus;
  positionChanged: boolean;
}

/**
 * Normaliza o ângulo no intervalo [-PI, PI].
 */
export function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Interpola suavemente o ângulo de rotação na direção mais curta.
 */
export function lerpAngle(from: number, to: number, maxStep: number): number {
  const diff = normalizeAngle(to - from);
  if (Math.abs(diff) <= maxStep) {
    return to;
  }
  return from + Math.sign(diff) * maxStep;
}

/**
 * Cria a estrutura inicial de movimentação de um agente.
 */
export function createAgentMovement(
  agentId: string,
  initialWorldPos: WorldCoordinate2D,
  initialRotationY: number,
  grid: NavigationGrid,
  occupancy: OccupancyManager,
  speed: number = 2.4
): AgentMovement {
  const initialGrid = worldToGrid(initialWorldPos, grid);

  // Registra a ocupação inicial do agente no sistema de ocupação
  occupancy.occupy(agentId, initialGrid);

  return {
    agentId,
    currentGrid: initialGrid,
    targetGrid: null,
    path: [],
    pathIndex: 0,
    currentWorldPos: { ...initialWorldPos },
    targetWorldPos: null,
    rotationY: initialRotationY,
    targetRotationY: initialRotationY,
    isMoving: false,
    status: 'idle',
    speed,
    waitTimer: 0,
    maxWaitBeforeReroute: 1.0,
  };
}

/**
 * Encontra a célula navegável mais próxima caso a coordenada inicial seja um obstáculo.
 */
export function findNearestWalkableGridCell(
  grid: NavigationGrid,
  coord: GridCoordinate,
  maxRadius = 3
): GridCoordinate | null {
  if (isWalkable(grid, coord)) {
    return { ...coord };
  }

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const candidate = { x: coord.x + dx, z: coord.z + dz };
        if (isInsideGrid(candidate, grid) && isWalkable(grid, candidate)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

/**
 * Define um novo destino de navegação para o agente e calcula o caminho A*.
 * Retorna true se um caminho válido foi encontrado e iniciado.
 */
export function setAgentDestination(
  movement: AgentMovement,
  destinationGrid: GridCoordinate,
  grid: NavigationGrid,
  occupancy: OccupancyManager
): boolean {
  // 1. Valida se o destino está dentro do grid e é navegável
  if (!isInsideGrid(destinationGrid, grid) || !isWalkable(grid, destinationGrid)) {
    return false;
  }

  // 2. Determina o ponto de partida no grid
  let startGrid = worldToGrid(movement.currentWorldPos, grid);
  if (!isWalkable(grid, startGrid)) {
    const nearest = findNearestWalkableGridCell(grid, startGrid);
    if (!nearest) {
      return false;
    }
    startGrid = nearest;
  }

  // Se já estiver exatamente no destino
  if (startGrid.x === destinationGrid.x && startGrid.z === destinationGrid.z) {
    movement.isMoving = false;
    movement.status = 'idle';
    movement.targetGrid = null;
    movement.path = [];
    movement.pathIndex = 0;
    movement.targetWorldPos = null;
    return true;
  }

  // 3. Monta lista de obstáculos dinâmicos correspondentes aos outros agentes
  const dynamicObstacles: NavigationObstacle[] = occupancy
    .getOtherAgentCoordinates(movement.agentId)
    .map((c, i) => {
      const w = gridToWorld(c, grid);
      const half = grid.cellSize * 0.45;
      return {
        id: `agent-obs-${i}`,
        minX: w.x - half,
        maxX: w.x + half,
        minZ: w.z - half,
        maxZ: w.z + half,
        isDynamic: true,
      };
    });

  // 4. Executa a busca de caminho A*
  let pathResult = findPath(grid, startGrid, destinationGrid, {
    dynamicObstacles,
    allowStartObstacle: true,
  });

  // Se não encontrou caminho com os outros agentes como obstáculos rígidos, tenta sem os agentes dinâmicos
  if (!pathResult.success) {
    pathResult = findPath(grid, startGrid, destinationGrid, {
      allowStartObstacle: true,
    });
  }

  if (!pathResult.success || pathResult.path.length < 1) {
    return false;
  }

  // 5. Configura o movimento
  movement.targetGrid = destinationGrid;
  movement.path = pathResult.path;
  movement.pathIndex = 1; // Índice 0 é a célula atual; 1 é o próximo passo
  movement.isMoving = true;
  movement.status = 'moving';
  movement.waitTimer = 0;

  // Se o caminho tem apenas 1 nó (a própria célula de início)
  if (movement.path.length <= 1) {
    movement.isMoving = false;
    movement.status = 'arrived';
    movement.targetWorldPos = null;
    return true;
  }

  // Tenta reservar o primeiro nó do trajeto
  const firstStep = movement.path[1];
  if (occupancy.reserve(movement.agentId, firstStep, grid)) {
    movement.targetWorldPos = gridToWorld(firstStep, grid);
  } else {
    // Se não puder reservar agora, entra em espera e não avança
    movement.status = 'waiting';
    movement.targetWorldPos = null;
  }

  return true;
}

/**
 * Atualiza o movimento do agente em um intervalo delta (segundos).
 * Independente do frame rate e estritamente determinístico.
 */
export function stepAgentMovement(
  movement: AgentMovement,
  delta: number,
  grid: NavigationGrid,
  occupancy: OccupancyManager
): MovementStepResult {
  if (!movement.isMoving || movement.path.length === 0) {
    return {
      isMoving: false,
      hasArrived: movement.status === 'arrived',
      status: movement.status,
      positionChanged: false,
    };
  }

  // Se estiver em estado de espera por uma célula bloqueada por outro agente
  if (movement.status === 'waiting') {
    movement.waitTimer += delta;

    if (movement.pathIndex < movement.path.length) {
      const desiredCell = movement.path[movement.pathIndex];
      // Tenta reservar novamente a célula desejada
      if (occupancy.reserve(movement.agentId, desiredCell, grid)) {
        movement.status = 'moving';
        movement.targetWorldPos = gridToWorld(desiredCell, grid);
        movement.waitTimer = 0;
      }
    }

    // Se o tempo de espera exceder o limite, tenta recalcular nova rota para desviar
    if (movement.waitTimer >= movement.maxWaitBeforeReroute) {
      movement.waitTimer = 0;
      if (movement.targetGrid) {
        const rerouted = setAgentDestination(movement, movement.targetGrid, grid, occupancy);
        if (!rerouted) {
          // Bloqueio completo: interrompe o movimento com segurança
          movement.isMoving = false;
          movement.status = 'blocked';
          movement.path = [];
          movement.targetWorldPos = null;
          occupancy.releaseReservation(movement.agentId);
          return {
            isMoving: false,
            hasArrived: false,
            status: 'blocked',
            positionChanged: false,
          };
        }
      }
    }

    return {
      isMoving: true,
      hasArrived: false,
      status: 'waiting',
      positionChanged: false,
    };
  }

  // Movimentação em direção ao targetWorldPos atual
  if (!movement.targetWorldPos && movement.pathIndex < movement.path.length) {
    const nextCell = movement.path[movement.pathIndex];
    if (occupancy.reserve(movement.agentId, nextCell, grid)) {
      movement.targetWorldPos = gridToWorld(nextCell, grid);
      movement.status = 'moving';
    } else {
      movement.status = 'waiting';
      return {
        isMoving: true,
        hasArrived: false,
        status: 'waiting',
        positionChanged: false,
      };
    }
  }

  if (!movement.targetWorldPos) {
    movement.isMoving = false;
    movement.status = 'arrived';
    return {
      isMoving: false,
      hasArrived: true,
      status: 'arrived',
      positionChanged: false,
    };
  }

  // 1. Calcula direção e distância até o próximo waypoint
  const dx = movement.targetWorldPos.x - movement.currentWorldPos.x;
  const dz = movement.targetWorldPos.z - movement.currentWorldPos.z;
  const distance = Math.hypot(dx, dz);

  // 2. Rotação suave na direção do movimento
  if (distance > 0.001) {
    movement.targetRotationY = Math.atan2(dx, dz);
    movement.rotationY = lerpAngle(movement.rotationY, movement.targetRotationY, 12.0 * delta);
  }

  // 3. Deslocamento contínuo suave proporcional a delta
  const maxStep = movement.speed * delta;

  if (distance <= maxStep) {
    // Chegou no waypoint intermediário
    movement.currentWorldPos.x = movement.targetWorldPos.x;
    movement.currentWorldPos.z = movement.targetWorldPos.z;

    const reachedGrid = movement.path[movement.pathIndex];
    movement.currentGrid = reachedGrid;
    occupancy.occupy(movement.agentId, reachedGrid);

    movement.pathIndex++;

    // Se alcançou o destino final da rota
    if (movement.pathIndex >= movement.path.length) {
      movement.isMoving = false;
      movement.status = 'arrived';
      movement.targetGrid = null;
      movement.targetWorldPos = null;
      movement.path = [];
      occupancy.releaseReservation(movement.agentId);

      return {
        isMoving: false,
        hasArrived: true,
        status: 'arrived',
        positionChanged: true,
      };
    }

    // Prepara o próximo waypoint da rota
    const nextCell = movement.path[movement.pathIndex];
    if (occupancy.reserve(movement.agentId, nextCell, grid)) {
      movement.targetWorldPos = gridToWorld(nextCell, grid);
      movement.status = 'moving';
    } else {
      movement.status = 'waiting';
      movement.targetWorldPos = null;
      movement.waitTimer = 0;
    }

    return {
      isMoving: true,
      hasArrived: false,
      status: movement.status,
      positionChanged: true,
    };
  }

  // Avanço intermediário entre células
  const ratio = maxStep / distance;
  movement.currentWorldPos.x += dx * ratio;
  movement.currentWorldPos.z += dz * ratio;

  return {
    isMoving: true,
    hasArrived: false,
    status: 'moving',
    positionChanged: true,
  };
}

/**
 * Cancela a movimentação de um agente imediatamente, mantendo sua posição e liberando reservas.
 */
export function cancelAgentMovement(movement: AgentMovement, occupancy: OccupancyManager): void {
  movement.isMoving = false;
  movement.status = 'idle';
  movement.targetGrid = null;
  movement.targetWorldPos = null;
  movement.path = [];
  movement.waitTimer = 0;
  occupancy.releaseReservation(movement.agentId);
}
