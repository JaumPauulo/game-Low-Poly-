import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrthographicCamera as ThreeOrthographicCamera } from 'three';
import { rawAgentMovementStore } from '../entities/agents/agentMovementStore';
import { useCameraStore } from './cameraStore';
import {
  calculateResponsiveZoom,
  getCameraPositionForAngle,
  getRotationAngleDegrees,
  ISOMETRIC_CAMERA_CONFIG,
} from './cameraUtils';

export function IsometricCamera() {
  const cameraRef = useRef<ThreeOrthographicCamera>(null);
  const size = useThree((state) => state.size);

  const rotationIndex = useCameraStore((state) => state.rotationIndex);
  const zoomMultiplier = useCameraStore((state) => state.zoomMultiplier);
  const target = useCameraStore((state) => state.target);
  const followingAgentId = useCameraStore((state) => state.followingAgentId);

  // Ângulo alvo em graus
  const targetAngleDeg = getRotationAngleDegrees(rotationIndex);
  // Ângulo atual interpolado suavemente por referência direta (sem setState)
  const currentAngleDegRef = useRef<number>(targetAngleDeg);

  // Alvo interpolado suavemente em 3D
  const currentTargetRef = useRef<[number, number, number]>([...target]);

  // Calcula o zoom responsivo com base no tamanho atual da tela
  const baseZoom = calculateResponsiveZoom(size.width, size.height);
  const effectiveZoom = baseZoom * zoomMultiplier;

  // Atualização síncrona imediata em mudanças de tamanho ou zoom
  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;

    cam.zoom = effectiveZoom;
    cam.updateProjectionMatrix();
  }, [effectiveZoom, size.width, size.height]);

  // Transição suave de rotação de 90°, acompanhamento do agente e orientação rigorosa de lookAt
  useFrame((_, delta) => {
    const cam = cameraRef.current;
    if (!cam) return;

    // 1. Interpolação angular suave de 90 graus
    const currentAngle = currentAngleDegRef.current;
    const diff = targetAngleDeg - currentAngle;

    // Normalização da menor diferença angular em graus (-180 a 180)
    let shortestDiff = ((diff + 180) % 360) - 180;
    if (shortestDiff < -180) shortestDiff += 360;

    if (Math.abs(shortestDiff) > 0.05) {
      const step = shortestDiff * Math.min(delta * 8.5, 1.0);
      currentAngleDegRef.current += step;
    } else {
      currentAngleDegRef.current = targetAngleDeg;
    }

    // 2. Determinação da posição alvo (centro padrão ou agente em acompanhamento)
    let desiredTarget: [number, number, number] = target;
    if (followingAgentId) {
      const movement = rawAgentMovementStore.getState().movements[followingAgentId];
      if (movement) {
        desiredTarget = [movement.currentWorldPos.x, 1.2, movement.currentWorldPos.z];
      }
    }

    // Interpolação suave do alvo (lerp)
    const lerpFactor = Math.min(delta * 5.0, 1.0);
    currentTargetRef.current[0] = THREE.MathUtils.lerp(currentTargetRef.current[0], desiredTarget[0], lerpFactor);
    currentTargetRef.current[1] = THREE.MathUtils.lerp(currentTargetRef.current[1], desiredTarget[1], lerpFactor);
    currentTargetRef.current[2] = THREE.MathUtils.lerp(currentTargetRef.current[2], desiredTarget[2], lerpFactor);

    // 3. Posição da câmera mantendo vetor isométrico exato relativo ao alvo
    const [offsetX, offsetY, offsetZ] = getCameraPositionForAngle(currentAngleDegRef.current);
    cam.position.set(
      currentTargetRef.current[0] + offsetX,
      currentTargetRef.current[1] + offsetY,
      currentTargetRef.current[2] + offsetZ
    );

    // lookAt estrito no alvo atual garantindo que a projeção ortográfica nunca perca o ângulo isométrico
    cam.lookAt(currentTargetRef.current[0], currentTargetRef.current[1], currentTargetRef.current[2]);
    cam.updateMatrixWorld(true);
  });

  // Posição inicial baseada no ângulo alvo atual
  const initialPos = getCameraPositionForAngle(targetAngleDeg);

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[target[0] + initialPos[0], target[1] + initialPos[1], target[2] + initialPos[2]]}
      zoom={effectiveZoom}
      near={ISOMETRIC_CAMERA_CONFIG.near}
      far={ISOMETRIC_CAMERA_CONFIG.far}
    />
  );
}
