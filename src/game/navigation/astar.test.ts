import { describe, expect, it } from 'vitest';
import { OFFICE_LAYOUT_CONFIG } from '../config/officeLayout';
import { findPath, octileDistance } from './astar';
import {
  clampGridCoordinate,
  createNavigationGrid,
  createObstaclesFromConfig,
  gridToWorld,
  isInsideGrid,
  isWalkable,
  worldToGrid,
} from './gridUtils';
import { GridCoordinate, NavigationGrid, NavigationObstacle } from './types';

describe('Sistema Matemático de Navegação (Navigation & A* Pathfinding)', () => {
  // Setup do grid real do diorama do escritório (12 cols x 9 rows, cellSize = 1.2)
  const officeObstacles = createObstaclesFromConfig(OFFICE_LAYOUT_CONFIG.staticObstacles);
  const officeGrid = createNavigationGrid(
    OFFICE_LAYOUT_CONFIG.grid.cols,
    OFFICE_LAYOUT_CONFIG.grid.rows,
    OFFICE_LAYOUT_CONFIG.grid.cellSize,
    officeObstacles
  );

  // Grid limpo auxiliar para testes unitários isolados
  function createEmptyGrid(cols = 5, rows = 5, cellSize = 1.0, obstacles: NavigationObstacle[] = []): NavigationGrid {
    return createNavigationGrid(cols, rows, cellSize, obstacles);
  }

  // 1. Caminho reto
  it('1. Caminho reto: deve encontrar trajetória retilínea no corredor livre', () => {
    // No grid do escritório, a linha z=4 é o corredor principal totalmente livre de obstáculos
    const start: GridCoordinate = { x: 2, z: 4 };
    const goal: GridCoordinate = { x: 8, z: 4 };

    const result = findPath(officeGrid, start, goal);

    expect(result.success).toBe(true);
    expect(result.reason).toBe('REACHED');
    expect(result.path.length).toBe(7); // x = 2, 3, 4, 5, 6, 7, 8
    expect(result.cost).toBeCloseTo(6.0, 5);

    // Todos os nós devem manter z = 4
    for (let i = 0; i < result.path.length; i++) {
      expect(result.path[i].z).toBe(4);
      expect(result.path[i].x).toBe(2 + i);
    }
  });

  // 2. Desvio em torno de uma mesa
  it('2. Desvio em torno de uma mesa: deve contornar o obstáculo sem atravessá-lo', () => {
    // Grid 5x5 com obstáculo no centro (2, 2)
    // Coordenadas mundiais com cellSize = 1: centro do grid é (2, 2) correspondente a world (0, 0)
    const tableObstacle: NavigationObstacle = {
      id: 'test-table',
      minX: -0.4,
      maxX: 0.4,
      minZ: -0.4,
      maxZ: 0.4,
    };

    const gridWithTable = createEmptyGrid(5, 5, 1.0, [tableObstacle]);
    expect(gridWithTable.cells[2][2].isWalkable).toBe(false);

    // Navegar de (2, 1) para (2, 3) - obstáculo em (2, 2) no meio do caminho
    const start: GridCoordinate = { x: 2, z: 1 };
    const goal: GridCoordinate = { x: 2, z: 3 };

    const result = findPath(gridWithTable, start, goal);

    expect(result.success).toBe(true);
    expect(result.reason).toBe('REACHED');
    expect(result.path.length).toBeGreaterThan(2);

    // Nenhuma célula do caminho pode ser a célula bloqueada (2, 2)
    for (const step of result.path) {
      expect(step.x === 2 && step.z === 2).toBe(false);
      expect(isWalkable(gridWithTable, step)).toBe(true);
    }
  });

  // 3. Destino inalcançável
  it('3. Destino inalcançável: deve retornar resultado explícito sem lançar exceção', () => {
    // Grid 5x5 onde a célula (4, 4) é navegável em si, mas está completamente ilhada por obstáculos
    const gridBlocked = createEmptyGrid(5, 5, 1.0);
    // Cria uma muralha bloqueando todo o acesso ao canto (4, 4)
    gridBlocked.cells[3][4].isWalkable = false; // Norte de (4, 4)
    gridBlocked.cells[4][3].isWalkable = false; // Oeste de (4, 4)
    gridBlocked.cells[3][3].isWalkable = false; // Diagonal de (4, 4)

    const start: GridCoordinate = { x: 0, z: 0 };
    const goal: GridCoordinate = { x: 4, z: 4 };

    // (4, 4) é uma célula válida e caminhável, mas inacessível a partir de (0, 0)
    expect(isWalkable(gridBlocked, goal)).toBe(true);

    const result = findPath(gridBlocked, start, goal);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('UNREACHABLE');
    expect(result.path).toEqual([]);
    expect(result.worldPath).toEqual([]);
    expect(result.cost).toBe(0);
  });

  // 4. Origem igual ao destino
  it('4. Origem igual ao destino: deve retornar sucesso imediato com custo zero', () => {
    const point: GridCoordinate = { x: 5, z: 4 };
    const result = findPath(officeGrid, point, point);

    expect(result.success).toBe(true);
    expect(result.reason).toBe('START_EQUALS_GOAL');
    expect(result.cost).toBe(0);
    expect(result.path.length).toBe(1);
    expect(result.path[0]).toEqual(point);
    expect(result.worldPath.length).toBe(1);
  });

  // 5. Origem fora do grid
  it('5. Origem fora do grid: deve reportar START_INVALID com segurança', () => {
    const invalidStarts: GridCoordinate[] = [
      { x: -1, z: 4 },
      { x: 12, z: 4 },
      { x: 4, z: -1 },
      { x: 4, z: 9 },
    ];
    const goal: GridCoordinate = { x: 5, z: 4 };

    for (const start of invalidStarts) {
      const result = findPath(officeGrid, start, goal);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('START_INVALID');
      expect(result.path).toEqual([]);
    }
  });

  // 6. Destino fora do grid
  it('6. Destino fora do grid: deve reportar GOAL_INVALID com segurança', () => {
    const start: GridCoordinate = { x: 5, z: 4 };
    const invalidGoals: GridCoordinate[] = [
      { x: -5, z: 4 },
      { x: 25, z: 4 },
      { x: 5, z: -3 },
      { x: 5, z: 15 },
    ];

    for (const goal of invalidGoals) {
      const result = findPath(officeGrid, start, goal);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('GOAL_INVALID');
      expect(result.path).toEqual([]);
    }
  });

  // 7. Diagonal válida
  it('7. Diagonal válida: deve realizar movimento diagonal com custo sqrt(2)', () => {
    const emptyGrid = createEmptyGrid(4, 4, 1.0);

    const start: GridCoordinate = { x: 1, z: 1 };
    const goal: GridCoordinate = { x: 2, z: 2 };

    const result = findPath(emptyGrid, start, goal);

    expect(result.success).toBe(true);
    expect(result.reason).toBe('REACHED');
    expect(result.path.length).toBe(2);
    expect(result.path[0]).toEqual(start);
    expect(result.path[1]).toEqual(goal);
    expect(result.cost).toBeCloseTo(Math.SQRT2, 5);
  });

  // 8. Diagonal bloqueada por canto
  it('8. Diagonal bloqueada por canto: não deve cortar cantos nem atravessar squeeze entre obstáculos', () => {
    const grid = createEmptyGrid(4, 4, 1.0);

    // Cenário A: Squeeze entre dois cantos de obstáculos
    // Queremos ir de (1, 1) para (2, 2)
    // Mas (2, 1) e (1, 2) são obstáculos que tocam pelos cantos
    grid.cells[1][2].isWalkable = false; // Leste de (1,1)
    grid.cells[2][1].isWalkable = false; // Sul de (1,1)

    const start: GridCoordinate = { x: 1, z: 1 };
    const goal: GridCoordinate = { x: 2, z: 2 };

    const result = findPath(grid, start, goal);

    expect(result.success).toBe(true);
    // Não pode ter apenas 2 passos (1,1) -> (2,2) direto!
    expect(result.path.length).toBeGreaterThan(2);
    // O custo deve ser maior que sqrt(2), pois teve que dar a volta
    expect(result.cost).toBeGreaterThan(Math.SQRT2 + 0.1);

    // Cenário B: Canto individual com preventCornerCutting ativado
    const singleCornerGrid = createEmptyGrid(4, 4, 1.0);
    singleCornerGrid.cells[1][2].isWalkable = false; // Apenas um lado bloqueado

    const resultCorner = findPath(singleCornerGrid, start, goal, { preventCornerCutting: true });
    expect(resultCorner.success).toBe(true);
    // A diagonal direta (1,1) -> (2,2) foi proibida por raspar no canto do obstáculo (2,1)
    expect(resultCorner.path.length).toBeGreaterThan(2);
  });

  // 9. Conversão grid → world → grid
  it('9. Conversão grid → world → grid: deve preservar a integridade das coordenadas', () => {
    const cols = OFFICE_LAYOUT_CONFIG.grid.cols;
    const rows = OFFICE_LAYOUT_CONFIG.grid.rows;
    const cellSize = OFFICE_LAYOUT_CONFIG.grid.cellSize;
    const gridRef = { columns: cols, rows: rows, cellSize };

    // Para todas as células do grid oficial do diorama
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const originalGrid: GridCoordinate = { x, z };
        const world = gridToWorld(originalGrid, gridRef);
        const reconstructedGrid = worldToGrid(world, gridRef);

        expect(reconstructedGrid.x).toBe(x);
        expect(reconstructedGrid.z).toBe(z);
        expect(isInsideGrid(reconstructedGrid, gridRef)).toBe(true);
      }
    }

    // Ponto no centro exato do mundo (0, 0)
    const centerWorld = { x: 0, z: 0 };
    const centerGrid = worldToGrid(centerWorld, gridRef);
    expect(centerGrid.x).toBe(Math.round((cols - 1) / 2));
    expect(centerGrid.z).toBe(Math.round((rows - 1) / 2));

    // Teste de clampGridCoordinate
    expect(clampGridCoordinate({ x: -10, z: 99 }, gridRef)).toEqual({ x: 0, z: rows - 1 });
  });

  // 10. Resultado determinístico
  it('10. Resultado determinístico: múltiplas execuções com os mesmos parâmetros geram caminhos idênticos', () => {
    const start: GridCoordinate = { x: 1, z: 4 };
    const goal: GridCoordinate = { x: 11, z: 7 };

    const firstRun = findPath(officeGrid, start, goal);
    expect(firstRun.success).toBe(true);

    // Executar 30 vezes consecutivas e verificar invariância exata
    for (let run = 0; run < 30; run++) {
      const currentRun = findPath(officeGrid, start, goal);

      expect(currentRun.success).toBe(firstRun.success);
      expect(currentRun.cost).toBeCloseTo(firstRun.cost, 7);
      expect(currentRun.visitedNodesCount).toBe(firstRun.visitedNodesCount);
      expect(currentRun.path.length).toBe(firstRun.path.length);

      for (let i = 0; i < firstRun.path.length; i++) {
        expect(currentRun.path[i].x).toBe(firstRun.path[i].x);
        expect(currentRun.path[i].z).toBe(firstRun.path[i].z);
        expect(currentRun.worldPath[i].x).toBeCloseTo(firstRun.worldPath[i].x, 5);
        expect(currentRun.worldPath[i].z).toBeCloseTo(firstRun.worldPath[i].z, 5);
      }
    }
  });

  // Testes complementares de Heurística e Obstáculos Dinâmicos
  it('deve calcular corretamente a heurística Octile', () => {
    // Ortogonal
    expect(octileDistance({ x: 0, z: 0 }, { x: 3, z: 0 })).toBeCloseTo(3.0, 5);
    // Diagonal pura
    expect(octileDistance({ x: 0, z: 0 }, { x: 2, z: 2 })).toBeCloseTo(2 * Math.SQRT2, 5);
    // Misto (dx=3, dz=1 -> 1 diagonal + 2 ortogonais)
    expect(octileDistance({ x: 0, z: 0 }, { x: 3, z: 1 })).toBeCloseTo(2 + Math.SQRT2, 5);
  });

  it('deve respeitar obstáculos dinâmicos (ex: outros agentes)', () => {
    const start: GridCoordinate = { x: 2, z: 4 };
    const goal: GridCoordinate = { x: 6, z: 4 };

    // Caminho normal sem obstáculo dinâmico
    const normalPath = findPath(officeGrid, start, goal);
    expect(normalPath.success).toBe(true);
    expect(normalPath.path.some((p) => p.x === 4 && p.z === 4)).toBe(true);

    // Adiciona um agente bloqueando (4, 4)
    const { x: agentWx, z: agentWz } = gridToWorld(
      { x: 4, z: 4 },
      { columns: officeGrid.columns, rows: officeGrid.rows, cellSize: officeGrid.cellSize }
    );
    const dynamicObstacle: NavigationObstacle = {
      id: 'agent-bob',
      minX: agentWx - 0.4,
      maxX: agentWx + 0.4,
      minZ: agentWz - 0.4,
      maxZ: agentWz + 0.4,
      isDynamic: true,
    };

    const pathWithAgent = findPath(officeGrid, start, goal, {
      dynamicObstacles: [dynamicObstacle],
    });

    expect(pathWithAgent.success).toBe(true);
    // O caminho deve contornar o agente dinâmico
    expect(pathWithAgent.path.some((p) => p.x === 4 && p.z === 4)).toBe(false);
  });

  it('deve permitir destino em obstáculo quando allowDestinationObstacle é true', () => {
    // (1, 3) é o bloco da bancada de trabalho ao lado do corredor transitável (1, 4)
    expect(officeGrid.cells[3][1].isWalkable).toBe(false);
    expect(officeGrid.cells[4][1].isWalkable).toBe(true);

    const start: GridCoordinate = { x: 1, z: 4 };
    const deskGoal: GridCoordinate = { x: 1, z: 3 };

    // Sem a opção: falha com GOAL_INVALID
    const denied = findPath(officeGrid, start, deskGoal, { allowDestinationObstacle: false });
    expect(denied.success).toBe(false);
    expect(denied.reason).toBe('GOAL_INVALID');

    // Com a opção: sucesso!
    const allowed = findPath(officeGrid, start, deskGoal, { allowDestinationObstacle: true });
    expect(allowed.success).toBe(true);
    expect(allowed.reason).toBe('REACHED');
    expect(allowed.path[allowed.path.length - 1]).toEqual(deskGoal);
  });
});
