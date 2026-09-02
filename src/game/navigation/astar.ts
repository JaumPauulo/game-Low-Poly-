/**
 * Algoritmo de pathfinding A* (A-Star) puro em 8 direções.
 * Utiliza heurística Octile, validação estrita de cantos de obstáculos,
 * reconstrução de caminho e limitação de iterações para segurança.
 *
 * Estritamente desacoplado de React e Three.js.
 */

import { getNeighbors, gridToWorld, isInsideGrid, isWalkable } from './gridUtils';
import {
  GridCoordinate,
  NavigationGrid,
  PathfindingOptions,
  PathResult,
  WorldCoordinate2D,
} from './types';

/**
 * Heurística Octile para movimentação em 8 direções (ortogonal + diagonal).
 *
 * Custo D (ortogonal) = 1.0
 * Custo D2 (diagonal) = sqrt(2) ~ 1.41421356
 *
 * Fórmula:
 * h = D * |dx - dz| + D2 * min(dx, dz)
 */
export function octileDistance(a: GridCoordinate, b: GridCoordinate): number {
  const dx = Math.abs(a.x - b.x);
  const dz = Math.abs(a.z - b.z);
  return Math.abs(dx - dz) + Math.SQRT2 * Math.min(dx, dz);
}

function coordKey(coord: GridCoordinate): string {
  return `${coord.x},${coord.z}`;
}

interface NodeRecord {
  coord: GridCoordinate;
  gScore: number;
  fScore: number;
}

/**
 * Busca o caminho mais curto e eficiente entre a origem e o destino no NavigationGrid.
 */
export function findPath(
  grid: NavigationGrid,
  start: GridCoordinate,
  goal: GridCoordinate,
  options?: PathfindingOptions
): PathResult {
  const maxIterations = options?.maxIterations ?? 1000;
  const optionsWithDest = { ...options, destination: goal };

  // 1. Validação da origem
  if (!isInsideGrid(start, grid)) {
    return {
      success: false,
      path: [],
      worldPath: [],
      cost: 0,
      visitedNodesCount: 0,
      reason: 'START_INVALID',
    };
  }

  // 2. Validação do destino
  if (!isInsideGrid(goal, grid)) {
    return {
      success: false,
      path: [],
      worldPath: [],
      cost: 0,
      visitedNodesCount: 0,
      reason: 'GOAL_INVALID',
    };
  }

  // Se o ponto de início não for transitável (a menos que allowStartObstacle esteja ativo)
  if (!options?.allowStartObstacle && !isWalkable(grid, start, optionsWithDest)) {
    return {
      success: false,
      path: [],
      worldPath: [],
      cost: 0,
      visitedNodesCount: 0,
      reason: 'START_INVALID',
    };
  }

  // Se o destino for um obstáculo e não permitimos chegada em obstáculo
  if (!isWalkable(grid, goal, optionsWithDest)) {
    return {
      success: false,
      path: [],
      worldPath: [],
      cost: 0,
      visitedNodesCount: 0,
      reason: 'GOAL_INVALID',
    };
  }

  // 3. Caso trivial: origem é igual ao destino
  if (start.x === goal.x && start.z === goal.z) {
    const singleWorldCoord = gridToWorld(start, grid);
    return {
      success: true,
      path: [{ ...start }],
      worldPath: [singleWorldCoord],
      cost: 0,
      visitedNodesCount: 1,
      reason: 'START_EQUALS_GOAL',
    };
  }

  // Estruturas do algoritmo A*
  const openSet: NodeRecord[] = [];
  const openSetMap = new Map<string, NodeRecord>();
  const closedSet = new Set<string>();

  const gScoreMap = new Map<string, number>();
  const cameFrom = new Map<string, GridCoordinate>();

  const startKey = coordKey(start);
  const initialH = octileDistance(start, goal);

  const startNode: NodeRecord = {
    coord: { ...start },
    gScore: 0,
    fScore: initialH,
  };

  openSet.push(startNode);
  openSetMap.set(startKey, startNode);
  gScoreMap.set(startKey, 0);

  let iterations = 0;

  while (openSet.length > 0) {
    iterations++;

    if (iterations > maxIterations) {
      return {
        success: false,
        path: [],
        worldPath: [],
        cost: 0,
        visitedNodesCount: iterations,
        reason: 'MAX_ITERATIONS_EXCEEDED',
      };
    }

    // Seleciona o nó com menor fScore (desempate determinístico por maior gScore e coordenadas)
    let bestIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      const a = openSet[i];
      const b = openSet[bestIndex];
      if (a.fScore < b.fScore - 1e-6) {
        bestIndex = i;
      } else if (Math.abs(a.fScore - b.fScore) <= 1e-6) {
        if (a.gScore > b.gScore + 1e-6) {
          bestIndex = i;
        } else if (Math.abs(a.gScore - b.gScore) <= 1e-6) {
          // Desempate determinístico fixo por ordem posicional
          const orderA = a.coord.z * grid.columns + a.coord.x;
          const orderB = b.coord.z * grid.columns + b.coord.x;
          if (orderA < orderB) {
            bestIndex = i;
          }
        }
      }
    }

    const current = openSet[bestIndex];
    const currentKey = coordKey(current.coord);

    // Remove o nó selecionado da lista aberta
    openSet.splice(bestIndex, 1);
    openSetMap.delete(currentKey);
    closedSet.add(currentKey);

    // 4. Chegamos ao destino!
    if (current.coord.x === goal.x && current.coord.z === goal.z) {
      // Reconstrução do caminho
      const path: GridCoordinate[] = [current.coord];
      let curr = current.coord;
      while (cameFrom.has(coordKey(curr))) {
        curr = cameFrom.get(coordKey(curr))!;
        path.unshift(curr);
      }

      const worldPath: WorldCoordinate2D[] = path.map((c) => gridToWorld(c, grid));

      return {
        success: true,
        path,
        worldPath,
        cost: current.gScore,
        visitedNodesCount: iterations,
        reason: 'REACHED',
      };
    }

    // 5. Expansão dos vizinhos em 8 direções
    const neighbors = getNeighbors(grid, current.coord, optionsWithDest);

    for (const neighbor of neighbors) {
      const nKey = coordKey(neighbor.coord);

      if (closedSet.has(nKey)) {
        continue;
      }

      const tentativeG = current.gScore + neighbor.cost;
      const existingG = gScoreMap.get(nKey);

      if (existingG === undefined || tentativeG < existingG - 1e-6) {
        cameFrom.set(nKey, current.coord);
        gScoreMap.set(nKey, tentativeG);

        const h = octileDistance(neighbor.coord, goal);
        const fScore = tentativeG + h;

        const existingOpenNode = openSetMap.get(nKey);
        if (existingOpenNode) {
          existingOpenNode.gScore = tentativeG;
          existingOpenNode.fScore = fScore;
        } else {
          const newNode: NodeRecord = {
            coord: neighbor.coord,
            gScore: tentativeG,
            fScore,
          };
          openSet.push(newNode);
          openSetMap.set(nKey, newNode);
        }
      }
    }
  }

  // 6. Destino inalcançável (não há rota viável)
  return {
    success: false,
    path: [],
    worldPath: [],
    cost: 0,
    visitedNodesCount: iterations,
    reason: 'UNREACHABLE',
  };
}
