import { describe, expect, it } from 'vitest';
import { formatSimulationTimestamp } from './types';
import { generateTeamMessage } from './chatTemplates';

describe('chatTemplates and types', () => {
  it('formata segundos no formato mm:ss de forma determinística', () => {
    expect(formatSimulationTimestamp(0)).toBe('00:00');
    expect(formatSimulationTimestamp(15)).toBe('00:15');
    expect(formatSimulationTimestamp(60)).toBe('01:00');
    expect(formatSimulationTimestamp(75.8)).toBe('01:15');
    expect(formatSimulationTimestamp(3599)).toBe('59:59');
  });

  it('gera evento de sistema com timestamp e formatação corretos', () => {
    const msg = generateTeamMessage({
      context: 'task_created',
      simulationTime: 42,
      taskTitle: 'Refatoração do Módulo',
    });

    expect(msg.kind).toBe('system_event');
    expect(msg.timestampFormatted).toBe('00:42');
    expect(msg.text).toContain('Refatoração do Módulo');
    expect(msg.agentId).toBeUndefined();
  });

  it('gera mensagem de agente com papel, cor e texto parametrizado para task_start', () => {
    const msg = generateTeamMessage({
      context: 'task_start',
      simulationTime: 12,
      agentId: 'gpt',
      taskTitle: 'Testes de Integração',
      seedIndex: 0,
    });

    expect(msg.kind).toBe('agent_message');
    expect(msg.agentId).toBe('gpt');
    expect(msg.agentName).toBe('GPT');
    expect(msg.text).toContain('Testes de Integração');
    expect(msg.agentColor).toBe('#4E9B77');
  });

  it('gera mensagem de conclusão com texto apropriado por perfil', () => {
    const msg = generateTeamMessage({
      context: 'task_complete',
      simulationTime: 120,
      agentId: 'gemini',
      taskTitle: 'Arquitetura Core',
      seedIndex: 0,
    });

    expect(msg.kind).toBe('agent_message');
    expect(msg.text).toContain('Arquitetura Core');
    expect(msg.agentName).toBe('Gemini');
  });

  it('gera mensagem de bloqueio com título da dependência substituído', () => {
    const msg = generateTeamMessage({
      context: 'task_blocked',
      simulationTime: 30,
      agentId: 'claude',
      taskTitle: 'Pesquisa Técnica',
      dependencyTitle: 'Setup do Banco',
    });

    expect(msg.kind).toBe('agent_message');
    expect(msg.text).toContain('Pesquisa Técnica');
    expect(msg.text).toContain('Setup do Banco');
  });

  it('gera mensagem de colaboração substituindo o nome do parceiro', () => {
    const msg = generateTeamMessage({
      context: 'collaboration_request',
      simulationTime: 65,
      agentId: 'gemini',
      targetAgentId: 'gpt',
      taskTitle: 'Refatorar A*',
    });

    expect(msg.kind).toBe('agent_message');
    expect(msg.text).toContain('GPT');
  });

  it('gera comentário de progresso substituindo a porcentagem', () => {
    const msg = generateTeamMessage({
      context: 'progress_commentary',
      simulationTime: 90,
      agentId: 'kimi',
      taskTitle: 'Relatório Mensal',
      progressPercent: 50,
    });

    expect(msg.kind).toBe('agent_message');
    expect(msg.text).toContain('50%');
    expect(msg.text).toContain('Relatório Mensal');
  });
});
