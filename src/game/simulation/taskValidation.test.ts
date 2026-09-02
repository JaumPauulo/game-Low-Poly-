import { describe, expect, it } from 'vitest';
import {
  detectCircularDependency,
  determineTaskStatus,
  getUnfinishedDependencies,
  validateTaskInput,
} from './taskValidation';
import { TaskModel } from './types';

describe('taskValidation', () => {
  const mockTasks: Record<string, TaskModel> = {
    'task-a': {
      id: 'task-a',
      title: 'Tarefa A',
      type: 'coding',
      priority: 3,
      complexity: 2,
      status: 'completed',
      progress: 1,
      assignedAgentId: 'alex',
      dependencies: [],
      createdAtSimulationTime: 0,
      completedAtSimulationTime: 10,
    },
    'task-b': {
      id: 'task-b',
      title: 'Tarefa B',
      type: 'planning',
      priority: 4,
      complexity: 3,
      status: 'in_progress',
      progress: 0.5,
      assignedAgentId: 'bea',
      dependencies: ['task-a'],
      createdAtSimulationTime: 0,
      completedAtSimulationTime: null,
    },
    'task-c': {
      id: 'task-c',
      title: 'Tarefa C',
      type: 'research',
      priority: 2,
      complexity: 4,
      status: 'blocked',
      progress: 0,
      assignedAgentId: null,
      dependencies: ['task-b'],
      createdAtSimulationTime: 0,
      completedAtSimulationTime: null,
    },
  };

  const validAgentIds = ['alex', 'bea', 'carlos', 'dani'];

  describe('detectCircularDependency', () => {
    it('detecta auto-dependência imediata', () => {
      const result = detectCircularDependency('task-b', ['task-b'], mockTasks);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['task-b', 'task-b']);
    });

    it('detecta ciclo direto de 2 nós: B depende de C e C depende de B', () => {
      // mockTasks: task-c já depende de task-b. Se task-b depender de task-c -> ciclo!
      const result = detectCircularDependency('task-b', ['task-c'], mockTasks);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toContain('task-b');
      expect(result.cyclePath).toContain('task-c');
    });

    it('detecta ciclo indireto de 3 nós: A -> B -> C -> A', () => {
      // task-c depende de task-b. task-b depende de task-a.
      // Se task-a depender de task-c -> ciclo task-a -> task-c -> task-b -> task-a
      const result = detectCircularDependency('task-a', ['task-c'], mockTasks);
      expect(result.hasCycle).toBe(true);
      expect(result.cyclePath).toEqual(['task-a', 'task-c', 'task-b', 'task-a']);
    });

    it('permite grafo acíclico (DAG) sem ciclos', () => {
      // Nova tarefa que depende de task-a e task-b
      const result = detectCircularDependency('task-d', ['task-a', 'task-b'], mockTasks);
      expect(result.hasCycle).toBe(false);
    });

    it('permite estrutura em diamante (A -> B, A -> C, B -> D, C -> D)', () => {
      const diamondTasks: Record<string, TaskModel> = {
        'task-root': {
          id: 'task-root',
          title: 'Root',
          type: 'planning',
          priority: 5,
          complexity: 1,
          status: 'completed',
          progress: 1,
          assignedAgentId: null,
          dependencies: [],
          createdAtSimulationTime: 0,
          completedAtSimulationTime: 10,
        },
        'task-left': {
          id: 'task-left',
          title: 'Left',
          type: 'coding',
          priority: 4,
          complexity: 2,
          status: 'completed',
          progress: 1,
          assignedAgentId: null,
          dependencies: ['task-root'],
          createdAtSimulationTime: 0,
          completedAtSimulationTime: 20,
        },
        'task-right': {
          id: 'task-right',
          title: 'Right',
          type: 'research',
          priority: 4,
          complexity: 2,
          status: 'completed',
          progress: 1,
          assignedAgentId: null,
          dependencies: ['task-root'],
          createdAtSimulationTime: 0,
          completedAtSimulationTime: 20,
        },
      };

      // task-join depende de left e right
      const result = detectCircularDependency('task-join', ['task-left', 'task-right'], diamondTasks);
      expect(result.hasCycle).toBe(false);
    });
  });

  describe('validateTaskInput', () => {
    it('rejeita título vazio ou apenas com espaços', () => {
      const res1 = validateTaskInput(
        { title: '', type: 'coding', priority: 3, complexity: 2 },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res1.isValid).toBe(false);
      expect(res1.errors.title).toBeDefined();

      const res2 = validateTaskInput(
        { title: '   ', type: 'coding', priority: 3, complexity: 2 },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res2.isValid).toBe(false);
      expect(res2.errors.title).toBeDefined();
    });

    it('rejeita prioridade fora da faixa de 1 a 5', () => {
      const res0 = validateTaskInput(
        { title: 'Título Válido', type: 'coding', priority: 0, complexity: 3 },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res0.isValid).toBe(false);
      expect(res0.errors.priority).toBeDefined();

      const res6 = validateTaskInput(
        { title: 'Título Válido', type: 'coding', priority: 6, complexity: 3 },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res6.isValid).toBe(false);
      expect(res6.errors.priority).toBeDefined();
    });

    it('rejeita complexidade fora da faixa de 1 a 5', () => {
      const res = validateTaskInput(
        { title: 'Título Válido', type: 'coding', priority: 3, complexity: 7 },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.complexity).toBeDefined();
    });

    it('rejeita agente atribuído inexistente', () => {
      const res = validateTaskInput(
        { title: 'Título Válido', type: 'coding', priority: 3, complexity: 2, assignedAgentId: 'agente_fantasma' },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.assignedAgentId).toContain('agente_fantasma');
    });

    it('rejeita edição de tarefa que já foi concluída', () => {
      const res = validateTaskInput(
        { title: 'Título Editado', type: 'coding', priority: 3, complexity: 2 },
        { taskId: 'task-a', allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.general).toContain('já concluídas');
    });

    it('rejeita auto-dependência na edição', () => {
      const res = validateTaskInput(
        { title: 'Título B', type: 'planning', priority: 4, complexity: 3, dependencies: ['task-b'] },
        { taskId: 'task-b', allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.dependencies).toContain('não pode depender de si mesma');
    });

    it('rejeita dependência circular na edição', () => {
      // task-c já depende de task-b. Se editarmos task-b para depender de task-c:
      const res = validateTaskInput(
        { title: 'Título B', type: 'planning', priority: 4, complexity: 3, dependencies: ['task-c'] },
        { taskId: 'task-b', allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.dependencies).toContain('Dependência circular');
    });

    it('rejeita dependência que não existe no dicionário', () => {
      const res = validateTaskInput(
        { title: 'Nova Tarefa', type: 'research', priority: 3, complexity: 2, dependencies: ['inexistente'] },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(false);
      expect(res.errors.dependencies).toContain('não existe');
    });

    it('aceita entrada válida para nova tarefa', () => {
      const res = validateTaskInput(
        {
          title: 'Nova Tarefa Válida',
          type: 'documentation',
          priority: 5,
          complexity: 1,
          dependencies: ['task-a'],
          assignedAgentId: 'alex',
        },
        { allTasks: mockTasks, validAgentIds }
      );
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });
  });

  describe('getUnfinishedDependencies e determineTaskStatus', () => {
    it('retorna dependências não concluídas para tarefas bloqueadas', () => {
      const unfinished = getUnfinishedDependencies(mockTasks['task-c'], mockTasks);
      expect(unfinished.length).toBe(1);
      expect(unfinished[0].id).toBe('task-b');
    });

    it('retorna lista vazia se todas as dependências estiverem concluídas', () => {
      const unfinished = getUnfinishedDependencies(mockTasks['task-b'], mockTasks);
      // task-b depende de task-a que está completed!
      expect(unfinished.length).toBe(0);
    });

    it('calcula status blocked se tiver dependência não concluída', () => {
      const status = determineTaskStatus(['task-b'], null, mockTasks);
      expect(status).toBe('blocked');
    });

    it('calcula status assigned se tiver agente e todas dependências concluídas', () => {
      const status = determineTaskStatus(['task-a'], 'dani', mockTasks);
      expect(status).toBe('assigned');
    });

    it('calcula status backlog se sem agente e todas dependências concluídas', () => {
      const status = determineTaskStatus(['task-a'], null, mockTasks);
      expect(status).toBe('backlog');
    });
  });
});
