/**
 * Motor lógico central e determinístico da simulação do Agent Office Diorama.
 * Totalmente desacoplado de React, Zustand, Three.js, Date.now e Math.random.
 */

import {
  findAvailableCollaborator,
  selectBestEligibleTask,
  updateTaskDependencies,
  validateAgentIntegrity,
} from './decision';
import {
  applyCoffeeRecovery,
  applyThinkingState,
  applyWorkingDrain,
  calculateTaskProductivity,
  clamp,
} from './productivity';
import { RandomSource } from './prng';
import {
  AgentSimulationModel,
  SimulationCommand,
  SimulationConfig,
  SimulationEvent,
  SimulationState,
  SimulationStepResult,
  TaskModel,
} from './types';

/**
 * Configuração padrão recomendada da simulação.
 * Timestep padrão: 250ms (0.25s).
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  fixedTimestepSeconds: 0.25,
  energyDrainRate: 0.02, // Gasta 1.0 de energia em 50s de trabalho contínuo
  focusDrainRate: 0.025,
  energyRecoveryRate: 0.15, // Recupera 0.20 -> 0.95 em ~5 segundos de café
  focusRecoveryRate: 0.12,
  lowEnergyThreshold: 0.2, // Abaixo de 20%, o agente procura a área de café
  recoveredEnergyThreshold: 0.95, // Quando atinge 95%, volta ao trabalho
  thinkingDurationSeconds: 1.5, // 1.5s de reflexão para tarefas complexas
  highComplexityThreshold: 4, // Complexidade >= 4 requer pensamento prévio
  maxCollaborationBonus: 0.25, // Bônus máximo de 25% na velocidade de entrega
  baseWorkRate: 0.08, // Velocidade padrão de entrega por segundo
};

/**
 * Cria um estado inicial completo da simulação.
 */
export function createInitialSimulationState(options: {
  seed: number;
  agents: AgentSimulationModel[];
  tasks?: TaskModel[];
  config?: Partial<SimulationConfig>;
}): SimulationState {
  const mergedConfig: SimulationConfig = {
    ...DEFAULT_SIMULATION_CONFIG,
    ...options.config,
  };

  const agentsRecord: Record<string, AgentSimulationModel> = {};
  for (const agent of options.agents) {
    agentsRecord[agent.id] = {
      ...agent,
      energy: clamp(agent.energy, 0, 1),
      focus: clamp(agent.focus, 0, 1),
      stateElapsedTime: 0,
      completedTaskCount: agent.completedTaskCount ?? 0,
      lastDecisionOrigin: agent.lastDecisionOrigin ?? 'local',
    };
  }

  const tasksRecord: Record<string, TaskModel> = {};
  if (options.tasks) {
    for (const task of options.tasks) {
      tasksRecord[task.id] = {
        ...task,
        progress: clamp(task.progress, 0, 1),
      };
    }
  }

  return {
    simulationTime: 0,
    tickCount: 0,
    seed: options.seed,
    isPaused: false,
    timeScale: 1,
    agents: agentsRecord,
    tasks: tasksRecord,
    config: mergedConfig,
  };
}

/**
 * Executa um passo único da simulação lógica (tick determinístico).
 *
 * Invariantes essenciais:
 * 1. Simulação pausada (isPaused || deltaSeconds <= 0) não altera nenhum estado.
 * 2. Determinismo: para um mesmo previousState, deltaSeconds e randomSource, a saída é 100% idêntica.
 * 3. Nenhuma regra acessa Date.now ou Math.random.
 * 4. Progresso de tarefas é monotônico (nunca retrocede) e limitado em [0, 1].
 * 5. Energia e foco de todos os agentes são limitados estritamente em [0, 1].
 * 6. Falhas e dados inconsistentes colocam o agente em 'error' sem travar a simulação.
 */
