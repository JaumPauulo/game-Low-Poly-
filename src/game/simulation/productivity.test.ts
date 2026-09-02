import { describe, expect, it } from 'vitest';
import {
  applyCoffeeRecovery,
  applyWorkingDrain,
  calculateCollaborationMultiplier,
  calculateComplexityFactor,
  calculateEnergyFactor,
  calculateFocusFactor,
  calculateSkillFactor,
  calculateTaskProductivity,
  clamp,
} from './productivity';
import { DEFAULT_SIMULATION_CONFIG } from './simulationStep';
import { AgentSimulationModel, TaskModel } from './types';

function createMockAgent(overrides?: Partial<AgentSimulationModel>): AgentSimulationModel {
  return {
    id: 'test-agent',
    name: 'Test Agent',
    role: 'Engineer',
    skills: {
      coding: 1.0,
      research: 0.5,
      analysis: 0.4,
      planning: 0.3,
      documentation: 0.2,
    },
    state: 'working',
    energy: 1.0,
    focus: 1.0,
    currentTaskId: 'task-1',
    currentZoneId: 'workstations',
    targetZoneId: null,
    stateElapsedTime: 0,
    completedTaskCount: 0,
    ...overrides,
  };
}

function createMockTask(overrides?: Partial<TaskModel>): TaskModel {
  return {
    id: 'task-1',
    title: 'Test Task',
    type: 'coding',
    priority: 3,
    complexity: 1,
    status: 'in_progress',
    progress: 0,
    assignedAgentId: 'test-agent',
    dependencies: [],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
    ...overrides,
  };
}

describe('Fórmula pura de Produtividade', () => {
  it('clamp garante valores entre min e max e trata NaN / Infinity', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-0.2, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(NaN, 0, 1, 0.5)).toBe(0.5);
    expect(clamp(Infinity, 0, 1, 0)).toBe(0);
  });

  it('produtividade por skill: maior afinidade aumenta velocidade de entrega', () => {
    const task = createMockTask({ type: 'coding' });

    const highSkillAgent = createMockAgent({ skills: { coding: 1.0, research: 0, analysis: 0, planning: 0, documentation: 0 } });
    const lowSkillAgent = createMockAgent({ skills: { coding: 0.1, research: 0, analysis: 0, planning: 0, documentation: 0 } });

    const resultHigh = calculateTaskProductivity({
      agent: highSkillAgent,
      task,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    const resultLow = calculateTaskProductivity({
      agent: lowSkillAgent,
      task,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    expect(resultHigh.ratePerSecond).toBeGreaterThan(resultLow.ratePerSecond);
    expect(resultHigh.deltaProgress).toBeGreaterThan(resultLow.deltaProgress);
  });

  it('produtividade por complexidade: maior complexidade reduz velocidade de entrega', () => {
    const agent = createMockAgent();

    const simpleTask = createMockTask({ complexity: 1 });
    const complexTask = createMockTask({ complexity: 5 });

    const resultSimple = calculateTaskProductivity({
      agent,
      task: simpleTask,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    const resultComplex = calculateTaskProductivity({
      agent,
      task: complexTask,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    expect(resultSimple.ratePerSecond).toBeGreaterThan(resultComplex.ratePerSecond);
    expect(resultSimple.deltaProgress).toBeGreaterThan(resultComplex.deltaProgress);
  });

  it('baixa energia reduz drasticamente a produtividade', () => {
    const fullEnergyAgent = createMockAgent({ energy: 1.0 });
    const exhaustedAgent = createMockAgent({ energy: 0.05 });
    const zeroEnergyAgent = createMockAgent({ energy: 0.0 });
    const task = createMockTask();

    const fullResult = calculateTaskProductivity({
      agent: fullEnergyAgent,
      task,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    const exhaustedResult = calculateTaskProductivity({
      agent: exhaustedAgent,
      task,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    const zeroResult = calculateTaskProductivity({
      agent: zeroEnergyAgent,
      task,
      deltaSeconds: 1.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    expect(exhaustedResult.ratePerSecond).toBeLessThan(fullResult.ratePerSecond * 0.1);
    expect(zeroResult.ratePerSecond).toBe(0);
    expect(zeroResult.deltaProgress).toBe(0);
  });

  it('colaboração é limitada ao teto estrito e não gera produtividade ilimitada', () => {
    const maxBonus = DEFAULT_SIMULATION_CONFIG.maxCollaborationBonus;

    // Tentativa de passar bônus abusivo ou infinito
    const multiplierNormal = calculateCollaborationMultiplier(0.1, maxBonus);
    const multiplierMax = calculateCollaborationMultiplier(0.25, maxBonus);
    const multiplierExcess = calculateCollaborationMultiplier(100.0, maxBonus);

    expect(multiplierNormal).toBe(1.1);
    expect(multiplierMax).toBe(1.0 + maxBonus);
    expect(multiplierExcess).toBe(1.0 + maxBonus);
    expect(Number.isFinite(multiplierExcess)).toBe(true);
  });

  it('progresso nunca diminui e permanece estritamente entre 0 e 1', () => {
    const agent = createMockAgent();
    const task = createMockTask({ progress: 0.95 });

    // Delta grande o suficiente para estourar 1.0
    const result = calculateTaskProductivity({
      agent,
      task,
      deltaSeconds: 100.0,
      config: DEFAULT_SIMULATION_CONFIG,
    });

    expect(result.newProgress).toBe(1.0);
    expect(result.isCompleted).toBe(true);
    expect(result.deltaProgress).toBeGreaterThanOrEqual(0);
  });

  it('energia e foco sempre limitados em [0, 1] no consumo e na recuperação', () => {
    const agent = createMockAgent({ energy: 0.01, focus: 0.01 });

    // Dreno excessivo não passa abaixo de 0
    const drained = applyWorkingDrain(agent, 1000.0, DEFAULT_SIMULATION_CONFIG);
    expect(drained.energy).toBe(0);
    expect(drained.focus).toBe(0);

    // Recuperação excessiva não passa acima de 1
    const recovered = applyCoffeeRecovery(agent, 1000.0, DEFAULT_SIMULATION_CONFIG);
    expect(recovered.energy).toBe(1);
    expect(recovered.focus).toBe(1);
  });
});
