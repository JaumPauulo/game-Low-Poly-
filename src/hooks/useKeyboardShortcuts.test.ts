import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rawAgentStore } from '../game/entities/agents/agentStore';
import { rawCameraStore } from '../game/scene/cameraStore';
import { rawSimulationStore } from '../game/simulation/simulationStore';
import { handleGlobalKeyDown, isEditableElement } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    rawSimulationStore.getState().resetScenario();
    rawAgentStore.getState().resetAll();
    rawCameraStore.getState().resetCamera();
  });

  it('detecta elementos editáveis corretamente', () => {
    expect(isEditableElement({ tagName: 'input' })).toBe(true);
    expect(isEditableElement({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableElement({ tagName: 'select' })).toBe(true);
    expect(isEditableElement({ tagName: 'div', isContentEditable: true })).toBe(true);
    expect(isEditableElement({ tagName: 'div', isContentEditable: false })).toBe(false);
    expect(isEditableElement(null)).toBe(false);
    expect(isEditableElement(undefined)).toBe(false);
    expect(isEditableElement('string')).toBe(false);
  });

  it('ignora atalhos quando digitando em um input ou textarea', () => {
    const event = {
      key: ' ',
      code: 'Space',
      target: { tagName: 'INPUT' },
    };

    const handled = handleGlobalKeyDown(event);
    expect(handled).toBe(false);
    expect(rawSimulationStore.getState().state.isPaused).toBe(false);
  });

  it('Space pausa e despausa a simulação', () => {
    const preventDefaultMock = vi.fn();
    const event = { key: ' ', code: 'Space', preventDefault: preventDefaultMock };

    handleGlobalKeyDown(event);
    expect(preventDefaultMock).toHaveBeenCalled();
    expect(rawSimulationStore.getState().state.isPaused).toBe(true);

    handleGlobalKeyDown(event);
    expect(rawSimulationStore.getState().state.isPaused).toBe(false);
  });

  it('teclas 1, 2 e 4 ajustam a velocidade da simulação', () => {
    handleGlobalKeyDown({ key: '2' });
    expect(rawSimulationStore.getState().state.timeScale).toBe(2);

    handleGlobalKeyDown({ key: '4' });
    expect(rawSimulationStore.getState().state.timeScale).toBe(4);

    handleGlobalKeyDown({ key: '1' });
    expect(rawSimulationStore.getState().state.timeScale).toBe(1);
  });

  it('Q e E rotacionam a câmera isométrica 90 graus', () => {
    expect(rawCameraStore.getState().rotationIndex).toBe(0);

    handleGlobalKeyDown({ key: 'e' });
    expect(rawCameraStore.getState().rotationIndex).toBe(1);

    handleGlobalKeyDown({ key: 'q' });
    expect(rawCameraStore.getState().rotationIndex).toBe(0);
  });

  it('R redefine a câmera (recenter)', () => {
    rawCameraStore.getState().rotateRight();
    rawCameraStore.getState().setZoomMultiplier(1.4);
    expect(rawCameraStore.getState().rotationIndex).toBe(1);

    handleGlobalKeyDown({ key: 'r' });
    expect(rawCameraStore.getState().rotationIndex).toBe(0);
    expect(rawCameraStore.getState().zoomMultiplier).toBe(1.0);
  });

  it('F alterna acompanhamento do agente selecionado', () => {
    rawAgentStore.getState().selectAgent('gpt');
    expect(rawCameraStore.getState().followingAgentId).toBeNull();

    // Primeiro F: ativa follow
    handleGlobalKeyDown({ key: 'f' });
    expect(rawCameraStore.getState().followingAgentId).toBe('gpt');

    // Segundo F: desativa follow
    handleGlobalKeyDown({ key: 'f' });
    expect(rawCameraStore.getState().followingAgentId).toBeNull();
  });

  it('Escape desseleciona agente e cancela acompanhamento', () => {
    rawAgentStore.getState().selectAgent('claude');
    rawCameraStore.getState().followAgent('claude');

    handleGlobalKeyDown({ key: 'Escape' });
    expect(rawAgentStore.getState().selectedAgentId).toBeNull();
    expect(rawCameraStore.getState().followingAgentId).toBeNull();
  });
});
