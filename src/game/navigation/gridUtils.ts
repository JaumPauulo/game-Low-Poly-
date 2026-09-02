/**
 * Funções puras de conversão geométrica e manipulação de grid de navegação.
 * Estritamente desacoplado de React e Three.js.
 */

import {
  GridCoordinate,
  NavigationCell,
  NavigationGrid,
  NavigationObstacle,
  PathfindingOptions,
  WorldCoordinate2D,
} from './types';

/**
 * Converte coordenadas discretas do grid para o espaço 2D contínuo do mundo (X, Z).
 * Considera o grid centralizado na origem (0, 0) do mundo.
 *
 * Fórmula:
 * worldX = (gridX - (columns - 1) / 2) * cellSize
 * worldZ = (gridZ - (rows - 1) / 2) * cellSize
 */
export function gridToWorld(
  coord: GridCoordinate,
  grid: { columns: number; rows: number; cellSize: number }
): WorldCoordinate2D {
  const worldX = (coord.x - (grid.columns - 1) / 2) * grid.cellSize;
  const worldZ = (coord.z - (grid.rows - 1) / 2) * grid.cellSize;
  return { x: worldX, z: worldZ };
}

/**
 * Converte coordenadas contínuas do mundo (X, Z) para a célula discreta do grid mais próxima.
 * Operação inversa de gridToWorld com arredondamento seguro.
 *
 * Fórmula inversa:
 * gridX = Math.round((worldX / cellSize) + (columns - 1) / 2)
 * gridZ = Math.round((worldZ / cellSize) + (rows - 1) / 2)
 */
export function worldToGrid(
  coord: WorldCoordinate2D,
  grid: { columns: number; rows: number; cellSize: number }
): GridCoordinate {
  const gridX = Math.round(coord.x / grid.cellSize + (grid.columns - 1) / 2);
  const gridZ = Math.round(coord.z / grid.cellSize + (grid.rows - 1) / 2);
  return { x: gridX, z: gridZ };
}

/**
 * Verifica se a coordenada está contida dentro dos limites do grid.
 */
export function isInsideGrid(
  coord: GridCoordinate,
  grid: { columns: number; rows: number }
): boolean {
  return (
    Number.isInteger(coord.x) &&
    Number.isInteger(coord.z) &&
    coord.x >= 0 &&
    coord.x < grid.columns &&
    coord.z >= 0 &&
    coord.z < grid.rows
  );
}

/**
 * Restringe uma coordenada de grid aos limites permitidos do grid [0, cols-1] x [0, rows-1].
 */
export function clampGridCoordinate(
  coord: GridCoordinate,
  grid: { columns: number; rows: number }
): GridCoordinate {
  const clampedX = Math.max(0, Math.min(Math.round(coord.x), grid.columns - 1));
  const clampedZ = Math.max(0, Math.min(Math.round(coord.z), grid.rows - 1));
  return { x: clampedX, z: clampedZ };
}

/**
 * Verifica se uma célula do mundo colide com um obstáculo retangular (AABB 2D).
 */
export function isCellCollidingWithObstacle(
  cellWorldX: number,
  cellWorldZ: number,
  cellSize: number,
  obstacle: NavigationObstacle
): boolean {
  // Margem de tolerância para evitar toques estritamente tangenciais
  const clearance = 0.05;
  const half = cellSize / 2 - clearance;

  const cellMinX = cellWorldX - half;
  const cellMaxX = cellWorldX + half;
  const cellMinZ = cellWorldZ - half;
  const cellMaxZ = cellWorldZ + half;

  return (
    cellMaxX > obstacle.minX &&
    cellMinX < obstacle.maxX &&
    cellMaxZ > obstacle.minZ &&
    cellMinZ < obstacle.maxZ
  );
}

/**
 * Verifica se uma célula do grid é transitável considerando limites, obstáculos estáticos
 * e obstáculos dinâmicos opcionais.
 */
export function isWalkable(
  grid: NavigationGrid,
  coord: GridCoordinate,
  options?: PathfindingOptions & { destination?: GridCoordinate }
): boolean {
  // 1. Limites do grid
  if (!isInsideGrid(coord, grid)) {
    return false;
  }

  // 2. Se for a célula de destino e a opção permitir obstáculo no destino (ex: interagir com mesa)
  if (
    options?.allowDestinationObstacle &&
    options.destination &&
    coord.x === options.destination.x &&
    coord.z === options.destination.z
  ) {
    return true;
  }

  // 3. Obstáculos estáticos pré-computados na célula
  const cell = grid.cells[coord.z][coord.x];
  if (!cell.isWalkable) {
    return false;
  }

  // 4. Obstáculos dinâmicos (outros agentes, bloqueios temporários)
  if (options?.dynamicObstacles && options.dynamicObstacles.length > 0) {
    for (const obs of options.dynamicObstacles) {
      if (isCellCollidingWithObstacle(cell.worldX, cell.worldZ, grid.cellSize, obs)) {
        return false;
      }
    }
  }

  return true;
}

