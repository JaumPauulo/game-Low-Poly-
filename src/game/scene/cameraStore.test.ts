import { beforeEach, describe, expect, it } from 'vitest';
import { rawCameraStore } from './cameraStore';

describe('cameraStore', () => {
  beforeEach(() => {
    rawCameraStore.getState().resetCamera();
  });

  it('inicia no ângulo 0 com zoom 1.0 e alvo centrado', () => {
    const state = rawCameraStore.getState();
    expect(state.rotationIndex).toBe(0);
    expect(state.zoomMultiplier).toBe(1.0);
    expect(state.target).toEqual([0, 1.2, 0]);
  });

  it('rotaciona para a direita e esquerda em passos de 90 graus', () => {
    const { rotateRight, rotateLeft } = rawCameraStore.getState();

    rotateRight();
    expect(rawCameraStore.getState().rotationIndex).toBe(1);

    rotateRight();
    expect(rawCameraStore.getState().rotationIndex).toBe(2);

    rotateRight();
    expect(rawCameraStore.getState().rotationIndex).toBe(3);

    rotateRight();
    expect(rawCameraStore.getState().rotationIndex).toBe(0); // wrap-around

    rotateLeft();
    expect(rawCameraStore.getState().rotationIndex).toBe(3); // wrap-around inverso
  });

  it('aumenta e reduz o zoom respeitando os limites', () => {
    const { zoomIn, zoomOut, setZoomMultiplier } = rawCameraStore.getState();

    zoomIn();
    expect(rawCameraStore.getState().zoomMultiplier).toBeCloseTo(1.15, 2);

    zoomOut();
    zoomOut();
    expect(rawCameraStore.getState().zoomMultiplier).toBeCloseTo(0.85, 2);

    setZoomMultiplier(5.0);
    expect(rawCameraStore.getState().zoomMultiplier).toBe(1.8);

    setZoomMultiplier(0.1);
    expect(rawCameraStore.getState().zoomMultiplier).toBe(0.6);
  });

  it('controla acompanhamento de agente via followAgent e stopFollowing', () => {
    const { followAgent, stopFollowing, resetCamera } = rawCameraStore.getState();

    expect(rawCameraStore.getState().followingAgentId).toBeNull();

    followAgent('gpt');
    expect(rawCameraStore.getState().followingAgentId).toBe('gpt');

    stopFollowing();
    expect(rawCameraStore.getState().followingAgentId).toBeNull();

    followAgent('claude');
    expect(rawCameraStore.getState().followingAgentId).toBe('claude');

    resetCamera();
    expect(rawCameraStore.getState().followingAgentId).toBeNull();
    expect(rawCameraStore.getState().target).toEqual([0, 1.2, 0]);
  });
});
