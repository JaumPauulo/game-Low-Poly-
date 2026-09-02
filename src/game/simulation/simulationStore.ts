/**
 * Store global e controlador de ciclo de vida da simulação.
 *
 * Gerencia:
 * - O estado lógico determinístico (SimulationState)
 * - Fila de eventos e feed histórico com limite de memória
 * - Controles de execução: pause, 1x, 2x, 4x, reset
 * - Integração limpa com o sistema de navegação e cinemática 3D
 */

import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import { RandomSource, SeededRandom } from './prng';
import { createInitialSimulationState, DEFAULT_INITIAL_SEED } from './initialScenario';
import { simulationStep } from './simulationStep';
import {
  SimulationCommand,
  SimulationEvent,
  SimulationEventType,
  SimulationState,
  TaskModel,
} from './types';
import { generateTeamMessage } from './chat/chatTemplates';
import { TeamMessage } from './chat/types';
import {
  determineTaskStatus,
  TaskInputData,
  validateTaskInput,
} from './taskValidation';

export interface SimulationStoreState {
  // Estado lógico central da simulação
  state: SimulationState;

  // PRNG determinístico
  prng: RandomSource;

  // Fila histórica de eventos filtrados para o Feed (com limite de memória)
  feedEvents: SimulationEvent[];

  // Mensagens do feed da equipe (chat dos agentes + eventos de sistema)
  teamMessages: TeamMessage[];

  // Fila completa de eventos do último ciclo
  lastEvents: SimulationEvent[];

  // Comandos pendentes para despacho ao sistema de integração
  pendingCommands: SimulationCommand[];

  // Ações de controle
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  setTimeScale: (scale: 1 | 2 | 4) => void;
  resetScenario: (seed?: number) => void;
  tick: (deltaSeconds: number) => { commands: SimulationCommand[]; events: SimulationEvent[] };
  notifyAgentArrival: (agentId: string, zoneId: string) => void;
  clearFeed: () => void;
  clearTeamMessages: () => void;

  // Gerenciamento e operações de tarefas
  createTask: (input: TaskInputData) => {
    success: boolean;
    taskId?: string;
    errors?: Record<string, string>;
  };
  updateTask: (
    taskId: string,
    input: Partial<TaskInputData>
  ) => {
    success: boolean;
    errors?: Record<string, string>;
  };
  cancelTask: (taskId: string) => {
    success: boolean;
    error?: string;
  };
  assignTask: (
    taskId: string,
    agentId: string | null
  ) => {
    success: boolean;
    errors?: Record<string, string>;
  };
}

const MAX_FEED_EVENTS = 50;
const MAX_TEAM_MESSAGES = 100;

const FEED_EVENT_TYPES: Set<SimulationEventType> = new Set([
  'TASK_ASSIGNED',
  'TASK_STARTED',
  'COFFEE_BREAK_STARTED',
  'COLLABORATION_STARTED',
  'TASK_COMPLETED',
  'AGENT_ERROR',
]);

function createInitialData(seed: number = DEFAULT_INITIAL_SEED) {
  const prng = new SeededRandom(seed);
  const state = createInitialSimulationState(seed);
  const initialMessages: TeamMessage[] = [
    generateTeamMessage({
      context: 'task_created',
      simulationTime: 0,
      customText: 'Simulação inicializada. 4 agentes posicionados e tarefas no diorama.',
    }),
  ];
  return { prng, state, initialMessages };
}

const initial = createInitialData();

// Rastreia milestones de progresso (ex: 50%) para não spammar mensagens
const reportedMilestones = new Set<string>();

