import { beforeEach, describe, expect, it } from 'vitest';
import { rawSimulationStore } from './simulationStore';

describe('simulationStore - Task Management & Team Messages', () => {
  beforeEach(() => {
    rawSimulationStore.getState().resetScenario(42);
  });

  it('permite criar uma nova tarefa com validação estrita e atualiza o estado imediatamente', () => {
    const store = rawSimulationStore.getState();

    const result = store.createTask({
      title: 'Setup de CI/CD e Pipelines',
      type: 'coding',
      priority: 4,
      complexity: 3,
      dependencies: ['task-arch'],
      assignedAgentId: 'gpt',
    });

    expect(result.success).toBe(true);
    expect(result.taskId).toBeDefined();

    const updatedState = rawSimulationStore.getState().state;
    const newTask = updatedState.tasks[result.taskId!];
    expect(newTask).toBeDefined();
    expect(newTask.title).toBe('Setup de CI/CD e Pipelines');
    expect(newTask.assignedAgentId).toBe('gpt');
    // task-arch não está concluída no início, logo o status deve ser 'blocked'
    expect(newTask.status).toBe('blocked');

    // Verifica que a mensagem de criação foi gerada
    const messages = rawSimulationStore.getState().teamMessages;
    expect(messages.some((m) => m.text.includes('Setup de CI/CD'))).toBe(true);
  });

  it('rejeita criação com título vazio ou campos inválidos', () => {
    const store = rawSimulationStore.getState();

    const result = store.createTask({
      title: '   ',
      type: 'coding',
      priority: 4,
      complexity: 3,
    });

    expect(result.success).toBe(false);
    expect(result.errors?.title).toBeDefined();
  });

  it('permite atualizar e atribuir agente a uma tarefa', () => {
    const store = rawSimulationStore.getState();

    // Atribui claude para task-perf
    const assignResult = store.assignTask('task-perf', 'claude');
    expect(assignResult.success).toBe(true);

    const task = rawSimulationStore.getState().state.tasks['task-perf'];
    expect(task.assignedAgentId).toBe('claude');
    expect(task.status).toBe('assigned');
  });

  it('impede a edição de tarefas concluídas', () => {
    const store = rawSimulationStore.getState();

    // Força conclusão de uma tarefa para o teste
    const currentState = rawSimulationStore.getState().state;
    currentState.tasks['task-arch'].status = 'completed';

    const result = store.updateTask('task-arch', {
      title: 'Título Modificado Ilegalmente',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.general).toContain('já concluídas');
  });

  it('permite cancelar uma tarefa em andamento e libera o agente de forma segura', () => {
    const store = rawSimulationStore.getState();

    // Atribui e simula que gpt está trabalhando em task-arch
    const currentState = rawSimulationStore.getState().state;
    currentState.agents['gpt'].currentTaskId = 'task-arch';
    currentState.agents['gpt'].state = 'working';

    const cancelResult = store.cancelTask('task-arch');
    expect(cancelResult.success).toBe(true);

    const updatedState = rawSimulationStore.getState().state;
    expect(updatedState.tasks['task-arch'].status).toBe('cancelled');
    expect(updatedState.agents['gpt'].currentTaskId).toBeNull();
    expect(updatedState.agents['gpt'].state).toBe('idle');

    // Mensagem de cancelamento presente
    const messages = rawSimulationStore.getState().teamMessages;
    expect(messages.some((m) => m.context === 'task_cancelled')).toBe(true);
  });

  it('rejeita dependência circular ao tentar atualizar tarefa', () => {
    const store = rawSimulationStore.getState();

    // task-api já depende de task-arch.
    // Se tentarmos fazer task-arch depender de task-api -> ciclo!
    const result = store.updateTask('task-arch', {
      dependencies: ['task-api'],
    });

    expect(result.success).toBe(false);
    expect(result.errors?.dependencies).toContain('Dependência circular');
  });
});
