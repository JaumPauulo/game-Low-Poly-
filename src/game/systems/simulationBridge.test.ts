import { describe, expect, it, beforeEach } from 'vitest';
import { mapAgentStateToAnimation, SimulationBridge } from './simulationBridge';
import { rawSimulationStore } from '../simulation/simulationStore';
import { rawAgentStore } from '../entities/agents/agentStore';
import { rawAgentMovementStore } from '../entities/agents/agentMovementStore';
import { AgentState } from '../simulation/types';

describe('Sistema de Integração e Ponte da Simulação (simulationBridge.ts)', () => {
  beforeEach(() => {
    rawSimulationStore.getState().resetScenario(424242);
    rawSimulationStore.getState().setPaused(false);
    rawSimulationStore.getState().setTimeScale(1);
    rawAgentStore.getState().selectAgent(null);
  });

  it('deve mapear todos os 9 estados da simulação para animações visuais exatas', () => {
    const mappings: Record<AgentState, string> = {
      idle: 'idle',
      planning: 'thinking',
      walking: 'walking',
      working: 'working',
      thinking: 'thinking',
      collaborating: 'talking',
      coffee: 'coffee',
      talking: 'talking',
      error: 'idle',
    };

    for (const [state, expectedAnim] of Object.entries(mappings)) {
      expect(mapAgentStateToAnimation(state as AgentState)).toBe(expectedAnim);
    }
  });

  it('deve pausar e retomar a simulação corretamente pelos controles', () => {
    const bridge = new SimulationBridge();
    bridge.reset();

    rawSimulationStore.getState().setPaused(true);
    expect(rawSimulationStore.getState().state.isPaused).toBe(true);

    const timeBefore = rawSimulationStore.getState().state.simulationTime;
    bridge.update(1.0); // 1 segundo
    expect(rawSimulationStore.getState().state.simulationTime).toBe(timeBefore);

    rawSimulationStore.getState().setPaused(false);
    bridge.update(0.5);
    expect(rawSimulationStore.getState().state.simulationTime).toBeGreaterThan(timeBefore);
  });

  it('deve respeitar as escalas de velocidade 1x, 2x e 4x', () => {
    const bridge = new SimulationBridge();

    // 1x: 1s real = 1s de simulação
    rawSimulationStore.getState().resetScenario(100);
    rawSimulationStore.getState().setTimeScale(1);
    bridge.reset();
    bridge.update(1.0);
    const time1x = rawSimulationStore.getState().state.simulationTime;
    expect(time1x).toBeCloseTo(1.0, 1);

    // 2x: 1s real = 2s de simulação
    rawSimulationStore.getState().resetScenario(100);
    rawSimulationStore.getState().setTimeScale(2);
    bridge.reset();
    bridge.update(1.0);
    const time2x = rawSimulationStore.getState().state.simulationTime;
    expect(time2x).toBeCloseTo(2.0, 1);

    // 4x: 1s real = 4s de simulação
    rawSimulationStore.getState().resetScenario(100);
    rawSimulationStore.getState().setTimeScale(4);
    bridge.reset();
    bridge.update(1.0);
    const time4x = rawSimulationStore.getState().state.simulationTime;
    expect(time4x).toBeCloseTo(4.0, 1);
  });

  it('deve resetar o cenário para o estado inicial determinístico', () => {
    const bridge = new SimulationBridge();
    bridge.reset();

    // Avança 10 segundos
    for (let i = 0; i < 40; i++) {
      bridge.update(0.25);
    }

    expect(rawSimulationStore.getState().state.simulationTime).toBeGreaterThan(0);

    // Reseta o cenário
    bridge.reset();
    rawSimulationStore.getState().resetScenario();

    const state = rawSimulationStore.getState().state;
    expect(state.simulationTime).toBe(0);
    expect(state.tickCount).toBe(0);
    expect(state.tasks['task-arch'].status).toBe('backlog');
    expect(state.tasks['task-arch'].progress).toBe(0);
  });

  it('agentes devem escolher tarefas, progredir trabalho e completar tarefas no tempo', () => {
    const bridge = new SimulationBridge();
    bridge.reset();
    rawSimulationStore.getState().resetScenario(424242);

    // Executa múltiplos passos da simulação
    for (let i = 0; i < 60; i++) {
      bridge.update(0.25);
    }

    const state = rawSimulationStore.getState().state;
    const tasks = Object.values(state.tasks);

    // Pelo menos uma tarefa deve ter sido iniciada ou completada
    const touchedTasks = tasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'completed' || t.progress > 0
    );
    expect(touchedTasks.length).toBeGreaterThan(0);
  });

  it('deve registrar eventos no Feed mantendo limite de memória', () => {
    const bridge = new SimulationBridge();
    bridge.reset();
    rawSimulationStore.getState().resetScenario(424242);

    for (let i = 0; i < 80; i++) {
      bridge.update(0.25);
    }

    const feed = rawSimulationStore.getState().feedEvents;
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.length).toBeLessThanOrEqual(50); // Limite de 50 eventos
  });
});
