import { describe, expect, it } from 'vitest';
import {
  createAgentMovement,
  lerpAngle,
  normalizeAngle,
  setAgentDestination,
  stepAgentMovement,
} from './movement';
import { OccupancyManager } from './occupancy';
import { createNavigationGrid } from './gridUtils';

describe('Movement System (movement.ts)', () => {
  const grid = createNavigationGrid(12, 9, 1.2, []); // Grid 12x9 sem obstáculos para testes puros

  it('deve normalizar ângulos e interpolar rotações suavemente', () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI);

    // Interpolação angular
    const lerped = lerpAngle(0, Math.PI / 2, 0.2);
    expect(lerped).toBeCloseTo(0.2);
  });

  it('deve inicializar o agente e registrar sua célula ocupada', () => {
    const occupancy = new OccupancyManager();
    const movement = createAgentMovement(
      'gemini',
      { x: 0, z: 0 },
      0,
      grid,
      occupancy,
      2.0
    );

    expect(movement.agentId).toBe('gemini');
    expect(movement.isMoving).toBe(false);
    expect(movement.status).toBe('idle');
    expect(movement.speed).toBe(2.0);
    expect(occupancy.getAgentCell('gemini')).toBeDefined();
  });

  it('deve planejar caminho e movimentar o agente até o destino', () => {
    const occupancy = new OccupancyManager();
    const movement = createAgentMovement(
      'kimi',
      { x: 0, z: 0 },
      0,
      grid,
      occupancy,
      2.4
    );

    // Envia Kimi para a célula vizinha (1 célula para o leste)
    const startGrid = movement.currentGrid;
    const targetGrid = { x: startGrid.x + 1, z: startGrid.z };

    const ok = setAgentDestination(movement, targetGrid, grid, occupancy);
    expect(ok).toBe(true);
    expect(movement.isMoving).toBe(true);
    expect(movement.status).toBe('moving');

    // Executa alguns passos de simulação até a chegada
    let steps = 0;
    let arrived = false;
    const dt = 0.1; // 100ms por passo

    while (steps < 20 && !arrived) {
      const res = stepAgentMovement(movement, dt, grid, occupancy);
      if (res.hasArrived) {
        arrived = true;
      }
      steps++;
    }

    expect(arrived).toBe(true);
    expect(movement.isMoving).toBe(false);
    expect(movement.status).toBe('arrived');
    expect(movement.currentGrid).toEqual(targetGrid);
    expect(occupancy.getAgentCell('kimi')).toEqual(targetGrid);
  });

  it('deve pausar em espera se a próxima célula estiver ocupada por outro agente', () => {
    const occupancy = new OccupancyManager();
    const agent1 = createAgentMovement('agent1', { x: 0, z: 0 }, 0, grid, occupancy);

    // Planeja destino para frente
    const targetCell = { x: agent1.currentGrid.x + 2, z: agent1.currentGrid.z };
    setAgentDestination(agent1, targetCell, grid, occupancy);

    // Simula que outro agente ocupou a próxima célula antes de agent1
    const nextCell = agent1.path[1];
    occupancy.releaseReservation(agent1.agentId);
    occupancy.occupy('blocker', nextCell);

    // Ao atualizar, como a próxima célula está bloqueada, agent1 entra em espera
    agent1.targetWorldPos = null;
    const res = stepAgentMovement(agent1, 0.05, grid, occupancy);
    expect(agent1.status).toBe('waiting');
    expect(res.isMoving).toBe(true);
  });
});
