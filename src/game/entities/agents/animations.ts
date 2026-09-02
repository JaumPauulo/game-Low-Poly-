import { AgentAnimationState, AgentRigRefs } from './types';

/**
 * Atualiza o rig esquelético procedural sem alocar nenhum objeto na memória.
 * Todas as transformações são aplicadas diretamente em números primitivos nos eixos
 * de rotação e posição dos Groups de referência.
 */
export function updateAgentRigAnimation(
  refs: AgentRigRefs,
  state: AgentAnimationState,
  time: number,
  reducedMotion: boolean = false
): void {
  const { torso, head, leftArm, rightArm, leftLeg, rightLeg, mug } = refs;

  if (!torso || !head || !leftArm || !rightArm || !leftLeg || !rightLeg) {
    return;
  }

  // Visibilidade da caneca de café
  if (mug) {
    if (state === 'coffee') {
      mug.scale.set(1, 1, 1);
    } else {
      mug.scale.set(0, 0, 0);
    }
  }

  // Se prefers-reduced-motion estiver ativo, mantemos uma pose estática limpa
  if (reducedMotion) {
    torso.position.y = 0;
    torso.rotation.x = 0;
    torso.rotation.y = 0;
    torso.rotation.z = 0;
    head.rotation.x = 0;
    head.rotation.y = 0;
    head.rotation.z = 0;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;

    if (state === 'working') {
      leftArm.rotation.x = -Math.PI / 3;
      rightArm.rotation.x = -Math.PI / 3;
    } else if (state === 'thinking') {
      leftArm.rotation.x = 0;
      rightArm.rotation.x = -Math.PI / 2.2;
      head.rotation.z = -0.15;
    } else if (state === 'coffee') {
      leftArm.rotation.x = 0;
      rightArm.rotation.x = -Math.PI / 2.5;
    } else {
      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
    }
    return;
  }

  // Reset base de pernas para estados que não caminham
  if (state !== 'walking') {
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
  }

  switch (state) {
    case 'idle': {
      // Respiração suave e sutil flutuação no eixo Y
      const breath = Math.sin(time * 2.5);
      torso.position.y = breath * 0.015;
      torso.rotation.y = Math.sin(time * 1.2) * 0.04;
      torso.rotation.z = Math.cos(time * 1.5) * 0.02;

      head.rotation.y = Math.sin(time * 1.0) * 0.06;
      head.rotation.x = breath * 0.03;

      leftArm.rotation.x = Math.sin(time * 2.5) * 0.06;
      leftArm.rotation.z = 0.08 + Math.cos(time * 2.0) * 0.03;
      rightArm.rotation.x = -Math.sin(time * 2.5) * 0.06;
      rightArm.rotation.z = -0.08 - Math.cos(time * 2.0) * 0.03;
      break;
    }

    case 'walking': {
      // Passada rítmica: pernas e braços em oposição de fase
      const walkSpeed = time * 7.0;
      const legSwing = Math.sin(walkSpeed) * 0.55;
      const armSwing = Math.sin(walkSpeed) * 0.5;

      leftLeg.rotation.x = legSwing;
      rightLeg.rotation.x = -legSwing;

      leftArm.rotation.x = -armSwing;
      leftArm.rotation.z = 0.1;
      rightArm.rotation.x = armSwing;
      rightArm.rotation.z = -0.1;

      torso.position.y = Math.abs(Math.sin(walkSpeed)) * 0.04;
      torso.rotation.y = Math.sin(walkSpeed) * 0.08;
      torso.rotation.z = -Math.sin(walkSpeed) * 0.04;

      head.rotation.y = -Math.sin(walkSpeed) * 0.06;
      head.rotation.x = 0.05;
      break;
    }

    case 'working': {
      // Mãos à frente no teclado em velocidade alternada de digitação rápida
      const typeSpeed = time * 12.0;
      torso.position.y = 0;
      torso.rotation.x = 0.12; // Leve inclinação ergonômica em direção à tela
      torso.rotation.y = 0;
      torso.rotation.z = 0;

      head.rotation.x = 0.18; // Olhando para a tela / monitor
      head.rotation.y = Math.sin(time * 1.5) * 0.05;

      leftArm.rotation.x = -Math.PI / 3 + Math.sin(typeSpeed) * 0.12;
      leftArm.rotation.y = 0.2;
      leftArm.rotation.z = 0.1;

      rightArm.rotation.x = -Math.PI / 3 + Math.cos(typeSpeed + 0.8) * 0.12;
      rightArm.rotation.y = -0.2;
      rightArm.rotation.z = -0.1;
      break;
    }

    case 'thinking': {
      // Mão direita próxima ao queixo e cabeça inclinada curiosamente
      const thinkBreath = Math.sin(time * 2.0);
      torso.position.y = thinkBreath * 0.01;
      torso.rotation.x = -0.05;
      torso.rotation.y = 0.1;
      torso.rotation.z = 0.04;

      head.rotation.z = -0.22; // Cabeça inclinada pensativa
      head.rotation.y = 0.15 + Math.sin(time * 1.5) * 0.08;
      head.rotation.x = -0.08;

      // Braço direito dobrado no queixo
      rightArm.rotation.x = -Math.PI / 2.1;
      rightArm.rotation.y = -0.3;
      rightArm.rotation.z = -0.25;

      // Braço esquerdo apoiando o cotovelo ou na cintura
      leftArm.rotation.x = -Math.PI / 4.5;
      leftArm.rotation.y = 0.25;
      leftArm.rotation.z = 0.2;
      break;
    }

    case 'talking': {
      // Gestos articulados de conversa corporativa / alinhamento de sprint
      const talkCadence = time * 4.5;
      torso.position.y = Math.sin(talkCadence * 0.5) * 0.015;
      torso.rotation.y = Math.sin(time * 2.0) * 0.1;

      head.rotation.y = Math.sin(time * 2.5) * 0.15;
      head.rotation.x = Math.sin(talkCadence) * 0.08; // Concordando com a cabeça

      leftArm.rotation.x = -Math.PI / 4 + Math.sin(talkCadence) * 0.25;
      leftArm.rotation.y = 0.2 + Math.cos(talkCadence) * 0.15;
      leftArm.rotation.z = 0.2;

      rightArm.rotation.x = -Math.PI / 3.5 + Math.cos(talkCadence + 1.0) * 0.22;
      rightArm.rotation.y = -0.2 - Math.sin(talkCadence) * 0.15;
      rightArm.rotation.z = -0.2;
      break;
    }

    case 'coffee': {
      // Leva a caneca até a boca ciclicamente e saboreia
      const coffeeCycle = (time * 1.2) % (Math.PI * 2);
      const isDrinking = Math.sin(coffeeCycle);

      torso.position.y = 0;
      torso.rotation.x = 0;
      torso.rotation.y = 0;

      if (isDrinking > 0.3) {
        // Bebendo o café
        const drinkProgress = (isDrinking - 0.3) / 0.7;
        rightArm.rotation.x = -Math.PI / 2.2 - drinkProgress * 0.35;
        rightArm.rotation.y = -0.2;
        rightArm.rotation.z = -0.15;
        head.rotation.x = -0.15 * drinkProgress; // Cabeça ligeiramente para trás
      } else {
        // Caneca abaixada no peito/descanso
        rightArm.rotation.x = -Math.PI / 3.8;
        rightArm.rotation.y = -0.15;
        rightArm.rotation.z = -0.12;
        head.rotation.x = 0.05;
      }

      leftArm.rotation.x = 0;
      leftArm.rotation.z = 0.12;
      break;
    }

    case 'error': {
      // Shake / Sobressalto de bug/erro
      const shake = Math.sin(time * 24.0) * 0.12;
      torso.position.y = 0;
      torso.rotation.z = shake;
      torso.rotation.x = 0.1;

      head.rotation.z = -shake * 1.5;
      head.rotation.x = 0.15;

      // Braços levantados exasperados
      leftArm.rotation.x = -Math.PI / 1.8;
      leftArm.rotation.z = 0.5 + Math.sin(time * 18.0) * 0.15;
      rightArm.rotation.x = -Math.PI / 1.8;
      rightArm.rotation.z = -0.5 - Math.sin(time * 18.0) * 0.15;
      break;
    }
  }
}