export const rawSimulationStore = createStore<SimulationStoreState>((set, get) => ({
  state: initial.state,
  prng: initial.prng,
  feedEvents: [],
  teamMessages: initial.initialMessages,
  lastEvents: [],
  pendingCommands: [],

  togglePause: () => {
    set((s) => ({
      state: {
        ...s.state,
        isPaused: !s.state.isPaused,
      },
    }));
  },

  setPaused: (paused: boolean) => {
    set((s) => ({
      state: {
        ...s.state,
        isPaused: paused,
      },
    }));
  },

  setTimeScale: (scale: 1 | 2 | 4) => {
    set((s) => ({
      state: {
        ...s.state,
        timeScale: scale,
      },
    }));
  },

  resetScenario: (customSeed?: number) => {
    const seed = customSeed ?? get().state.seed ?? DEFAULT_INITIAL_SEED;
    const { prng, state, initialMessages } = createInitialData(seed);
    reportedMilestones.clear();
    set({
      state,
      prng,
      feedEvents: [],
      teamMessages: initialMessages,
      lastEvents: [],
      pendingCommands: [],
    });
  },

  notifyAgentArrival: (agentId: string, zoneId: string) => {
    const current = get().state;
    const agent = current.agents[agentId];
    if (!agent) return;

    // Atualiza a zona atual do agente para indicar formalmente a chegada
    const updatedAgents = {
      ...current.agents,
      [agentId]: {
        ...agent,
        currentZoneId: zoneId,
        targetZoneId: null,
      },
    };

    set({
      state: {
        ...current,
        agents: updatedAgents,
      },
    });
  },

  tick: (deltaSeconds: number) => {
    const { state, prng, feedEvents, teamMessages } = get();

    if (state.isPaused || deltaSeconds <= 0) {
      return { commands: [], events: [] };
    }

    // Executa o passo central determinístico da simulação
    const { nextState, events, commands } = simulationStep(state, deltaSeconds, prng);

    // Filtra eventos relevantes para o feed de telemetria
    const newFeedEntries = events.filter((e) => FEED_EVENT_TYPES.has(e.type));
    let updatedFeed = feedEvents;

    if (newFeedEntries.length > 0) {
      updatedFeed = [...newFeedEntries, ...feedEvents].slice(0, MAX_FEED_EVENTS);
    }

    // Geração determinística de mensagens de equipe e diálogos
    const newTeamMessages: TeamMessage[] = [];

    for (const event of events) {
      const task = event.taskId ? nextState.tasks[event.taskId] : undefined;
      const seedIndex = Math.floor(nextState.simulationTime * 10);

      switch (event.type) {
        case 'TASK_STARTED':
          if (event.agentId && task) {
            newTeamMessages.push(
              generateTeamMessage({
                context: 'task_start',
                simulationTime: event.simulationTime,
                agentId: event.agentId,
                taskId: event.taskId,
                taskTitle: task.title,
                seedIndex,
              })
            );
          }
          break;

        case 'TASK_COMPLETED':
          if (event.agentId && task) {
            newTeamMessages.push(
              generateTeamMessage({
                context: 'task_complete',
                simulationTime: event.simulationTime,
                agentId: event.agentId,
                taskId: event.taskId,
                taskTitle: task.title,
                seedIndex,
              })
            );
          }
          break;

        case 'TASK_BLOCKED':
          if (task) {
            const firstUnfinishedDep = task.dependencies
              .map((id) => nextState.tasks[id])
              .find((d) => d && d.status !== 'completed');
            newTeamMessages.push(
              generateTeamMessage({
                context: 'task_blocked',
                simulationTime: event.simulationTime,
                agentId: event.agentId ?? task.assignedAgentId ?? undefined,
                taskId: event.taskId,
                taskTitle: task.title,
                dependencyTitle: firstUnfinishedDep?.title ?? 'Dependência anterior',
                seedIndex,
              })
            );
          }
          break;

        case 'COLLABORATION_STARTED':
          if (event.agentId) {
            newTeamMessages.push(
              generateTeamMessage({
                context: 'collaboration_request',
                simulationTime: event.simulationTime,
                agentId: event.agentId,
                targetAgentId: event.targetAgentId,
                taskId: event.taskId,
                taskTitle: task?.title,
                seedIndex,
              })
            );
          }
          break;

        case 'COFFEE_BREAK_ENDED':
          if (event.agentId) {
            newTeamMessages.push(
              generateTeamMessage({
                context: 'coffee_return',
                simulationTime: event.simulationTime,
                agentId: event.agentId,
                seedIndex,
              })
            );
          }
          break;

        case 'AGENT_ERROR':
          if (event.agentId) {
            newTeamMessages.push(
              generateTeamMessage({
                context: 'agent_error',
                simulationTime: event.simulationTime,
                agentId: event.agentId,
                seedIndex,
              })
            );
          }
          break;

        case 'TASK_PROGRESS':
          if (task && event.agentId && task.progress >= 0.5) {
            const milestoneKey = `${task.id}-50`;
            if (!reportedMilestones.has(milestoneKey)) {
              reportedMilestones.add(milestoneKey);
              newTeamMessages.push(
                generateTeamMessage({
                  context: 'progress_commentary',
                  simulationTime: event.simulationTime,
                  agentId: event.agentId,
                  taskId: task.id,
                  taskTitle: task.title,
                  progressPercent: 50,
                  seedIndex,
                })
              );
            }
          }
          break;
      }
    }

    let updatedTeamMessages = teamMessages;
    if (newTeamMessages.length > 0) {
      // Adiciona as novas mensagens no final (ordem cronológica)
      updatedTeamMessages = [...teamMessages, ...newTeamMessages].slice(-MAX_TEAM_MESSAGES);
    }

    set({
      state: nextState,
      feedEvents: updatedFeed,
      teamMessages: updatedTeamMessages,
      lastEvents: events,
      pendingCommands: commands,
    });

    return { commands, events };
  },

  clearFeed: () => set({ feedEvents: [] }),
  clearTeamMessages: () => set({ teamMessages: [] }),

  createTask: (input: TaskInputData) => {
    const { state, teamMessages } = get();
    const validAgentIds = Object.keys(state.agents);

    // Validação estrita
    const validation = validateTaskInput(input, {
      allTasks: state.tasks,
      validAgentIds,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors as Record<string, string> };
    }

    // Geração de ID único e descritivo
    const taskCount = Object.keys(state.tasks).length;
    const cleanPrefix = input.type.slice(0, 4);
    const newId = `task-${cleanPrefix}-${taskCount + 1}-${Date.now().toString(36).slice(-4)}`;

    const dependencies = input.dependencies ?? [];
    const initialStatus = determineTaskStatus(
      dependencies,
      input.assignedAgentId,
      state.tasks
    );

    const newTask: TaskModel = {
      id: newId,
      title: input.title.trim(),
      type: input.type,
      priority: input.priority,
      complexity: input.complexity,
      status: initialStatus,
      progress: 0,
      assignedAgentId: input.assignedAgentId || null,
      dependencies,
      createdAtSimulationTime: state.simulationTime,
      completedAtSimulationTime: null,
    };

    const nextTasks = {
      ...state.tasks,
      [newId]: newTask,
    };

    // Se atribuída a um agente disponível, vincula o ID da tarefa
    let nextAgents = state.agents;
    if (newTask.assignedAgentId && state.agents[newTask.assignedAgentId]) {
      const targetAgent = state.agents[newTask.assignedAgentId];
      if (targetAgent.state === 'idle') {
        nextAgents = {
          ...state.agents,
          [newTask.assignedAgentId]: {
            ...targetAgent,
            currentTaskId: newId,
          },
        };
      }
    }

    // Mensagens do feed
    const sysMsg = generateTeamMessage({
      context: 'task_created',
      simulationTime: state.simulationTime,
      taskTitle: newTask.title,
      customText: `Nova tarefa criada: "${newTask.title}" (${newTask.type}, P${newTask.priority}, C${newTask.complexity}).`,
    });

    const msgsToAdd = [sysMsg];

    if (newTask.assignedAgentId) {
      const assignMsg = generateTeamMessage({
        context: 'task_assigned',
        simulationTime: state.simulationTime,
        agentId: newTask.assignedAgentId,
        taskTitle: newTask.title,
      });
      msgsToAdd.push(assignMsg);
    }

    set({
      state: {
        ...state,
        tasks: nextTasks,
        agents: nextAgents,
      },
      teamMessages: [...teamMessages, ...msgsToAdd].slice(-MAX_TEAM_MESSAGES),
    });

    return { success: true, taskId: newId };
  },

  updateTask: (taskId: string, input: Partial<TaskInputData>) => {
    const { state, teamMessages } = get();
    const existingTask = state.tasks[taskId];

    if (!existingTask) {
      return { success: false, errors: { general: 'Tarefa não encontrada.' } };
    }

    if (existingTask.status === 'completed') {
      return {
        success: false,
        errors: { general: 'Tarefas já concluídas não podem ser editadas.' },
      };
    }

    const mergedData: TaskInputData = {
      title: input.title !== undefined ? input.title : existingTask.title,
      type: input.type !== undefined ? input.type : existingTask.type,
      priority: input.priority !== undefined ? input.priority : existingTask.priority,
      complexity: input.complexity !== undefined ? input.complexity : existingTask.complexity,
      dependencies: input.dependencies !== undefined ? input.dependencies : existingTask.dependencies,
      assignedAgentId:
        input.assignedAgentId !== undefined
          ? input.assignedAgentId
          : existingTask.assignedAgentId,
    };

    const validAgentIds = Object.keys(state.agents);
    const validation = validateTaskInput(mergedData, {
      taskId,
      allTasks: state.tasks,
      validAgentIds,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors as Record<string, string> };
    }

    // Se o agente foi alterado ou removido, libera o agente antigo com segurança
    let nextAgents = { ...state.agents };
    const oldAgentId = existingTask.assignedAgentId;
    const newAgentId = mergedData.assignedAgentId || null;

    if (oldAgentId && oldAgentId !== newAgentId && nextAgents[oldAgentId]) {
      const oldAgent = nextAgents[oldAgentId];
      if (oldAgent.currentTaskId === taskId) {
        nextAgents[oldAgentId] = {
          ...oldAgent,
          currentTaskId: null,
          state: oldAgent.state === 'working' || oldAgent.state === 'thinking' ? 'idle' : oldAgent.state,
          targetZoneId: null,
          stateElapsedTime: 0,
        };
      }
    }

    // Se foi atribuído a um novo agente que está ocioso, vincula a tarefa
    if (newAgentId && newAgentId !== oldAgentId && nextAgents[newAgentId]) {
      const newAgent = nextAgents[newAgentId];
      if (newAgent.state === 'idle') {
        nextAgents[newAgentId] = {
          ...newAgent,
          currentTaskId: taskId,
        };
      }
    }

    // Recalcula o status da tarefa
    let nextStatus = existingTask.status;
    if (nextStatus !== 'in_progress') {
      nextStatus = determineTaskStatus(
        mergedData.dependencies ?? [],
        newAgentId,
        state.tasks
      );
    } else {
      // Se estava in_progress e as dependências mudaram para não concluídas, bloqueia
      const statusCheck = determineTaskStatus(
        mergedData.dependencies ?? [],
        newAgentId,
        state.tasks
      );
      if (statusCheck === 'blocked') {
        nextStatus = 'blocked';
      }
    }

    const updatedTask: TaskModel = {
      ...existingTask,
      title: mergedData.title.trim(),
      type: mergedData.type,
      priority: mergedData.priority,
      complexity: mergedData.complexity,
      dependencies: mergedData.dependencies ?? [],
      assignedAgentId: newAgentId,
      status: nextStatus,
    };

    const nextTasks = {
      ...state.tasks,
      [taskId]: updatedTask,
    };

    const msgsToAdd: TeamMessage[] = [];
    if (newAgentId && newAgentId !== oldAgentId) {
      msgsToAdd.push(
        generateTeamMessage({
          context: 'task_assigned',
          simulationTime: state.simulationTime,
          agentId: newAgentId,
          taskTitle: updatedTask.title,
        })
      );
    }

    set({
      state: {
        ...state,
        tasks: nextTasks,
        agents: nextAgents,
      },
      teamMessages: [...teamMessages, ...msgsToAdd].slice(-MAX_TEAM_MESSAGES),
    });

    return { success: true };
  },

  cancelTask: (taskId: string) => {
    const { state, teamMessages } = get();
    const task = state.tasks[taskId];

    if (!task) {
      return { success: false, error: 'Tarefa não encontrada.' };
    }

    if (task.status === 'completed') {
      return { success: false, error: 'Tarefas já concluídas não podem ser canceladas.' };
    }

    // Cancela a tarefa
    const updatedTask: TaskModel = {
      ...task,
      status: 'cancelled',
      assignedAgentId: null,
    };

    // Libera de forma segura qualquer agente que estivesse atribuído ou trabalhando nela
    const nextAgents = { ...state.agents };
    for (const [agentId, agent] of Object.entries(nextAgents)) {
      if (agent.currentTaskId === taskId) {
        nextAgents[agentId] = {
          ...agent,
          currentTaskId: null,
          state:
            agent.state === 'working' ||
            agent.state === 'thinking' ||
            (agent.state === 'walking' && agent.targetZoneId === 'workstations')
              ? 'idle'
              : agent.state,
          targetZoneId: null,
          stateElapsedTime: 0,
        };
      }
    }

    const cancelMsg = generateTeamMessage({
      context: 'task_cancelled',
      simulationTime: state.simulationTime,
      taskTitle: task.title,
    });

    set({
      state: {
        ...state,
        tasks: {
          ...state.tasks,
          [taskId]: updatedTask,
        },
        agents: nextAgents,
      },
      teamMessages: [...teamMessages, cancelMsg].slice(-MAX_TEAM_MESSAGES),
    });

    return { success: true };
  },

  assignTask: (taskId: string, agentId: string | null) => {
    return get().updateTask(taskId, { assignedAgentId: agentId });
  },
}));

/**
 * Hook de consumo reativo do store de simulação para componentes React.
 */
export function useSimulationStore<T>(selector: (state: SimulationStoreState) => T): T {
  return useSyncExternalStore(
    rawSimulationStore.subscribe,
    () => selector(rawSimulationStore.getState()),
    () => selector(rawSimulationStore.getState())
  );
}

