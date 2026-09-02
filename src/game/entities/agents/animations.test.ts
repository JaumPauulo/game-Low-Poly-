import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { updateAgentRigAnimation } from './animations';
import { AgentAnimationState, AgentRigRefs } from './types';

function createMockRigRefs(): AgentRigRefs {
  return {
    root: new THREE.Group(),
    torso: new THREE.Group(),
    head: new THREE.Group(),
    leftArm: new THREE.Group(),
    rightArm: new THREE.Group(),
    leftLeg: new THREE.Group(),
    rightLeg: new THREE.Group(),
    leftHand: new THREE.Group(),
    rightHand: new THREE.Group(),
    mug: new THREE.Group(),
  };
}

describe('updateAgentRigAnimation', () => {
  const states: AgentAnimationState[] = [
    'idle',
    'walking',
    'working',
    'thinking',
    'talking',
    'coffee',
    'error',
  ];

  it('executa com segurança para todos os 7 estados de animação', () => {
    const refs = createMockRigRefs();

    for (const state of states) {
      expect(() => {
        updateAgentRigAnimation(refs, state, 1.5, false);
      }).not.toThrow();
    }
  });

  it('ativa a escala da caneca somente durante o estado coffee', () => {
    const refs = createMockRigRefs();

    updateAgentRigAnimation(refs, 'coffee', 1.0, false);
    expect(refs.mug?.scale.x).toBe(1);

    updateAgentRigAnimation(refs, 'idle', 1.0, false);
    expect(refs.mug?.scale.x).toBe(0);

    updateAgentRigAnimation(refs, 'working', 1.0, false);
    expect(refs.mug?.scale.x).toBe(0);
  });

  it('alterna as pernas em direções opostas durante o walking', () => {
    const refs = createMockRigRefs();

    updateAgentRigAnimation(refs, 'walking', 0.5, false);

    // No walking, perna esquerda e perna direita têm sinais opostos de rotação no eixo X
    expect(refs.leftLeg?.rotation.x).not.toBe(0);
    expect(refs.rightLeg?.rotation.x).toBeCloseTo(-refs.leftLeg!.rotation.x, 3);
  });

  it('suporta modo prefers-reduced-motion sem animações oscilatórias', () => {
    const refs = createMockRigRefs();

    updateAgentRigAnimation(refs, 'idle', 2.0, true);

    expect(refs.torso?.position.y).toBe(0);
    expect(refs.torso?.rotation.x).toBe(0);
    expect(refs.head?.rotation.y).toBe(0);
  });

  it('trata graciosamente refs incompletos ou nulos sem falhar', () => {
    const brokenRefs: AgentRigRefs = {
      root: null,
      torso: null,
      head: null,
      leftArm: null,
      rightArm: null,
      leftLeg: null,
      rightLeg: null,
      leftHand: null,
      rightHand: null,
      mug: null,
    };

    expect(() => {
      updateAgentRigAnimation(brokenRefs, 'working', 1.0, false);
    }).not.toThrow();
  });
});
