/**
 * Tipos explícitos do sistema matemático de navegação e pathfinding.
 * Este arquivo é estritamente independente de React e Three.js.
 */

export interface GridCoordinate {
  x: number;
  z: number;
}

export interface WorldCoordinate2D {
  x: number;
  z: number;
}

export interface NavigationCell {
  x: number;
  z: number;
  worldX: number;
  worldZ: number;
  isWalkable: boolean;
  obstacleId?: string;
}

export interface NavigationGrid {
  columns: number;
  rows: number;
  cellSize: number;
  cells: NavigationCell[][]; // cells[z][x]
}

export interface NavigationObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isDynamic?: boolean;
}

export type PathFailureReason =
  | 'REACHED'
  | 'START_EQUALS_GOAL'
  | 'UNREACHABLE'
  | 'START_INVALID'
  | 'GOAL_INVALID'
  | 'MAX_ITERATIONS_EXCEEDED';

export interface PathResult {
  success: boolean;
  path: GridCoordinate[];
  worldPath: WorldCoordinate2D[];
  cost: number;
  visitedNodesCount: number;
  reason: PathFailureReason;
}

export interface PathfindingOptions {
  /**
   * Obstáculos dinâmicos opcionais (ex: outros agentes ou bloqueios temporários)
   */
  dynamicObstacles?: NavigationObstacle[];

  /**
   * Se verdadeiro, permite que a célula final seja um obstáculo (ex: posto de trabalho ou mesa)
   */
  allowDestinationObstacle?: boolean;

  /**
   * Se verdadeiro, permite que a célula inicial seja um obstáculo (ex: agente saindo de sua estação)
   */
  allowStartObstacle?: boolean;

  /**
   * Limite de segurança de expansões de nós no A* para evitar laços infinitos
   * Padrão: 1000 iterações
   */
  maxIterations?: number;

  /**
   * Se ativado, proíbe corte de cantos em obstáculos adjacentes nas diagonais.
   * Padrão: true
   */
  preventCornerCutting?: boolean;
}
