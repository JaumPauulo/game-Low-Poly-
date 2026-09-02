import { describe, expect, it } from 'vitest';
import { rawAgentStore, useAgentStore } from './agentStore';

describe('useAgentStore and rawAgentStore', () => {
  it('inicializa com os estados corretos para todos os agentes', () => {
    const state = rawAgentStore.getState();
    expect(state.selectedAgentId).toBeNull();
    expect(state.isPaused).toBe(false);
    expect(state.agentStates.gemini?.animation).toBe('talking');
    expect(state.agentStates.claude?.animation).toBe('thinking');
    expect(state.agentStates.gpt?.animation).toBe('working');
    expect(state.agentStates.kimi?.animation).toBe('coffee');
  });

  it('permite selecionar um agente', () => {
    rawAgentStore.getState().selectAgent('claude');
    expect(rawAgentStore.getState().selectedAgentId).toBe('claude');
  });

  it('permite alterar animação de um agente específico', () => {
    rawAgentStore.getState().setAgentAnimation('gpt', 'error');
    expect(rawAgentStore.getState().agentStates.gpt.animation).toBe('error');
  });

  it('permite alternar pausa', () => {
    const prev = rawAgentStore.getState().isPaused;
    rawAgentStore.getState().togglePause();
    expect(rawAgentStore.getState().isPaused).toBe(!prev);
  });

  it('permite redefinir estado com resetAll', () => {
    rawAgentStore.getState().resetAll();
    expect(rawAgentStore.getState().selectedAgentId).toBeNull();
    expect(rawAgentStore.getState().isPaused).toBe(false);
  });

  it('expõe métodos estáticos getState e setState em useAgentStore', () => {
    expect(typeof useAgentStore.getState).toBe('function');
    expect(typeof useAgentStore.setState).toBe('function');
    expect(typeof useAgentStore.subscribe).toBe('function');
  });
});
