import { beforeEach, describe, expect, it } from 'vitest';
import { rawAgentMovementStore } from './agentMovementStore';
import { rawAgentStore } from './agentStore';

describe('agentMovementStore', () => {
  beforeEach(() => {
    rawAgentMovementStore.getState().resetAllMovements();
    rawAgentStore.getState().resetAll();
  });

  it('inicializa todos os 4 agentes com seus movimentos e células registradas', () => {
    const { movements, occupancy } = rawAgentMovementStore.getState();

    expect(movements.gemini).toBeDefined();
    expect(movements.claude).toBeDefined();
    expect(movements.gpt).toBeDefined();
    expect(movements.kimi).toBeDefined();

    expect(occupancy.getAgentCell('gemini')).toBeDefined();
    expect(occupancy.getAgentCell('claude')).toBeDefined();
    expect(occupancy.getAgentCell('gpt')).toBeDefined();
    expect(occupancy.getAgentCell('kimi')).toBeDefined();
  });

  it('rejeita comando para destino fora do grid ou em obstáculo com feedback discreto', () => {
    const store = rawAgentMovementStore.getState();

    // Tenta mover para fora do diorama
    const outOk = store.commandAgentMove('kimi', { x: 100, z: 100 });
    expect(outOk).toBe(false);
    expect(rawAgentMovementStore.getState().feedback?.type).toBe('warning');

    // Tenta mover para o meio da parede norte
    const wallOk = store.commandAgentMove('kimi', { x: 0, z: -5.3 });
    expect(wallOk).toBe(false);
    expect(rawAgentMovementStore.getState().feedback?.message).toContain('obstáculo');
  });

  it('inicia movimento e altera animação para walking quando o comando é válido', () => {
    const store = rawAgentMovementStore.getState();

    // Move Kimi para um ponto aberto do corredor central (x: 0, z: 0)
    const success = store.commandAgentMove('kimi', { x: 0, z: 0 });
    expect(success).toBe(true);

    const movement = rawAgentMovementStore.getState().movements.kimi;
    expect(movement.isMoving).toBe(true);
    expect(movement.status).toBe('moving');

    // A animação em agentStore deve ter mudado para 'walking'
    expect(rawAgentStore.getState().agentStates.kimi.animation).toBe('walking');
  });

  it('respeita a pausa global durante o tick', () => {
    const store = rawAgentMovementStore.getState();
    store.commandAgentMove('kimi', { x: 0, z: 0 });

    const initialPos = { ...rawAgentMovementStore.getState().movements.kimi.currentWorldPos };

    // Executa tick com isPaused = true
    store.tick(0.1, true);

    const afterPausedPos = rawAgentMovementStore.getState().movements.kimi.currentWorldPos;
    expect(afterPausedPos.x).toBeCloseTo(initialPos.x);
    expect(afterPausedPos.z).toBeCloseTo(initialPos.z);
  });
});
