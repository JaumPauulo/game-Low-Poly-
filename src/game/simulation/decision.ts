/**
 * Regras locais de tomada de decisão e transição de estado da simulação.
 * Desacopladas de qualquer biblioteca externa ou renderizador.
 */

import { clamp } from './productivity';
import {
  AgentSimulationModel,
  SimulationCommand,
  SimulationConfig,
  SimulationEvent,
  TaskModel,
} from './types';

export interface DecisionContext {
  simulationTime: number;
  deltaSeconds: number;
  config: SimulationConfig;
  agents: Record<string, AgentSimulationModel>;
  tasks: Record<string, TaskModel>;
}

export interface AgentDecisionResult {
  updatedAgent: AgentSimulationModel;
  updatedTask?: TaskModel;
  events: SimulationEvent[];
  commands: SimulationCommand[];
}

/**
 * Atualiza o status de dependências de todas as tarefas.
 * Se uma tarefa em backlog possui dependências incompletas, marca como 'blocked'.
 * Se uma tarefa bloqueada teve todas as dependências concluídas, desbloqueia para 'backlog'.
 */
export function updateTaskDependencies(tasks: Record<string, TaskModel>): {
  updatedTasks: Record<string, TaskModel>;
  events: SimulationEvent[];
} {
  const updatedTasks: Record<string, TaskModel> = {};
  const events: SimulationEvent[] = [];

  for (const taskId of Object.keys(tasks)) {
    const task = { ...tasks[taskId] };
    if (task.status === 'completed' || task.status === 'cancelled') {
      updatedTasks[taskId] = task;
      continue;
    }

    if (task.dependencies.length > 0) {
      const hasUnfinishedDependency = task.dependencies.some((depId) => {
        const dep = tasks[depId];
        return !dep || dep.status !== 'completed';
      });

      if (hasUnfinishedDependency && task.status !== 'blocked') {
        task.status = 'blocked';
        events.push({
          type: 'TASK_BLOCKED',
          simulationTime: 0,
          taskId: task.id,
          details: { reason: 'Dependências pendentes' },
        });
      } else if (!hasUnfinishedDependency && task.status === 'blocked') {
        task.status = task.assignedAgentId ? 'assigned' : 'backlog';
      }
    }

    updatedTasks[taskId] = task;
  }

  return { updatedTasks, events };
}

/**
 * Seleciona a melhor tarefa elegível para um agente livre.
 * Elegibilidade: status 'backlog', sem agente atribuído e todas as dependências concluídas.
 * Critérios de desempate:
 * 1. Maior prioridade (5 > 4 > 3 > 2 > 1)
 * 2. Maior afinidade de skill do agente
 * 3. Menor ID alfanumérico para determinismo absoluto
 */
export function selectBestEligibleTask(
  agent: AgentSimulationModel,
  tasks: Record<string, TaskModel>
): TaskModel | null {
  const eligibleTasks: TaskModel[] = [];

  for (const taskId of Object.keys(tasks)) {
    const task = tasks[taskId];
    if (task.status !== 'backlog' || task.assignedAgentId !== null) {
      continue;
    }

    // Verifica dependências
    const allDepsCompleted = task.dependencies.every((depId) => {
      const dep = tasks[depId];
      return dep && dep.status === 'completed';
    });

    if (allDepsCompleted) {
      eligibleTasks.push(task);
    }
  }

  if (eligibleTasks.length === 0) {
    return null;
  }

  eligibleTasks.sort((a, b) => {
    // 1. Prioridade (maior primeiro)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    // 2. Afinidade com skill
    const affinityA = agent.skills[a.type] ?? 0;
    const affinityB = agent.skills[b.type] ?? 0;
    if (affinityB !== affinityA) {
      return affinityB - affinityA;
    }

    // 3. Determinismo por ID
    return a.id.localeCompare(b.id);
  });

  return eligibleTasks[0];
}

/**
 * Encontra um colaborador elegível para auxiliar em uma tarefa de alta complexidade.
 */
export function findAvailableCollaborator(
  initiator: AgentSimulationModel,
  task: TaskModel,
  allAgents: Record<string, AgentSimulationModel>
): AgentSimulationModel | null {
  if (task.complexity < 3) {
    return null;
  }

  const candidates: AgentSimulationModel[] = [];

  for (const agentId of Object.keys(allAgents)) {
    if (agentId === initiator.id) continue;
    const other = allAgents[agentId];

    // Deve estar idle, com energia razoável e sem tarefa
    if (
      other.state === 'idle' &&
      other.currentTaskId === null &&
      other.energy >= 0.4 &&
      other.skills[task.type] >= 0.3
    ) {
      candidates.push(other);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Escolhe o de maior afinidade com a skill necessária
  candidates.sort((a, b) => {
    const affA = a.skills[task.type] ?? 0;
    const affB = b.skills[task.type] ?? 0;
    if (affB !== affA) return affB - affA;
    return a.id.localeCompare(b.id);
  });

  return candidates[0];
}

/**
 * Valida integridade básica do modelo do agente para evitar falhas silenciosas.
 */
export function validateAgentIntegrity(
  agent: AgentSimulationModel,
  tasks: Record<string, TaskModel>
): string | null {
  if (!agent.id || !agent.name) {
    return 'Agente com identificador ou nome inválido';
  }
  if (Number.isNaN(agent.energy) || Number.isNaN(agent.focus)) {
    return 'Agente com valores de energia ou foco corrompidos (NaN)';
  }
  if (agent.currentTaskId && !tasks[agent.currentTaskId]) {
    return `Agente aponta para tarefa inexistente: ${agent.currentTaskId}`;
  }
  return null;
}
