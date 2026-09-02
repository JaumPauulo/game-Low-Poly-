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
    position: [12, 12, 12],
    lookAt: [0, 0, 0],
    zoom: 48,
    near: -50,
    far: 100,
  },
  lighting: {
    ambientIntensity: 0.7,
    ambientColor: '#ffffff',
    directionalPosition: [14, 20, 12],
    directionalIntensity: 1.5,
    directionalColor: '#fffbeb', // Tom sutilmente acolhedor
    hemisphereSkyColor: '#ffffff',
    hemisphereGroundColor: '#cbd5e1',
    hemisphereIntensity: 0.45,
    shadowMapSize: 1024,
  },
  testScene: {
    planeSize: [12, 12],
    planeColor: '#e2e8f0', // Slate 200
    planeRoughness: 0.85,
    cubeSize: [1.8, 1.8, 1.8],
    cubePosition: [0, 0.9, 0],
    cubeColor: '#38bdf8', // Sky 400 low poly
    cubeRoughness: 0.6,
  },
};