export interface NeighborStep {
  coord: GridCoordinate;
  cost: number;
}

/**
 * Retorna os vizinhos válidos e transitáveis em 8 direções para uma célula.
 * Aplica a regra de proibição de corte de cantos em diagonais adjacentes a obstáculos.
 */
export function getNeighbors(
  grid: NavigationGrid,
  coord: GridCoordinate,
  options?: PathfindingOptions & { destination?: GridCoordinate }
): NeighborStep[] {
  const neighbors: NeighborStep[] = [];
  const preventCornerCutting = options?.preventCornerCutting ?? true;

  // 4 direções cardinais (ortogonais) - custo 1.0
  const cardinalOffsets = [
    { x: 0, z: -1 }, // Norte
    { x: 1, z: 0 },  // Leste
    { x: 0, z: 1 },  // Sul
    { x: -1, z: 0 }, // Oeste
  ];

  for (const offset of cardinalOffsets) {
    const nextCoord: GridCoordinate = { x: coord.x + offset.x, z: coord.z + offset.z };
    if (isWalkable(grid, nextCoord, options)) {
      neighbors.push({ coord: nextCoord, cost: 1.0 });
    }
  }

  // 4 direções diagonais - custo sqrt(2) ~ 1.41421356
  const diagonalOffsets = [
    { x: 1, z: -1 },  // Nordeste
    { x: 1, z: 1 },   // Sudeste
    { x: -1, z: 1 },  // Sudoeste
    { x: -1, z: -1 }, // Noroeste
  ];

  for (const offset of diagonalOffsets) {
    const nextCoord: GridCoordinate = { x: coord.x + offset.x, z: coord.z + offset.z };

    // Se o próprio destino diagonal não for navegável, ignora
    if (!isWalkable(grid, nextCoord, options)) {
      continue;
    }

    // Validação de cantos ortogonais adjacentes
    const adjacentCardinal1: GridCoordinate = { x: coord.x + offset.x, z: coord.z };
    const adjacentCardinal2: GridCoordinate = { x: coord.x, z: coord.z + offset.z };

    const card1Walkable = isWalkable(grid, adjacentCardinal1, options);
    const card2Walkable = isWalkable(grid, adjacentCardinal2, options);

    // Se ambos os cantos ortogonais forem obstáculos (squeeze entre dois obstáculos), SEMPRE bloqueia
    if (!card1Walkable && !card2Walkable) {
      continue;
    }

    // Se a regra de prevenção de corte de cantos estiver ativa, exige que ambos sejam livres
    if (preventCornerCutting && (!card1Walkable || !card2Walkable)) {
      continue;
    }

    neighbors.push({ coord: nextCoord, cost: Math.SQRT2 });
  }

  return neighbors;
}

/**
 * Gera a lista de obstáculos a partir da configuração do cenário.
 */
export function createObstaclesFromConfig(
  staticObstacles: Array<{
    id: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }>
): NavigationObstacle[] {
  return staticObstacles.map((obs) => ({
    id: obs.id,
    minX: obs.minX,
    maxX: obs.maxX,
    minZ: obs.minZ,
    maxZ: obs.maxZ,
    isDynamic: false,
  }));
}

/**
 * Cria e inicializa uma matriz NavigationGrid com suas células e obstáculos mapeados.
 */
export function createNavigationGrid(
  columns: number,
  rows: number,
  cellSize: number,
  obstacles: NavigationObstacle[] = []
): NavigationGrid {
  const cells: NavigationCell[][] = [];

  for (let z = 0; z < rows; z++) {
    const row: NavigationCell[] = [];
    for (let x = 0; x < columns; x++) {
      const { x: worldX, z: worldZ } = gridToWorld({ x, z }, { columns, rows, cellSize });

      let isBlocked = false;
      let collidingObstacleId: string | undefined;

      for (const obs of obstacles) {
        if (isCellCollidingWithObstacle(worldX, worldZ, cellSize, obs)) {
          isBlocked = true;
          collidingObstacleId = obs.id;
          break;
        }
      }

      row.push({
        x,
        z,
        worldX,
        worldZ,
        isWalkable: !isBlocked,
        obstacleId: collidingObstacleId,
      });
    }
    cells.push(row);
  }

  return {
    columns,
    rows,
    cellSize,
    cells,
  };
}
