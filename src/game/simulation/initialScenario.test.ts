import { describe, expect, it } from 'vitest';
import {
  createInitialSimulationState,
  INITIAL_AGENTS,
  INITIAL_TASKS,
} from './initialScenario';

describe('Cenário Inicial da Simulação (initialScenario.ts)', () => {
  it('deve conter pelo menos 6 tarefas com os tipos obrigatórios', () => {
    const tasks = Object.values(INITIAL_TASKS);
    expect(tasks.length).toBeGreaterThanOrEqual(6);

    const codingTasks = tasks.filter((t) => t.type === 'coding');
    const researchTasks = tasks.filter((t) => t.type === 'research');
    const analysisTasks = tasks.filter((t) => t.type === 'analysis');
    const planningTasks = tasks.filter((t) => t.type === 'planning');
    const docTasks = tasks.filter((t) => t.type === 'documentation');

    expect(codingTasks.length).toBeGreaterThanOrEqual(2);
    expect(researchTasks.length).toBeGreaterThanOrEqual(1);
    expect(analysisTasks.length).toBeGreaterThanOrEqual(1);
    expect(planningTasks.length).toBeGreaterThanOrEqual(1);
    expect(docTasks.length).toBeGreaterThanOrEqual(1);
  });

  it('deve possuir tarefas com dependências configuradas', () => {
    const tasksWithDeps = Object.values(INITIAL_TASKS).filter(
      (t) => t.dependencies.length > 0
    );
    expect(tasksWithDeps.length).toBeGreaterThan(0);

    for (const task of tasksWithDeps) {
      for (const depId of task.dependencies) {
        expect(INITIAL_TASKS[depId]).toBeDefined();
      }
    }
  });

  it('deve inicializar todos os 4 agentes com atributos saudáveis e habilidades normalizadas', () => {
    const agents = Object.values(INITIAL_AGENTS);
    expect(agents.length).toBe(4);

    for (const agent of agents) {
      expect(agent.energy).toBeGreaterThanOrEqual(0.8);
      expect(agent.focus).toBeGreaterThanOrEqual(0.8);
      expect(agent.state).toBe('idle');
      expect(agent.currentZoneId).toBeDefined();

      // Todas as skills no intervalo [0, 1]
      for (const skillScore of Object.values(agent.skills)) {
        expect(skillScore).toBeGreaterThanOrEqual(0);
        expect(skillScore).toBeLessThanOrEqual(1);
      }
    }
  });

  it('createInitialSimulationState deve criar estado desacoplado com clone profundo', () => {
    const state1 = createInitialSimulationState(100);
    const state2 = createInitialSimulationState(200);

    expect(state1.seed).toBe(100);
    expect(state2.seed).toBe(200);

    // Modificar um estado não deve afetar o outro
    state1.agents.gpt.energy = 0.5;
    expect(state2.agents.gpt.energy).not.toBe(0.5);
  });
});
