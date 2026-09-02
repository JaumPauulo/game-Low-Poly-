/**
 * Funções matemáticas e constantes para o controle da câmera isométrica.
 * Lógica pura desacoplada de React e Three.js para garantir testabilidade.
 */

export const DIORAMA_BOUNDS = {
  projectedWidth: 17.8,
  projectedHeight: 14.0,
  minZoom: 16,
  maxZoom: 95,
  targetPaddingRatio: 0.74,
};

export const ISOMETRIC_CAMERA_CONFIG = {
  radiusXZ: 20 * Math.SQRT2, // ~28.2843
  heightY: 20,
  near: -100,
  far: 200,
  defaultTarget: [0, 1.2, 0] as const,
  minZoomMultiplier: 0.6,
  maxZoomMultiplier: 1.8,
};

/**
 * Posições pré-calculadas para rotações em incrementos exatos de 90 graus.
 * Ângulo 0 (45°): Sudeste (vista frontal aberta para o diorama recortado).
 * Ângulo 1 (135°): Sudoeste.
 * Ângulo 2 (225°): Noroeste.
 * Ângulo 3 (315°): Nordeste.
 */
export const ISOMETRIC_POSITIONS: readonly [number, number, number][] = [
  [20, 20, 20],   // 0: 45°
  [-20, 20, 20],  // 1: 135°
  [-20, 20, -20], // 2: 225°
  [20, 20, -20],  // 3: 315°
] as const;

/**
 * Converte um índice de rotação (positivo ou negativo) para o intervalo [0, 3].
 */
export function normalizeRotationIndex(index: number): number {
  return ((index % 4) + 4) % 4;
}

/**
 * Retorna o ângulo alvo em graus para um dado índice de rotação.
 */
export function getRotationAngleDegrees(index: number): number {
  return 45 + normalizeRotationIndex(index) * 90;
}

/**
 * Calcula a posição no espaço 3D para um ângulo em graus mantendo a inclinação isométrica.
 */
export function getCameraPositionForAngle(deg: number): [number, number, number] {
  const rad = (deg * Math.PI) / 180;
  const x = ISOMETRIC_CAMERA_CONFIG.radiusXZ * Math.cos(rad);
  const z = ISOMETRIC_CAMERA_CONFIG.radiusXZ * Math.sin(rad);
  return [x, ISOMETRIC_CAMERA_CONFIG.heightY, z];
}

/**
 * Calcula o zoom responsivo com base nas dimensões da viewport do Canvas.
 * Garante que o diorama caiba com proporções equilibradas e margens confortáveis
 * tanto em telas ultrawide, desktops, notebooks quanto em dispositivos móveis.
 */
export function calculateResponsiveZoom(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 42;
  }

  // Escala para ajustar na altura da viewport
  const zoomH = (height * DIORAMA_BOUNDS.targetPaddingRatio) / DIORAMA_BOUNDS.projectedHeight;
  // Escala para ajustar na largura da viewport
  const zoomW = (width * 0.84) / DIORAMA_BOUNDS.projectedWidth;

  const baseZoom = Math.min(zoomH, zoomW);
  return Math.max(DIORAMA_BOUNDS.minZoom, Math.min(baseZoom, DIORAMA_BOUNDS.maxZoom));
}

/**
 * Restringe o multiplicador de zoom aos limites definidos.
 */
export function clampZoomMultiplier(multiplier: number): number {
  return Math.max(
    ISOMETRIC_CAMERA_CONFIG.minZoomMultiplier,
    Math.min(multiplier, ISOMETRIC_CAMERA_CONFIG.maxZoomMultiplier)
  );
}
