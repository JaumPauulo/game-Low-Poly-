/**
 * Tipos e contratos estritos do motor lógico e determinístico da simulação.
 * Desacoplado de React, Zustand e Three.js.
 */

export type SkillType =
  | 'coding'
  | 'research'
  | 'analysis'
  | 'planning'
  | 'documentation';

export type AgentSimulationState =
  | 'idle'
  | 'planning'
  | 'walking'
  | 'working'
  | 'thinking'
  | 'collaborating'
  | 'coffee'
  | 'talking'
  | 'error';

export type AgentState = AgentSimulationState;

export type TaskStatus =
  | 'backlog'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export interface AgentSimulationModel {
  id: string;
  name: string;
  role: string;
  skills: Record<SkillType, number>;
  state: AgentSimulationState;
  energy: number; // [0, 1]
  focus: number; // [0, 1]
  currentTaskId: string | null;
  currentZoneId: string;
  targetZoneId: string | null;
  stateElapsedTime: number;
  completedTaskCount: number;
  errorMessage?: string | null;
  lastDecisionOrigin?: 'local' | 'ai';
}

export interface TaskModel {
  id: string;
  title: string;
  type: SkillType;
  priority: number; // 1 a 5
  complexity: number; // 1 a 5
  status: TaskStatus;
  progress: number; // [0, 1]
  assignedAgentId: string | null;
  dependencies: string[];
  createdAtSimulationTime: number;
  completedAtSimulationTime: number | null;
}

export interface SimulationConfig {
  /** Timestep fixo padrão em segundos (ex: 0.25 = 250ms) */
  fixedTimestepSeconds: number;
  /** Taxa de consumo de energia por segundo durante trabalho ativo */
  energyDrainRate: number;
  /** Taxa de consumo de foco por segundo durante trabalho ativo */
  focusDrainRate: number;
  /** Taxa de recuperação de energia por segundo na pausa para café */
  energyRecoveryRate: number;
  /** Taxa de recuperação de foco por segundo na pausa para café */
  focusRecoveryRate: number;
  /** Limite inferior de energia para disparar pausa de café */
  lowEnergyThreshold: number;
  /** Limite de energia recuperada para encerrar a pausa de café */
  recoveredEnergyThreshold: number;
  /** Duração da reflexão/planejamento antes de tarefas complexas (em segundos) */
  thinkingDurationSeconds: number;
  /** Complexidade mínima para exigir reflexão prévia */
  highComplexityThreshold: number;
  /** Bônus máximo de produtividade por colaboração */
  maxCollaborationBonus: number;
  /** Velocidade base de trabalho por segundo */
  baseWorkRate: number;
}

export interface SimulationState {
  simulationTime: number;
  tickCount: number;
  seed: number;
  isPaused: boolean;
  timeScale: 1 | 2 | 4;
  agents: Record<string, AgentSimulationModel>;
  tasks: Record<string, TaskModel>;
  config: SimulationConfig;
}

export type SimulationCommandType =
  | 'MOVE_TO_ZONE'
  | 'START_WORK'
  | 'START_COFFEE_BREAK'
  | 'START_COLLABORATION'
  | 'EMIT_MESSAGE';

export interface BaseSimulationCommand {
  type: SimulationCommandType;
  agentId: string;
  simulationTime: number;
}

export interface MoveToZoneCommand extends BaseSimulationCommand {
  type: 'MOVE_TO_ZONE';
  targetZoneId: string;
}

export interface StartWorkCommand extends BaseSimulationCommand {
  type: 'START_WORK';
  taskId: string;
}

export interface StartCoffeeBreakCommand extends BaseSimulationCommand {
  type: 'START_COFFEE_BREAK';
}

export interface StartCollaborationCommand extends BaseSimulationCommand {
  type: 'START_COLLABORATION';
  targetAgentId: string;
  taskId: string;
}

export interface EmitMessageCommand extends BaseSimulationCommand {
  type: 'EMIT_MESSAGE';
  message: string;
}

export type SimulationCommand =
  | MoveToZoneCommand
  | StartWorkCommand
  | StartCoffeeBreakCommand
  | StartCollaborationCommand
  | EmitMessageCommand;

export type SimulationEventType =
  | 'SIMULATION_TICK'
  | 'AGENT_STATE_CHANGED'
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_PROGRESS'
  | 'TASK_COMPLETED'
  | 'TASK_BLOCKED'
  | 'COFFEE_BREAK_STARTED'
  | 'COFFEE_BREAK_ENDED'
  | 'COLLABORATION_STARTED'
  | 'COLLABORATION_ENDED'
  | 'AGENT_ERROR';

export interface SimulationEvent {
  type: SimulationEventType;
  simulationTime: number;
  agentId?: string;
  targetAgentId?: string;
  taskId?: string;
  details?: Record<string, unknown>;
}

export interface SimulationStepResult {
  nextState: SimulationState;
  events: SimulationEvent[];
  commands: SimulationCommand[];
}
