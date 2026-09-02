/**
 * Funções puras matemáticas do cálculo de produtividade, progresso e fadiga dos agentes.
 * Desacopladas de qualquer dependência visual ou de framework.
 */

import { AgentSimulationModel, SimulationConfig, TaskModel } from './types';

/**
 * Garante que um valor numérico permaneça estritamente entre min e max.
 * Trata entradas inválidas (NaN, Infinity) retornando o fallback seguro.
 */
export function clamp(value: number, min: number, max: number, fallback = min): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Calcula o multiplicador de afinidade da habilidade do agente com o tipo da tarefa.
 * Varia linearmente de 0.5 (sem afinidade) a 1.0 (afinidade máxima).
 */
export function calculateSkillFactor(affinity: number): number {
  const safeAffinity = clamp(affinity, 0, 1);
  return 0.5 + safeAffinity * 0.5;
}

/**
 * Calcula o multiplicador inverso da complexidade da tarefa (1 a 5).
 * Complexidade maior reduz proporcionalmente a velocidade de conclusão.
 */
export function calculateComplexityFactor(complexity: number): number {
  const safeComplexity = clamp(Math.round(complexity), 1, 5);
  // Complexidade 1 -> 1.0; Complexidade 5 -> 0.333
  return 1.0 / (1.0 + (safeComplexity - 1) * 0.5);
}

/**
 * Calcula o fator de energia do agente.
 * Se energia < 0.20 (lowEnergyThreshold), há uma queda drástica na produtividade.
 */
export function calculateEnergyFactor(energy: number, lowThreshold = 0.2): number {
  const safeEnergy = clamp(energy, 0, 1);
  if (safeEnergy <= 0) {
    return 0;
  }
  if (safeEnergy < lowThreshold) {
    // Decaimento quadrático abaixo do limiar de fadiga
    const ratio = safeEnergy / lowThreshold;
    return ratio * ratio * 0.3;
  }
  // Escala linear suave entre lowThreshold (0.3) e 1.0 (1.0)
  const ratio = (safeEnergy - lowThreshold) / (1 - lowThreshold);
  return 0.3 + 0.7 * ratio;
}

/**
 * Calcula o fator de foco do agente.
 * Varia de 0.40 a 1.00.
 */
export function calculateFocusFactor(focus: number): number {
  const safeFocus = clamp(focus, 0, 1);
  return 0.4 + 0.6 * safeFocus;
}

/**
 * Calcula o multiplicador de colaboração, garantindo um teto rígido inviolável.
 */
export function calculateCollaborationMultiplier(
  bonus: number,
  maxBonus = 0.25
): number {
  const cappedBonus = clamp(bonus, 0, maxBonus);
  return 1.0 + cappedBonus;
}

export interface ProductivityInput {
  agent: AgentSimulationModel;
  task: TaskModel;
  deltaSeconds: number;
  config: SimulationConfig;
  collaborationBonus?: number;
}

export interface ProductivityOutput {
  ratePerSecond: number;
  deltaProgress: number;
  newProgress: number;
  isCompleted: boolean;
}

/**
 * Calcula o progresso incremental de uma tarefa com base nos fatores do agente e da tarefa.
 *
 * Invariantes rigorosas:
 * 1. O progresso nunca diminui (deltaProgress >= 0).
 * 2. O progresso final permanece estritamente no intervalo [0, 1].
 * 3. Tarefas de maior complexidade avançam mais lentamente para as mesmas condições.
 * 4. Agentes com maior afinidade avançam mais rápido.
 * 5. Baixa energia reduz drasticamente a produtividade.
 * 6. O bônus de colaboração é estritamente limitado ao teto configurado.
 */
export function calculateTaskProductivity(input: ProductivityInput): ProductivityOutput {
  const { agent, task, deltaSeconds, config, collaborationBonus = 0 } = input;

  if (deltaSeconds <= 0 || task.status === 'completed' || task.status === 'cancelled') {
    return {
      ratePerSecond: 0,
      deltaProgress: 0,
      newProgress: clamp(task.progress, 0, 1),
      isCompleted: task.progress >= 1,
    };
  }

  // 1. Afinidade com o tipo de tarefa
  const affinity = agent.skills[task.type] ?? 0;
  const skillFactor = calculateSkillFactor(affinity);

  // 2. Complexidade
  const complexityFactor = calculateComplexityFactor(task.complexity);

  // 3. Nível de energia
  const energyFactor = calculateEnergyFactor(agent.energy, config.lowEnergyThreshold);

  // 4. Nível de foco
  const focusFactor = calculateFocusFactor(agent.focus);

  // 5. Bônus de colaboração limitado
  const collabMultiplier = calculateCollaborationMultiplier(
    collaborationBonus,
    config.maxCollaborationBonus
  );

  // Taxa instantânea de progresso por segundo
  const ratePerSecond =
    config.baseWorkRate *
    skillFactor *
    complexityFactor *
    energyFactor *
    focusFactor *
    collabMultiplier;

  // Acréscimo proporcional ao tempo decorrido
  const safeDelta = Math.max(0, deltaSeconds);
  const deltaProgress = ratePerSecond * safeDelta;

  // Novo progresso estritamente limitado entre o progresso atual e 1.0
  const currentProgress = clamp(task.progress, 0, 1);
  const newProgress = clamp(currentProgress + deltaProgress, 0, 1);

  return {
    ratePerSecond,
    deltaProgress,
    newProgress,
    isCompleted: newProgress >= 1,
  };
}

/**
 * Atualiza o consumo de energia e foco de um agente durante o trabalho ativo.
 */
export function applyWorkingDrain(
  agent: AgentSimulationModel,
  deltaSeconds: number,
  config: SimulationConfig
): { energy: number; focus: number } {
  const safeDelta = Math.max(0, deltaSeconds);
  const newEnergy = clamp(agent.energy - config.energyDrainRate * safeDelta, 0, 1);
  const newFocus = clamp(agent.focus - config.focusDrainRate * safeDelta, 0, 1);
  return { energy: newEnergy, focus: newFocus };
}

/**
 * Atualiza a recuperação de energia e foco de um agente durante a pausa de café.
 */
export function applyCoffeeRecovery(
  agent: AgentSimulationModel,
  deltaSeconds: number,
  config: SimulationConfig
): { energy: number; focus: number } {
  const safeDelta = Math.max(0, deltaSeconds);
  const newEnergy = clamp(agent.energy + config.energyRecoveryRate * safeDelta, 0, 1);
  const newFocus = clamp(agent.focus + config.focusRecoveryRate * safeDelta, 0, 1);
  return { energy: newEnergy, focus: newFocus };
}

/**
 * Atualiza os parâmetros durante reflexão/planejamento mental.
 */
export function applyThinkingState(
  agent: AgentSimulationModel,
  deltaSeconds: number,
  config: SimulationConfig
): { energy: number; focus: number } {
  const safeDelta = Math.max(0, deltaSeconds);
  // Recupera foco e consome energia de forma desprezível
  const newFocus = clamp(agent.focus + (config.focusRecoveryRate * 0.5) * safeDelta, 0, 1);
  const newEnergy = clamp(agent.energy - (config.energyDrainRate * 0.1) * safeDelta, 0, 1);
  return { energy: newEnergy, focus: newFocus };
}
