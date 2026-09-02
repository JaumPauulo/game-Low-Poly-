/**
 * Validação de integridade e detecção de dependências cíclicas para tarefas do simulador.
 * Totalmente desacoplado de bibliotecas externas e frameworks de UI.
 */

import { SkillType, TaskModel } from './types';

export interface TaskInputData {
  title: string;
  type: SkillType;
  priority: number;
  complexity: number;
  dependencies?: string[];
  assignedAgentId?: string | null;
}

export interface TaskValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    type?: string;
    priority?: string;
    complexity?: string;
    dependencies?: string;
    assignedAgentId?: string;
    general?: string;
  };
}

/**
 * Detecta se a adição de `newDependencies` para `targetTaskId` criaria um ciclo de dependência.
 *
 * Utiliza busca em profundidade (DFS) com rastreamento de nós visitados no grafo direcionado
 * de dependências de tarefas.
 *
 * Um ciclo é detectado se:
 * 1. targetTaskId está contido diretamente em newDependencies (auto-dependência).
 * 2. É possível alcançar targetTaskId a partir de qualquer dependência informada.
 *
 * @param targetTaskId ID da tarefa que está sendo criada ou editada
 * @param newDependencies Lista de IDs de tarefas das quais targetTaskId dependerá
 * @param allTasks Dicionário de todas as tarefas existentes na simulação
 * @returns { hasCycle: boolean; cyclePath?: string[] }
 */
export function detectCircularDependency(
  targetTaskId: string,
  newDependencies: string[],
  allTasks: Record<string, TaskModel>
): { hasCycle: boolean; cyclePath?: string[] } {
  // 1. Auto-dependência direta
  if (newDependencies.includes(targetTaskId)) {
    return {
      hasCycle: true,
      cyclePath: [targetTaskId, targetTaskId],
    };
  }

  // 2. DFS para detectar se targetTaskId é alcançável a partir de qualquer depId
  for (const depId of newDependencies) {
    const visited = new Set<string>();
    const path: string[] = [targetTaskId, depId];

    function dfs(currentId: string): boolean {
      if (currentId === targetTaskId) {
        return true;
      }
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      const task = allTasks[currentId];
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        return false;
      }

      for (const nextDepId of task.dependencies) {
        path.push(nextDepId);
        if (dfs(nextDepId)) {
          return true;
        }
        path.pop();
      }

      return false;
    }

    if (dfs(depId)) {
      return {
        hasCycle: true,
        cyclePath: path,
      };
    }
  }

  return { hasCycle: false };
}

/**
 * Valida a criação de uma nova tarefa ou edição de tarefa existente.
 *
 * Regras:
 * - Título não pode ser vazio (após trim)
 * - Tipo deve ser uma das skills válidas
 * - Prioridade deve ser um inteiro entre 1 e 5
 * - Complexidade deve ser um inteiro entre 1 e 5
 * - Agente atribuído (se informado) deve existir no conjunto de agentes válidos
 * - Tarefa concluída não pode ser editada
 * - Tarefa não pode depender de si mesma
 * - Não pode introduzir dependência circular no grafo
 * - Dependências devem referenciar tarefas existentes
 */
export function validateTaskInput(
  input: TaskInputData,
  options: {
    taskId?: string; // Se fornecido, trata-se de edição; se omitido, criação
    allTasks: Record<string, TaskModel>;
    validAgentIds: string[];
  }
): TaskValidationResult {
  const { taskId, allTasks, validAgentIds } = options;
  const errors: TaskValidationResult['errors'] = {};

  // 1. Validação de tarefa concluída sendo editada
  if (taskId && allTasks[taskId]) {
    const existingTask = allTasks[taskId];
    if (existingTask.status === 'completed') {
      errors.general = 'Tarefas já concluídas não podem ser editadas.';
      return { isValid: false, errors };
    }
  }

  // 2. Validação de título obrigatório
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    errors.title = 'O título da tarefa é obrigatório.';
  } else if (input.title.trim().length > 120) {
    errors.title = 'O título não pode exceder 120 caracteres.';
  }

  // 3. Validação de tipo de tarefa
  const validTypes: SkillType[] = ['coding', 'research', 'analysis', 'planning', 'documentation'];
  if (!input.type || !validTypes.includes(input.type)) {
    errors.type = 'Selecione um tipo de tarefa válido.';
  }

  // 4. Validação de prioridade (1 a 5)
  if (
    typeof input.priority !== 'number' ||
    !Number.isInteger(input.priority) ||
    input.priority < 1 ||
    input.priority > 5
  ) {
    errors.priority = 'A prioridade deve ser um número inteiro de 1 a 5.';
  }

  // 5. Validação de complexidade (1 a 5)
  if (
    typeof input.complexity !== 'number' ||
    !Number.isInteger(input.complexity) ||
    input.complexity < 1 ||
    input.complexity > 5
  ) {
    errors.complexity = 'A complexidade deve ser um número inteiro de 1 a 5.';
  }

  // 6. Validação do agente atribuído
  if (input.assignedAgentId !== null && input.assignedAgentId !== undefined && input.assignedAgentId !== '') {
    if (!validAgentIds.includes(input.assignedAgentId)) {
      errors.assignedAgentId = `O agente "${input.assignedAgentId}" não existe no escritório.`;
    }
  }

  // 7. Validação de dependências
  const dependencies = input.dependencies ?? [];
  const currentTaskId = taskId ?? '__new_task__';

  if (dependencies.length > 0) {
    // 7.1 Auto-dependência
    if (taskId && dependencies.includes(taskId)) {
      errors.dependencies = 'Uma tarefa não pode depender de si mesma.';
    }

    // 7.2 Existência de dependências
    for (const depId of dependencies) {
      if (!allTasks[depId]) {
        errors.dependencies = `A dependência "${depId}" não existe.`;
        break;
      }
    }

    // 7.3 Dependência circular
    if (!errors.dependencies && taskId) {
      const cycleCheck = detectCircularDependency(currentTaskId, dependencies, allTasks);
      if (cycleCheck.hasCycle) {
        const pathStr = cycleCheck.cyclePath ? cycleCheck.cyclePath.join(' → ') : '';
        errors.dependencies = `Dependência circular detectada: ${pathStr}`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Retorna as dependências não concluídas de uma tarefa para feedback claro na interface.
 */
export function getUnfinishedDependencies(
  task: TaskModel,
  allTasks: Record<string, TaskModel>
): TaskModel[] {
  if (!task.dependencies || task.dependencies.length === 0) {
    return [];
  }

  return task.dependencies
    .map((depId) => allTasks[depId])
    .filter((dep): dep is TaskModel => dep !== undefined && dep.status !== 'completed');
}

/**
 * Calcula o status inicial apropriado para uma tarefa com base em suas dependências e agente alocado.
 */
export function determineTaskStatus(
  dependencies: string[],
  assignedAgentId: string | null | undefined,
  allTasks: Record<string, TaskModel>
): 'blocked' | 'assigned' | 'backlog' {
  const hasUnfinishedDep = dependencies.some((depId) => {
    const dep = allTasks[depId];
    return !dep || dep.status !== 'completed';
  });

  if (hasUnfinishedDep) {
    return 'blocked';
  }

  if (assignedAgentId) {
    return 'assigned';
  }

  return 'backlog';
}
