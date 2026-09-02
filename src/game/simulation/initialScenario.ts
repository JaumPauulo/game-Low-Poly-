/**
 * Cenário inicial de tarefas e agentes para o simulador Agent Office Diorama.
 *
 * Contém pelo menos 6 tarefas contemplando as competências exigidas:
 * - 2 de coding
 * - 1 de research
 * - 1 de analysis
 * - 1 de planning
 * - 1 de documentation
 *
 * Com suporte a dependências encadeadas e dados determinísticos.
 */

import { AGENT_CATALOG } from '../config/agentCatalog';
import { DEFAULT_SIMULATION_CONFIG } from './simulationStep';
import {
  AgentSimulationModel,
  SimulationConfig,
  SimulationState,
  TaskModel,
} from './types';

export const INITIAL_TASKS: Record<string, TaskModel> = {
  'task-arch': {
    id: 'task-arch',
    title: 'Arquitetura do Diorama e FSM',
    type: 'planning',
    priority: 5,
    complexity: 3,
    status: 'backlog',
    progress: 0,
    assignedAgentId: null,
    dependencies: [],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
  'task-api': {
    id: 'task-api',
    title: 'Implementação do Motor da Simulação',
    type: 'coding',
    priority: 4,
    complexity: 3,
    status: 'blocked',
    progress: 0,
    assignedAgentId: null,
    dependencies: ['task-arch'],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
  'task-ui': {
    id: 'task-ui',
    title: 'Painéis de Telemetria e Controles 3D',
    type: 'coding',
    priority: 4,
    complexity: 2,
    status: 'blocked',
    progress: 0,
    assignedAgentId: null,
    dependencies: ['task-arch'],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
  'task-perf': {
    id: 'task-perf',
    title: 'Pesquisa de Timestep e Desempenho',
    type: 'research',
    priority: 3,
    complexity: 4,
    status: 'backlog',
    progress: 0,
    assignedAgentId: null,
    dependencies: [],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
  'task-metrics': {
    id: 'task-metrics',
    title: 'Análise de Produtividade e Métricas',
    type: 'analysis',
    priority: 3,
    complexity: 3,
    status: 'blocked',
    progress: 0,
    assignedAgentId: null,
    dependencies: ['task-api'],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
  'task-docs': {
    id: 'task-docs',
    title: 'Documentação Técnica e Guias do Game',
    type: 'documentation',
    priority: 2,
    complexity: 2,
    status: 'blocked',
    progress: 0,
    assignedAgentId: null,
    dependencies: ['task-api'],
    createdAtSimulationTime: 0,
    completedAtSimulationTime: null,
  },
};

export const INITIAL_AGENTS: Record<string, AgentSimulationModel> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    role: 'Product & Coordination',
    skills: {
      planning: 1.0,
      analysis: 0.8,
      documentation: 0.7,
      research: 0.6,
      coding: 0.3,
    },
    state: 'idle',
    energy: 1.0,
    focus: 1.0,
    currentTaskId: null,
    currentZoneId: 'meeting',
    targetZoneId: null,
    stateElapsedTime: 0,
    completedTaskCount: 0,
    lastDecisionOrigin: 'local',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    role: 'Research & Documentation',
    skills: {
      research: 1.0,
      documentation: 0.9,
      analysis: 0.7,
      planning: 0.6,
      coding: 0.4,
    },
    state: 'idle',
    energy: 0.95,
    focus: 1.0,
    currentTaskId: null,
    currentZoneId: 'workstations',
    targetZoneId: null,
    stateElapsedTime: 0,
    completedTaskCount: 0,
    lastDecisionOrigin: 'local',
  },
  gpt: {
    id: 'gpt',
    name: 'GPT',
    role: 'Software Engineering',
    skills: {
      coding: 1.0,
      analysis: 0.7,
      planning: 0.6,
      documentation: 0.5,
      research: 0.4,
    },
    state: 'idle',
    energy: 1.0,
    focus: 1.0,
    currentTaskId: null,
    currentZoneId: 'workstations',
    targetZoneId: null,
    stateElapsedTime: 0,
    completedTaskCount: 0,
    lastDecisionOrigin: 'local',
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    role: 'Data Analysis',
    skills: {
      analysis: 1.0,
      coding: 0.7,
      research: 0.7,
      documentation: 0.5,
      planning: 0.4,
    },
    state: 'idle',
    energy: 0.9,
    focus: 1.0,
    currentTaskId: null,
    currentZoneId: 'coffee',
    targetZoneId: null,
    stateElapsedTime: 0,
    completedTaskCount: 0,
    lastDecisionOrigin: 'local',
  },
};

export const DEFAULT_INITIAL_SEED = 424242;

export function createInitialSimulationState(
  seed: number = DEFAULT_INITIAL_SEED,
  config: SimulationConfig = DEFAULT_SIMULATION_CONFIG
): SimulationState {
  // Clona estruturas para evitar mutações de referências compartilhadas
  const agents: Record<string, AgentSimulationModel> = {};
  for (const [id, agent] of Object.entries(INITIAL_AGENTS)) {
    agents[id] = {
      ...agent,
      skills: { ...agent.skills },
    };
  }

  const tasks: Record<string, TaskModel> = {};
  for (const [id, task] of Object.entries(INITIAL_TASKS)) {
    tasks[id] = {
      ...task,
      dependencies: [...task.dependencies],
    };
  }

  return {
    simulationTime: 0,
    tickCount: 0,
    seed,
    isPaused: false,
    timeScale: 1,
    agents,
    tasks,
    config: { ...config },
  };
}
