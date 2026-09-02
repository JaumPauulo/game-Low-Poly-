/**
 * Configurações da cena 3D e renderização do diorama.
 * Centralização data-driven para evitar parâmetros mágicos nos componentes.
 */

export interface SceneConfig {
  backgroundColor: string;
  dprLimits: [number, number];
  camera: {
    position: [number, number, number];
    lookAt: [number, number, number];
    zoom: number;
    near: number;
    far: number;
  };
  lighting: {
    ambientIntensity: number;
    ambientColor: string;
    directionalPosition: [number, number, number];
    directionalIntensity: number;
    directionalColor: string;
    hemisphereSkyColor: string;
    hemisphereGroundColor: string;
    hemisphereIntensity: number;
    shadowMapSize: number;
  };
  testScene: {
    planeSize: [number, number];
    planeColor: string;
    planeRoughness: number;
    cubeSize: [number, number, number];
    cubePosition: [number, number, number];
    cubeColor: string;
    cubeRoughness: number;
  };
}

export const SCENE_CONFIG: SceneConfig = {
  backgroundColor: '#f1f5f9', // Slate 100 suave para estética de diorama recortado
  dprLimits: [1, 1.5],
  camera: {
    position: [20, 20, 20],
    lookAt: [0, 1.2, 0],
    zoom: 52,
    near: -100,
    far: 200,
  },
  lighting: {
    ambientIntensity: 0.75,
    ambientColor: '#ffffff',
    directionalPosition: [14, 22, 12],
    directionalIntensity: 1.4,
    directionalColor: '#fffdf5', // Luz solar suave e acolhedora
    hemisphereSkyColor: '#ffffff',
    hemisphereGroundColor: '#cbd5e1',
    hemisphereIntensity: 0.45,
    shadowMapSize: 1024,
  },
  testScene: {
    planeSize: [14.4, 10.8],
    planeColor: '#e2e8f0',
    planeRoughness: 0.85,
    cubeSize: [1.8, 1.8, 1.8],
    cubePosition: [0, 0.9, 0],
    cubeColor: '#38bdf8',
    cubeRoughness: 0.6,
  },
};
