import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type { OrthographicCamera as ThreeOrthographicCamera } from 'three';
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

  // Ângulo alvo em graus
  const targetAngleDeg = getRotationAngleDegrees(rotationIndex);
  // Ângulo atual interpolado suavemente por referência direta (sem setState)
  const currentAngleDegRef = useRef<number>(targetAngleDeg);

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

  // Transição suave de rotação de 90° e orientação rigorosa de lookAt
  useFrame((_, delta) => {
    const cam = cameraRef.current;
    if (!cam) return;

    const currentAngle = currentAngleDegRef.current;
    const diff = targetAngleDeg - currentAngle;

    // Normalização da menor diferença angular em graus (-180 a 180)
    let shortestDiff = ((diff + 180) % 360) - 180;
    if (shortestDiff < -180) shortestDiff += 360;

    if (Math.abs(shortestDiff) > 0.05) {
      // Interpolação angular suave (velocidade adaptativa proporcional ao delta)
      const step = shortestDiff * Math.min(delta * 8.5, 1.0);
      currentAngleDegRef.current += step;
    } else {
      currentAngleDegRef.current = targetAngleDeg;
    }

    // Calcula a posição no espaço 3D para o ângulo atual
    const [x, y, z] = getCameraPositionForAngle(currentAngleDegRef.current);
    cam.position.set(x, y, z);

    // lookAt estrito no centro do diorama (fonte da verdade)
    cam.lookAt(target[0], target[1], target[2]);
    cam.updateMatrixWorld(true);
  });

  // Posição inicial baseada no ângulo alvo atual
  const initialPos = getCameraPositionForAngle(targetAngleDeg);

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={initialPos}
      zoom={effectiveZoom}
      near={ISOMETRIC_CAMERA_CONFIG.near}
      far={ISOMETRIC_CAMERA_CONFIG.far}
    />
  );
}