export function simulationStep(
  previousState: SimulationState,
  deltaSeconds: number,
  randomSource: RandomSource
): SimulationStepResult {
  // 1. Verificação de Pausa e Delta Inválido
  if (previousState.isPaused || deltaSeconds <= 0) {
    return {
      nextState: previousState,
      events: [],
      commands: [],
    };
  }

  // 2. Cálculo do tempo efetivo respeitando a escala de velocidade (1x, 2x, 4x)
  const timeScale = previousState.timeScale ?? 1;
  const effectiveDelta = deltaSeconds * timeScale;
  const nextSimulationTime = previousState.simulationTime + effectiveDelta;
  const nextTickCount = previousState.tickCount + 1;

  const events: SimulationEvent[] = [];
  const commands: SimulationCommand[] = [];

  // 3. Atualização de dependências de tarefas
  const { updatedTasks: dependencyCheckedTasks, events: depEvents } =
    updateTaskDependencies(previousState.tasks);
  events.push(...depEvents);

  const nextTasks: Record<string, TaskModel> = { ...dependencyCheckedTasks };
  const nextAgents: Record<string, AgentSimulationModel> = {};

  // Cria cópias profundas dos agentes para mutação imutável no próximo estado
  for (const agentId of Object.keys(previousState.agents)) {
    nextAgents[agentId] = { ...previousState.agents[agentId] };
  }

  const { config } = previousState;

  // 4. Processamento individual de cada agente
  for (const agentId of Object.keys(nextAgents)) {
    const agent = nextAgents[agentId];

    // Validação de integridade defensiva (Regra 10: Erros controlados)
    const integrityError = validateAgentIntegrity(agent, nextTasks);
    if (integrityError) {
      if (agent.state !== 'error') {
        agent.state = 'error';
        agent.errorMessage = integrityError;
        events.push({
          type: 'AGENT_ERROR',
          simulationTime: nextSimulationTime,
          agentId: agent.id,
          details: { message: integrityError },
        });
      }
      continue;
    }

    // Incremento do tempo decorrido no estado atual
    agent.stateElapsedTime += effectiveDelta;

    // Garante bounds estritos de energia e foco
    agent.energy = clamp(agent.energy, 0, 1);
    agent.focus = clamp(agent.focus, 0, 1);

    // =========================================================================
    // REGRA 1: AGENTE COM ENERGIA MUITO BAIXA PROCURA A ÁREA DE CAFÉ
    // =========================================================================
    if (
      agent.energy <= config.lowEnergyThreshold &&
      agent.state !== 'coffee' &&
      agent.state !== 'error'
    ) {
      if (agent.currentZoneId === 'coffee') {
        // Já está na área do café: inicia a pausa
        agent.state = 'coffee';
        agent.stateElapsedTime = 0;
        commands.push({
          type: 'START_COFFEE_BREAK',
          agentId: agent.id,
          simulationTime: nextSimulationTime,
        });
        events.push({
          type: 'COFFEE_BREAK_STARTED',
          simulationTime: nextSimulationTime,
          agentId: agent.id,
        });
        continue;
      } else if (agent.state !== 'walking' || agent.targetZoneId !== 'coffee') {
        // Inicia a caminhada até a área de café
        agent.state = 'walking';
        agent.targetZoneId = 'coffee';
        agent.stateElapsedTime = 0;
        commands.push({
          type: 'MOVE_TO_ZONE',
          agentId: agent.id,
          targetZoneId: 'coffee',
          simulationTime: nextSimulationTime,
        });
        events.push({
          type: 'AGENT_STATE_CHANGED',
          simulationTime: nextSimulationTime,
          agentId: agent.id,
          details: { state: 'walking', targetZone: 'coffee' },
        });
        continue;
      }
      // Se já está em 'walking' com targetZoneId === 'coffee', prossegue para o switch(agent.state)
    }

    // =========================================================================
    // MÁQUINA DE ESTADOS DO AGENTE
    // =========================================================================
    switch (agent.state) {
      // -----------------------------------------------------------------------
      // ESTADO: COFFEE (Regras 1 e 9: Recuperação e Retorno)
      // -----------------------------------------------------------------------
      case 'coffee': {
        const { energy, focus } = applyCoffeeRecovery(agent, effectiveDelta, config);
        agent.energy = energy;
        agent.focus = focus;

        // Se atingiu o patamar de energia recuperada, conclui a pausa
        if (agent.energy >= config.recoveredEnergyThreshold) {
          events.push({
            type: 'COFFEE_BREAK_ENDED',
            simulationTime: nextSimulationTime,
            agentId: agent.id,
          });

          // Regra 9: Retorna ao trabalho anterior quando válido
          if (agent.currentTaskId && nextTasks[agent.currentTaskId]) {
            const task = nextTasks[agent.currentTaskId];
            if (task.status !== 'completed' && task.status !== 'cancelled') {
              agent.state = 'walking';
              agent.targetZoneId = 'workstations';
              agent.stateElapsedTime = 0;
              commands.push({
                type: 'MOVE_TO_ZONE',
                agentId: agent.id,
                targetZoneId: 'workstations',
                simulationTime: nextSimulationTime,
              });
              events.push({
                type: 'AGENT_STATE_CHANGED',
                simulationTime: nextSimulationTime,
                agentId: agent.id,
                details: { state: 'walking', targetZone: 'workstations' },
              });
              break;
            }
          }

          // Se não há tarefa anterior válida, fica livre
          agent.state = 'idle';
          agent.currentTaskId = null;
          agent.stateElapsedTime = 0;
          events.push({
            type: 'AGENT_STATE_CHANGED',
            simulationTime: nextSimulationTime,
            agentId: agent.id,
            details: { state: 'idle' },
          });
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: WALKING (Deslocamento entre zonas)
      // -----------------------------------------------------------------------
      case 'walking': {
        // Na simulação pura, a transição para a zona alvo ocorre quando chega (1s de caminhada padrão)
        if (agent.stateElapsedTime >= 1.0 || agent.currentZoneId === agent.targetZoneId) {
          agent.currentZoneId = agent.targetZoneId ?? agent.currentZoneId;
          agent.targetZoneId = null;
          agent.stateElapsedTime = 0;

          if (agent.currentZoneId === 'coffee') {
            agent.state = 'coffee';
            commands.push({
              type: 'START_COFFEE_BREAK',
              agentId: agent.id,
              simulationTime: nextSimulationTime,
            });
            events.push({
              type: 'COFFEE_BREAK_STARTED',
              simulationTime: nextSimulationTime,
              agentId: agent.id,
            });
          } else if (agent.currentTaskId && nextTasks[agent.currentTaskId]) {
            const task = nextTasks[agent.currentTaskId];

            // Regra 6: Agente pode pensar antes de iniciar tarefa complexa
            if (
              task.complexity >= config.highComplexityThreshold &&
              task.progress === 0
            ) {
              agent.state = 'thinking';
              events.push({
                type: 'AGENT_STATE_CHANGED',
                simulationTime: nextSimulationTime,
                agentId: agent.id,
                details: { state: 'thinking', taskId: task.id },
              });
            } else {
              // Inicia o trabalho diretamente
              agent.state = 'working';
              task.status = 'in_progress';
              commands.push({
                type: 'START_WORK',
                agentId: agent.id,
                taskId: task.id,
                simulationTime: nextSimulationTime,
              });
              events.push({
                type: 'TASK_STARTED',
                simulationTime: nextSimulationTime,
                agentId: agent.id,
                taskId: task.id,
              });
            }
          } else {
            agent.state = 'idle';
            events.push({
              type: 'AGENT_STATE_CHANGED',
              simulationTime: nextSimulationTime,
              agentId: agent.id,
              details: { state: 'idle' },
            });
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: THINKING / PLANNING (Regra 6: Reflexão prévia)
      // -----------------------------------------------------------------------
      case 'thinking':
      case 'planning': {
        const { energy, focus } = applyThinkingState(agent, effectiveDelta, config);
        agent.energy = energy;
        agent.focus = focus;

        if (agent.stateElapsedTime >= config.thinkingDurationSeconds) {
          if (agent.currentTaskId && nextTasks[agent.currentTaskId]) {
            const task = nextTasks[agent.currentTaskId];
            agent.state = 'working';
            agent.stateElapsedTime = 0;
            task.status = 'in_progress';
            commands.push({
              type: 'START_WORK',
              agentId: agent.id,
              taskId: task.id,
              simulationTime: nextSimulationTime,
            });
            events.push({
              type: 'TASK_STARTED',
              simulationTime: nextSimulationTime,
              agentId: agent.id,
              taskId: task.id,
            });
          } else {
            agent.state = 'idle';
            agent.stateElapsedTime = 0;
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: WORKING (Regras 3, 7 e 8: Produtividade, Colaboração e Conclusão)
      // -----------------------------------------------------------------------
      case 'working': {
        if (!agent.currentTaskId || !nextTasks[agent.currentTaskId]) {
          agent.state = 'idle';
          agent.currentTaskId = null;
          break;
        }

        const task = nextTasks[agent.currentTaskId];

        // Verifica se há algum colaborador ativo auxiliando nesta tarefa (Regra 7)
        let activeCollaborationBonus = 0;
        let helperAgent: AgentSimulationModel | null = null;

        for (const otherId of Object.keys(nextAgents)) {
          if (otherId === agent.id) continue;
          const other = nextAgents[otherId];
          if (
            other.state === 'collaborating' &&
            other.targetZoneId === agent.currentZoneId
          ) {
            activeCollaborationBonus =
              config.maxCollaborationBonus * (other.skills[task.type] ?? 0.5);
            helperAgent = other;
            break;
          }
        }

        // Calcula a produtividade matemática puramente determinística
        const prod = calculateTaskProductivity({
          agent,
          task,
          deltaSeconds: effectiveDelta,
          config,
          collaborationBonus: activeCollaborationBonus,
        });

        task.progress = prod.newProgress;
        task.status = 'in_progress';

        // Aplica o consumo de energia e foco
        const drained = applyWorkingDrain(agent, effectiveDelta, config);
        agent.energy = drained.energy;
        agent.focus = drained.focus;

        events.push({
          type: 'TASK_PROGRESS',
          simulationTime: nextSimulationTime,
          agentId: agent.id,
          taskId: task.id,
          details: {
            progress: task.progress,
            ratePerSecond: prod.ratePerSecond,
          },
        });

        // =====================================================================
        // REGRA 8: TAREFA COMPLETA
        // =====================================================================
        if (prod.isCompleted) {
          task.progress = 1.0;
          task.status = 'completed';
          task.completedAtSimulationTime = nextSimulationTime;

          agent.completedTaskCount += 1;
          agent.currentTaskId = null;
          agent.state = 'idle';
          agent.stateElapsedTime = 0;

          // Se havia um colaborador ajudando, libera-o
          if (helperAgent && helperAgent.state === 'collaborating') {
            helperAgent.state = 'idle';
            helperAgent.targetZoneId = null;
            helperAgent.stateElapsedTime = 0;
            events.push({
              type: 'COLLABORATION_ENDED',
              simulationTime: nextSimulationTime,
              agentId: helperAgent.id,
              taskId: task.id,
            });
          }

          events.push({
            type: 'TASK_COMPLETED',
            simulationTime: nextSimulationTime,
            agentId: agent.id,
            taskId: task.id,
            details: { title: task.title },
          });

          commands.push({
            type: 'EMIT_MESSAGE',
            agentId: agent.id,
            message: `Tarefa concluída: ${task.title}`,
            simulationTime: nextSimulationTime,
          });
          break;
        }

        // =====================================================================
        // REGRA 7: SOLICITAR COLABORAÇÃO QUANDO ÚTIL
        // =====================================================================
        if (!helperAgent && task.complexity >= 3) {
          const availableHelper = findAvailableCollaborator(agent, task, nextAgents);
          if (availableHelper) {
            availableHelper.state = 'collaborating';
            availableHelper.targetZoneId = agent.currentZoneId;
            availableHelper.stateElapsedTime = 0;

            commands.push({
              type: 'START_COLLABORATION',
              agentId: agent.id,
              targetAgentId: availableHelper.id,
              taskId: task.id,
              simulationTime: nextSimulationTime,
            });

            events.push({
              type: 'COLLABORATION_STARTED',
              simulationTime: nextSimulationTime,
              agentId: agent.id,
              taskId: task.id,
              details: { helperAgentId: availableHelper.id },
            });
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: COLLABORATING (Apoio a outro agente)
      // -----------------------------------------------------------------------
      case 'collaborating': {
        // Drena energia moderadamente
        const drained = applyWorkingDrain(agent, effectiveDelta * 0.5, config);
        agent.energy = drained.energy;
        agent.focus = drained.focus;

        // Se a energia cair abaixo do limiar, interrompe colaboração
        if (agent.energy <= config.lowEnergyThreshold) {
          agent.state = 'idle';
          agent.targetZoneId = null;
          agent.stateElapsedTime = 0;
          events.push({
            type: 'COLLABORATION_ENDED',
            simulationTime: nextSimulationTime,
            agentId: agent.id,
            details: { reason: 'Baixa energia' },
          });
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: IDLE (Regra 4: Alocação de nova tarefa elegível)
      // -----------------------------------------------------------------------
      case 'idle': {
        if (!agent.currentTaskId) {
          const bestTask = selectBestEligibleTask(agent, nextTasks);
          if (bestTask) {
            bestTask.assignedAgentId = agent.id;
            bestTask.status = 'assigned';
            agent.currentTaskId = bestTask.id;

            events.push({
              type: 'TASK_ASSIGNED',
              simulationTime: nextSimulationTime,
              agentId: agent.id,
              taskId: bestTask.id,
            });

            // Regra 2: Agente com tarefa caminha até a estação de trabalho
            if (agent.currentZoneId !== 'workstations') {
              agent.state = 'walking';
              agent.targetZoneId = 'workstations';
              agent.stateElapsedTime = 0;
              commands.push({
                type: 'MOVE_TO_ZONE',
                agentId: agent.id,
                targetZoneId: 'workstations',
                simulationTime: nextSimulationTime,
              });
              events.push({
                type: 'AGENT_STATE_CHANGED',
                simulationTime: nextSimulationTime,
                agentId: agent.id,
                details: { state: 'walking', targetZone: 'workstations' },
              });
            } else {
              // Já está na estação de trabalho
              if (
                bestTask.complexity >= config.highComplexityThreshold &&
                bestTask.progress === 0
              ) {
                agent.state = 'thinking';
                agent.stateElapsedTime = 0;
                events.push({
                  type: 'AGENT_STATE_CHANGED',
                  simulationTime: nextSimulationTime,
                  agentId: agent.id,
                  details: { state: 'thinking', taskId: bestTask.id },
                });
              } else {
                agent.state = 'working';
                agent.stateElapsedTime = 0;
                bestTask.status = 'in_progress';
                commands.push({
                  type: 'START_WORK',
                  agentId: agent.id,
                  taskId: bestTask.id,
                  simulationTime: nextSimulationTime,
                });
                events.push({
                  type: 'TASK_STARTED',
                  simulationTime: nextSimulationTime,
                  agentId: agent.id,
                  taskId: bestTask.id,
                });
              }
            }
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // ESTADO: ERROR (Regra 10: Estado controlado)
      // -----------------------------------------------------------------------
      case 'error': {
        // Agente permanece em erro controlado sem alterar outras entidades
        break;
      }

      default:
        break;
    }
  }

  const nextState: SimulationState = {
    ...previousState,
    simulationTime: nextSimulationTime,
    tickCount: nextTickCount,
    agents: nextAgents,
    tasks: nextTasks,
  };

  return {
    nextState,
    events,
    commands,
  };
}
