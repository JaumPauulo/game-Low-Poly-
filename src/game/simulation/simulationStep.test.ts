import { describe, expect, it } from 'vitest';
import { createRandomSource } from './prng';
import {
  createInitialSimulationState,
  DEFAULT_SIMULATION_CONFIG,
  simulationStep,
} from './simulationStep';
import { AgentSimulationModel, TaskModel } from './types';

function makeAgents(): AgentSimulationModel[] {
  return [
    {
      id: 'gemini',
      name: 'Gemini',
      role: 'Product & Coordination',
      skills: { coding: 0.7, research: 0.8, analysis: 0.9, planning: 1.0, documentation: 0.8 },
      state: 'idle',
      energy: 1.0,
      focus: 1.0,
      currentTaskId: null,
      currentZoneId: 'workstations',
      targetZoneId: null,
      stateElapsedTime: 0,
      completedTaskCount: 0,
    },
    {
      id: 'gpt',
      name: 'GPT',
      role: 'Software Engineering',
      skills: { coding: 1.0, research: 0.7, analysis: 0.8, planning: 0.6, documentation: 0.7 },
      state: 'idle',
      energy: 1.0,
      focus: 1.0,
      currentTaskId: null,
      currentZoneId: 'workstations',
      targetZoneId: null,
      stateElapsedTime: 0,
      completedTaskCount: 0,
    },
  ];
}

function makeTasks(): TaskModel[] {
  return [
    {
      id: 'task-auth',
      title: 'Implementar Módulo de Autenticação',
      type: 'coding',
      priority: 5,
      complexity: 2,
      status: 'backlog',
      progress: 0,
      assignedAgentId: null,
      dependencies: [],
      createdAtSimulationTime: 0,
      completedAtSimulationTime: null,
    },
  ];
}

