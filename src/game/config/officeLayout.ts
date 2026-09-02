/**
 * Configuração data-driven completa do cenário do escritório.
 * Define dimensões da maquete, paredes, zonas lógicas, obstáculos e mobiliário procedural.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type RotationEulerY = number;

export interface DeskConfig {
  id: string;
  position: [number, number, number];
  rotationY: RotationEulerY;
  accentColor: string;
  hasLaptop: boolean;
  chairOffset: [number, number, number];
}

export interface MeetingConfig {
  tablePosition: [number, number, number];
  tableSize: [number, number, number];
  chairs: Array<{
    id: string;
    position: [number, number, number];
    rotationY: RotationEulerY;
    color: string;
  }>;
  whiteboardPosition: [number, number, number];
  whiteboardSize: [number, number, number];
}

export interface CoffeeStationConfig {
  counterPosition: [number, number, number];
  counterSize: [number, number, number];
  machinePosition: [number, number, number];
  smallTablePosition: [number, number, number];
  stools: Array<{
    id: string;
    position: [number, number, number];
  }>;
}

export interface LoungeConfig {
  sofaPosition: [number, number, number];
  sofaRotationY: RotationEulerY;
  sofaSize: [number, number, number];
  coffeeTablePosition: [number, number, number];
  coffeeTableSize: [number, number, number];
  rugPosition: [number, number, number];
  rugSize: [number, number];
  lampPosition: [number, number, number];
}

export interface PlantConfig {
  id: string;
  position: [number, number, number];
  scale?: number;
  potType?: 'cylinder' | 'cube';
}

export interface ZoneBounds {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  color: string;
}

export interface StaticObstacle {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface OfficeLayoutConfig {
  grid: {
    cols: number;
    rows: number;
    cellSize: number;
    totalWidth: number;
    totalDepth: number;
  };
  diorama: {
    baseHeight: number;
    wallHeight: number;
    wallThickness: number;
    baseColor: string;
    baseRimColor: string;
    floorColor: string;
    wallColor: string;
    baseTrimColor: string;
  };
  zones: ZoneBounds[];
  desks: DeskConfig[];
  meeting: MeetingConfig;
  coffeeStation: CoffeeStationConfig;
  lounge: LoungeConfig;
  plants: PlantConfig[];
  staticObstacles: StaticObstacle[];
}

export const OFFICE_LAYOUT_CONFIG: OfficeLayoutConfig = {
  grid: {
    cols: 12,
    rows: 9,
    cellSize: 1.2,
    totalWidth: 14.4, // 12 * 1.2
    totalDepth: 10.8, // 9 * 1.2
  },
  diorama: {
    baseHeight: 0.45,
    wallHeight: 3.5,
    wallThickness: 0.25,
    baseColor: '#334155', // Slate 700 elegante para a base recortada
    baseRimColor: '#1e293b', // Slate 800 para o chanfro inferior
    floorColor: '#f8fafc', // Slate 50 para piso claro e limpo
    wallColor: '#f1f5f9', // Slate 100 suave
    baseTrimColor: '#e2e8f0', // Rodapé
  },
  zones: [
    {
      id: 'workstations',
      name: 'Estações de Trabalho',
      minX: -6.5,
      maxX: -1.0,
      minZ: -4.8,
      maxZ: -0.5,
      color: '#38bdf8',
    },
    {
      id: 'meeting',
      name: 'Sala de Reunião',
      minX: 1.2,
      maxX: 6.5,
      minZ: -4.8,
      maxZ: -0.5,
      color: '#818cf8',
    },
    {
      id: 'coffee',
      name: 'Área de Café',
      minX: -6.5,
      maxX: -1.0,
      minZ: 0.8,
      maxZ: 4.8,
      color: '#f59e0b',
    },
    {
      id: 'lounge',
      name: 'Lounge e Convivência',
      minX: 1.2,
      maxX: 6.5,
      minZ: 0.8,
      maxZ: 4.8,
      color: '#ec4899',
    },
  ],
  desks: [
    {
      id: 'desk-1',
      position: [-4.6, 0, -3.4],
      rotationY: 0,
      accentColor: '#38bdf8',
      hasLaptop: false,
      chairOffset: [0, 0, 0.75],
    },
    {
      id: 'desk-2',
      position: [-2.4, 0, -3.4],
      rotationY: 0,
      accentColor: '#818cf8',
      hasLaptop: true,
      chairOffset: [0, 0, 0.75],
    },
    {
      id: 'desk-3',
      position: [-4.6, 0, -1.6],
      rotationY: Math.PI,
      accentColor: '#34d399',
      hasLaptop: false,
      chairOffset: [0, 0, -0.75],
    },
    {
      id: 'desk-4',
      position: [-2.4, 0, -1.6],
      rotationY: Math.PI,
      accentColor: '#f472b6',
      hasLaptop: true,
      chairOffset: [0, 0, -0.75],
    },
  ],
  meeting: {
    tablePosition: [3.8, 0, -2.5],
    tableSize: [3.4, 0.75, 1.6],
    chairs: [
      { id: 'meet-chair-1', position: [2.8, 0, -3.6], rotationY: 0, color: '#64748b' },
      { id: 'meet-chair-2', position: [4.8, 0, -3.6], rotationY: 0, color: '#64748b' },
      { id: 'meet-chair-3', position: [2.8, 0, -1.4], rotationY: Math.PI, color: '#64748b' },
      { id: 'meet-chair-4', position: [4.8, 0, -1.4], rotationY: Math.PI, color: '#64748b' },
    ],
    whiteboardPosition: [3.8, 1.75, -5.15],
    whiteboardSize: [3.2, 1.5, 0.08],
  },
  coffeeStation: {
    counterPosition: [-5.6, 0, 2.4],
    counterSize: [1.2, 0.9, 2.6],
    machinePosition: [-5.6, 0.9, 2.1],
    smallTablePosition: [-3.2, 0, 2.6],
    stools: [
      { id: 'stool-1', position: [-3.2, 0, 1.8] },
      { id: 'stool-2', position: [-3.2, 0, 3.4] },
    ],
  },
  lounge: {
    sofaPosition: [3.8, 0, 4.0],
    sofaRotationY: Math.PI,
    sofaSize: [2.6, 0.75, 1.0],
    coffeeTablePosition: [3.8, 0, 2.5],
    coffeeTableSize: [1.6, 0.42, 0.9],
    rugPosition: [3.8, 0.005, 3.1],
    rugSize: [3.8, 3.0],
    lampPosition: [1.8, 0, 4.2],
  },
  plants: [
    { id: 'plant-corner-ne', position: [6.2, 0, -4.4], scale: 1.1, potType: 'cylinder' },
    { id: 'plant-mid-west', position: [-6.2, 0, 0.2], scale: 0.9, potType: 'cube' },
    { id: 'plant-corner-sw', position: [-6.2, 0, 4.4], scale: 1.0, potType: 'cylinder' },
    { id: 'plant-lounge-se', position: [6.1, 0, 4.2], scale: 1.15, potType: 'cylinder' },
  ],
  staticObstacles: [
    // Parede Norte e Parede Oeste
    { id: 'wall-north', minX: -7.2, maxX: 7.2, minZ: -5.4, maxZ: -5.15, height: 3.5 },
    { id: 'wall-west', minX: -7.2, maxX: -6.95, minZ: -5.4, maxZ: 5.4, height: 3.5 },
    // Bancada de trabalho 1 e 2
    { id: 'desk-block-1', minX: -5.3, maxX: -1.7, minZ: -3.9, maxZ: -2.9, height: 1.2 },
    { id: 'desk-block-2', minX: -5.3, maxX: -1.7, minZ: -2.1, maxZ: -1.1, height: 1.2 },
    // Mesa de reunião
    { id: 'meeting-table-block', minX: 2.1, maxX: 5.5, minZ: -3.3, maxZ: -1.7, height: 0.75 },
    // Balcão de café
    { id: 'coffee-counter-block', minX: -6.2, maxX: -5.0, minZ: 1.1, maxZ: 3.7, height: 1.4 },
    // Sofá e mesinha lounge
    { id: 'lounge-sofa-block', minX: 2.5, maxX: 5.1, minZ: 3.5, maxZ: 4.5, height: 0.8 },
    { id: 'lounge-table-block', minX: 3.0, maxX: 4.6, minZ: 2.0, maxZ: 3.0, height: 0.45 },
  ],
};

export const STATIC_OBSTACLES = OFFICE_LAYOUT_CONFIG.staticObstacles;