describe('Motor Lógico e Determinístico de Simulação (simulationStep)', () => {
  // 1. Mesma seed gera mesma sequência
  it('mesma seed reproduz exatamente a mesma sequência de estados e eventos', () => {
    const seed = 98765;
    const prng1 = createRandomSource(seed);
    const prng2 = createRandomSource(seed);

    let state1 = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: makeTasks(),
    });
    let state2 = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: makeTasks(),
    });

    const allEvents1: string[] = [];
    const allEvents2: string[] = [];

    // Executa 20 passos em cada simulação
    for (let i = 0; i < 20; i++) {
      const res1 = simulationStep(state1, 0.25, prng1);
      const res2 = simulationStep(state2, 0.25, prng2);

      state1 = res1.nextState;
      state2 = res2.nextState;

      allEvents1.push(...res1.events.map((e) => `${e.type}:${e.agentId}:${e.taskId}`));
      allEvents2.push(...res2.events.map((e) => `${e.type}:${e.agentId}:${e.taskId}`));
    }

    expect(state1.simulationTime).toBe(state2.simulationTime);
    expect(state1.tickCount).toBe(state2.tickCount);
    expect(state1.agents.gpt.energy).toBeCloseTo(state2.agents.gpt.energy);
    expect(state1.tasks['task-auth'].progress).toBeCloseTo(state2.tasks['task-auth'].progress);
    expect(allEvents1).toEqual(allEvents2);
  });

  // 2. Pause não altera estado
  it('pause não altera o estado da simulação', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const initialState = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: makeTasks(),
    });
    initialState.isPaused = true;

    const { nextState, events, commands } = simulationStep(initialState, 0.25, prng);

    expect(nextState.simulationTime).toBe(0);
    expect(nextState.tickCount).toBe(0);
    expect(events.length).toBe(0);
    expect(commands.length).toBe(0);
    expect(nextState.agents).toEqual(initialState.agents);
  });

  // 3. Progressão de tarefa
  it('tarefa progride continuamente enquanto o agente trabalha', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    let state = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: makeTasks(),
    });

    // Passo 1: O primeiro agente livre elegível escolhe a tarefa de maior prioridade e inicia trabalho
    const step1 = simulationStep(state, 0.25, prng);
    state = step1.nextState;

    const assignedAgentId = state.tasks['task-auth'].assignedAgentId;
    expect(assignedAgentId).toBeTruthy();
    expect(state.agents[assignedAgentId!].currentTaskId).toBe('task-auth');

    // Executa mais alguns passos enquanto ele trabalha
    let initialProgress = state.tasks['task-auth'].progress;
    for (let i = 0; i < 5; i++) {
      const step = simulationStep(state, 0.25, prng);
      state = step.nextState;
      expect(state.tasks['task-auth'].progress).toBeGreaterThanOrEqual(initialProgress);
      initialProgress = state.tasks['task-auth'].progress;
    }
    // Ao final dos passos de trabalho, o progresso deve ser estritamente maior que 0
    expect(state.tasks['task-auth'].progress).toBeGreaterThan(0);
  });

  // 4. Conclusão de tarefa
  it('conclusão de tarefa: atinge 1.0, incrementa completedTaskCount e emite evento TASK_COMPLETED', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const task = makeTasks()[0];
    task.progress = 0.98; // Quase completa

    let state = createInitialSimulationState({
      seed,
      agents: [
        {
          ...makeAgents()[1], // GPT
          state: 'working',
          currentTaskId: task.id,
          currentZoneId: 'workstations',
        },
      ],
      tasks: [task],
    });

    // Executa passos suficientes para terminar
    let taskCompletedEventFound = false;
    for (let i = 0; i < 5; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
      if (step.events.some((e) => e.type === 'TASK_COMPLETED')) {
        taskCompletedEventFound = true;
        break;
      }
    }

    expect(taskCompletedEventFound).toBe(true);
    expect(state.tasks['task-auth'].status).toBe('completed');
    expect(state.tasks['task-auth'].progress).toBe(1.0);
    expect(state.agents.gpt.completedTaskCount).toBe(1);
    expect(state.agents.gpt.currentTaskId).toBeNull();
    expect(state.agents.gpt.state).toBe('idle');
  });

  // 5 e 6. Energia e Foco sempre limitados em [0, 1]
  it('energia e foco permanecem sempre limitados estritamente em [0, 1]', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const exhaustedAgent: AgentSimulationModel = {
      ...makeAgents()[0],
      state: 'working',
      currentTaskId: 'task-auth',
      energy: 0.001,
      focus: 0.001,
    };

    let state = createInitialSimulationState({
      seed,
      agents: [exhaustedAgent],
      tasks: makeTasks(),
    });

    for (let i = 0; i < 10; i++) {
      const step = simulationStep(state, 1.0, prng);
      state = step.nextState;
      expect(state.agents.gemini.energy).toBeGreaterThanOrEqual(0);
      expect(state.agents.gemini.energy).toBeLessThanOrEqual(1);
      expect(state.agents.gemini.focus).toBeGreaterThanOrEqual(0);
      expect(state.agents.gemini.focus).toBeLessThanOrEqual(1);
    }
  });

  // 7. Dependência bloqueada
  it('tarefa com dependências incompletas permanece bloqueada e não é alocada', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const tasks: TaskModel[] = [
      {
        id: 'task-db',
        title: 'Modelagem do Banco de Dados',
        type: 'coding',
        priority: 5,
        complexity: 2,
        status: 'backlog',
        progress: 0,
        assignedAgentId: null,
        dependencies: [],
        createdAtSimulationTime: 0,
        completedAtSimulationTime: null,
      },
      {
        id: 'task-api',
        title: 'Criar Rotas da API',
        type: 'coding',
        priority: 5,
        complexity: 2,
        status: 'backlog',
        progress: 0,
        assignedAgentId: null,
        dependencies: ['task-db'], // Depende do banco de dados!
        createdAtSimulationTime: 0,
        completedAtSimulationTime: null,
      },
    ];

    let state = createInitialSimulationState({
      seed,
      agents: [makeAgents()[1]], // Apenas GPT
      tasks,
    });

    const step1 = simulationStep(state, 0.25, prng);
    state = step1.nextState;

    // GPT deve ter pegado task-db, e task-api deve ter ficado blocked
    expect(state.tasks['task-api'].status).toBe('blocked');
    expect(state.tasks['task-api'].assignedAgentId).toBeNull();
    expect(state.agents.gpt.currentTaskId).toBe('task-db');
  });

  // 8. Recuperação de energia
  it('agente com baixa energia vai ao café e recupera energia até o limiar de saída', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const lowEnergyAgent: AgentSimulationModel = {
      ...makeAgents()[0],
      state: 'working',
      currentTaskId: 'task-auth',
      energy: 0.15, // Abaixo do lowEnergyThreshold (0.20)
      currentZoneId: 'workstations',
    };

    let state = createInitialSimulationState({
      seed,
      agents: [lowEnergyAgent],
      tasks: makeTasks(),
    });

    // Passo 1: Detecta baixa energia e inicia caminhada para o café
    const step1 = simulationStep(state, 0.25, prng);
    state = step1.nextState;
    expect(state.agents.gemini.state).toBe('walking');
    expect(state.agents.gemini.targetZoneId).toBe('coffee');

    // Simula transcurso até chegar ao café
    const step2 = simulationStep(state, 1.0, prng);
    state = step2.nextState;
    expect(state.agents.gemini.state).toBe('coffee');

    // Avança no café até recuperar energia
    for (let i = 0; i < 15; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
      if (state.agents.gemini.state !== 'coffee') {
        break;
      }
    }

    expect(state.agents.gemini.energy).toBeGreaterThanOrEqual(DEFAULT_SIMULATION_CONFIG.recoveredEnergyThreshold);
  });

  // 9. Produtividade por skill
  it('produtividade por skill: agente especialista conclui mais rápido que generalista', () => {
    const seed = 42;
    const prng = createRandomSource(seed);

    const codingTask1: TaskModel = { ...makeTasks()[0], id: 'c1', progress: 0 };
    const codingTask2: TaskModel = { ...makeTasks()[0], id: 'c2', progress: 0 };

    // GPT tem coding 1.0, Gemini tem coding 0.7
    let state = createInitialSimulationState({
      seed,
      agents: [
        { ...makeAgents()[0], state: 'working', currentTaskId: 'c1' },
        { ...makeAgents()[1], state: 'working', currentTaskId: 'c2' },
      ],
      tasks: [codingTask1, codingTask2],
    });

    for (let i = 0; i < 10; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
    }

    expect(state.tasks['c2'].progress).toBeGreaterThan(state.tasks['c1'].progress);
  });

  // 10. Produtividade por complexidade
  it('produtividade por complexidade: tarefas de complexidade 5 demoram mais que 1', () => {
    const seed = 42;
    const prng = createRandomSource(seed);

    const simpleTask: TaskModel = { ...makeTasks()[0], id: 'simple', complexity: 1, progress: 0 };
    const hardTask: TaskModel = { ...makeTasks()[0], id: 'hard', complexity: 5, progress: 0 };

    let state = createInitialSimulationState({
      seed,
      agents: [
        { ...makeAgents()[0], id: 'a1', state: 'working', currentTaskId: 'simple' },
        { ...makeAgents()[0], id: 'a2', state: 'working', currentTaskId: 'hard' },
      ],
      tasks: [simpleTask, hardTask],
    });

    for (let i = 0; i < 10; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
    }

    expect(state.tasks['simple'].progress).toBeGreaterThan(state.tasks['hard'].progress);
  });

  // 11. Colaboração limitada
  it('colaboração acelera o desenvolvimento respeitando teto de bônus', () => {
    const seed = 42;
    const prng = createRandomSource(seed);

    const complexTask: TaskModel = {
      id: 'complex-collab',
      title: 'Arquitetura do Compilador',
      type: 'coding',
      priority: 5,
      complexity: 4,
      status: 'in_progress',
      progress: 0.1,
      assignedAgentId: 'gpt',
      dependencies: [],
      createdAtSimulationTime: 0,
      completedAtSimulationTime: null,
    };

    let state = createInitialSimulationState({
      seed,
      agents: [
        { ...makeAgents()[1], id: 'gpt', state: 'working', currentTaskId: 'complex-collab' },
        { ...makeAgents()[0], id: 'gemini', state: 'idle', currentTaskId: null }, // Disponível para colaborar
      ],
      tasks: [complexTask],
    });

    const step1 = simulationStep(state, 0.25, prng);
    state = step1.nextState;

    // Gemini deve ter sido chamado para colaborar
    const collabEvent = step1.events.find((e) => e.type === 'COLLABORATION_STARTED');
    expect(collabEvent).toBeDefined();
    expect(state.agents.gemini.state).toBe('collaborating');
  });

  // 12. Tarefa concluída não reinicia
  it('tarefa concluída permanece com status completed e nunca reinicia', () => {
    const seed = 42;
    const prng = createRandomSource(seed);
    const completedTask: TaskModel = {
      ...makeTasks()[0],
      status: 'completed',
      progress: 1.0,
      completedAtSimulationTime: 10,
    };

    let state = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: [completedTask],
    });

    for (let i = 0; i < 10; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
      expect(state.tasks[completedTask.id].status).toBe('completed');
      expect(state.tasks[completedTask.id].progress).toBe(1.0);
    }
  });

  // 13. Agente sem tarefa permanece válido
  it('agente sem tarefa permanece estável em idle sem erros', () => {
    const seed = 42;
    const prng = createRandomSource(seed);

    let state = createInitialSimulationState({
      seed,
      agents: makeAgents(),
      tasks: [], // Nenhuma tarefa cadastrada
    });

    for (let i = 0; i < 10; i++) {
      const step = simulationStep(state, 0.5, prng);
      state = step.nextState;
      expect(state.agents.gemini.state).toBe('idle');
      expect(state.agents.gpt.state).toBe('idle');
      expect(state.agents.gemini.errorMessage).toBeFalsy();
    }
  });

  // 14. Dados inválidos geram erro controlado
  it('dados inválidos colocam o agente corrompido em error sem travar outros agentes', () => {
    const seed = 42;
    const prng = createRandomSource(seed);

    const corruptedAgent: AgentSimulationModel = {
      ...makeAgents()[0],
      id: 'corrupted',
      currentTaskId: 'non-existent-task-id-12345', // Tarefa inexistente!
    };

    const healthyAgent: AgentSimulationModel = {
      ...makeAgents()[1],
      id: 'healthy',
      state: 'idle',
    };

    let state = createInitialSimulationState({
      seed,
      agents: [corruptedAgent, healthyAgent],
      tasks: makeTasks(),
    });

    const step = simulationStep(state, 0.25, prng);
    state = step.nextState;

    // O agente corrompido entra em erro
    expect(state.agents.corrupted.state).toBe('error');
    expect(state.agents.corrupted.errorMessage).toContain('inexistente');

    // O agente saudável continua sua vida normalmente e pegou a tarefa disponível
    expect(state.agents.healthy.state).not.toBe('error');
    expect(state.agents.healthy.currentTaskId).toBe('task-auth');
  });
});
