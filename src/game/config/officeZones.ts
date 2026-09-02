/**
 * Configuração e catálogo de Zonas do Escritório Diorama.
 *
 * Zonas suportadas:
 * - workstations (estações de trabalho individuais)
 * - coffee (área de café e recarga de energia)
 * - meeting (sala de reunião e colaboração)
 * - lounge (espaço de convivência e descanso)
 * - spawn (ponto de entrada/surgimento dos agentes)
 * - walkable (corredores principais de circulação)
 *
 * Todos os pontos de interação são validados para serem acessíveis pelo pathfinding A*.
 */

import { GridCoordinate, WorldCoordinate2D } from '../navigation/types';

export type ZoneType =
  | 'workstations'
  | 'coffee'
  | 'meeting'
  | 'lounge'
  | 'spawn'
  | 'walkable';

export interface ZoneInteractionPoint {
  id: string;
  name: string;
  zoneId: ZoneType;
  worldPosition: WorldCoordinate2D;
  gridCoordinate: GridCoordinate;
  preferredRotationY: number;
  assignedAgentId?: string; // Para postos atribuídos a agentes específicos
}

export interface OfficeZoneConfig {
  id: ZoneType;
  name: string;
  type: ZoneType;
  color: string;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  interactionPoints: ZoneInteractionPoint[];
}

export const OFFICE_ZONES: Record<ZoneType, OfficeZoneConfig> = {
  workstations: {
    id: 'workstations',
    name: 'Estações de Trabalho',
    type: 'workstations',
    color: '#38bdf8',
    bounds: { minX: -6.5, maxX: -1.0, minZ: -4.8, maxZ: -0.5 },
    interactionPoints: [
      {
        id: 'ws-desk-gpt',
        name: 'Mesa de Engenharia (GPT)',
        zoneId: 'workstations',
        worldPosition: { x: -4.8, z: 0.0 },
        gridCoordinate: { x: 1, z: 4 },
        preferredRotationY: 0,
        assignedAgentId: 'gpt',
      },
      {
        id: 'ws-desk-kimi',
        name: 'Mesa de Análise (Kimi)',
        zoneId: 'workstations',
        worldPosition: { x: -3.6, z: 0.0 },
        gridCoordinate: { x: 2, z: 4 },
        preferredRotationY: 0,
        assignedAgentId: 'kimi',
      },
      {
        id: 'ws-desk-claude',
        name: 'Mesa de Pesquisa (Claude)',
        zoneId: 'workstations',
        worldPosition: { x: -2.4, z: 0.0 },
        gridCoordinate: { x: 3, z: 4 },
        preferredRotationY: 0,
        assignedAgentId: 'claude',
      },
      {
        id: 'ws-desk-gemini',
        name: 'Mesa de Produto (Gemini)',
        zoneId: 'workstations',
        worldPosition: { x: -1.2, z: 0.0 },
        gridCoordinate: { x: 4, z: 4 },
        preferredRotationY: 0,
        assignedAgentId: 'gemini',
      },
    ],
  },

  coffee: {
    id: 'coffee',
    name: 'Área de Café',
    type: 'coffee',
    color: '#f59e0b',
    bounds: { minX: -6.5, maxX: -1.0, minZ: 0.8, maxZ: 4.8 },
    interactionPoints: [
      {
        id: 'coffee-stool-north',
        name: 'Banqueta de Café Norte',
        zoneId: 'coffee',
        worldPosition: { x: -3.0, z: 1.2 },
        gridCoordinate: { x: 3, z: 5 },
        preferredRotationY: Math.PI / 4,
      },
      {
        id: 'coffee-stool-south',
        name: 'Banqueta de Café Sul',
        zoneId: 'coffee',
        worldPosition: { x: -3.0, z: 3.6 },
        gridCoordinate: { x: 3, z: 7 },
        preferredRotationY: -Math.PI / 4,
      },
      {
        id: 'coffee-counter-front',
        name: 'Frente ao Balcão de Café',
        zoneId: 'coffee',
        worldPosition: { x: -4.2, z: 2.4 },
        gridCoordinate: { x: 2, z: 6 },
        preferredRotationY: -Math.PI / 2,
      },
      {
        id: 'coffee-lounge-stand',
        name: 'Mesa Alta de Café',
        zoneId: 'coffee',
        worldPosition: { x: -1.8, z: 2.4 },
        gridCoordinate: { x: 4, z: 6 },
        preferredRotationY: Math.PI / 2,
      },
    ],
  },

  meeting: {
    id: 'meeting',
    name: 'Sala de Reunião',
    type: 'meeting',
    color: '#818cf8',
    bounds: { minX: 1.2, maxX: 6.5, minZ: -4.8, maxZ: -0.5 },
    interactionPoints: [
      {
        id: 'meeting-chair-sw',
        name: 'Cadeira Reunião Sudoeste',
        zoneId: 'meeting',
        worldPosition: { x: 1.8, z: 0.0 },
        gridCoordinate: { x: 7, z: 4 },
        preferredRotationY: 0,
      },
      {
        id: 'meeting-chair-se',
        name: 'Cadeira Reunião Sudeste',
        zoneId: 'meeting',
        worldPosition: { x: 4.2, z: 0.0 },
        gridCoordinate: { x: 9, z: 4 },
        preferredRotationY: 0,
      },
      {
        id: 'meeting-chair-nw',
        name: 'Cadeira Reunião Noroeste',
        zoneId: 'meeting',
        worldPosition: { x: 3.0, z: 0.0 },
        gridCoordinate: { x: 8, z: 4 },
        preferredRotationY: 0,
      },
      {
        id: 'meeting-chair-ne',
        name: 'Cadeira Reunião Nordeste',
        zoneId: 'meeting',
        worldPosition: { x: 5.4, z: 0.0 },
        gridCoordinate: { x: 10, z: 4 },
        preferredRotationY: 0,
      },
      {
        id: 'meeting-whiteboard',
        name: 'Acesso ao Quadro Branco',
        zoneId: 'meeting',
        worldPosition: { x: 0.6, z: -1.2 },
        gridCoordinate: { x: 6, z: 3 },
        preferredRotationY: -Math.PI / 2,
      },
    ],
  },

  lounge: {
    id: 'lounge',
    name: 'Lounge e Convivência',
    type: 'lounge',
    color: '#ec4899',
    bounds: { minX: 1.2, maxX: 6.5, minZ: 0.8, maxZ: 4.8 },
    interactionPoints: [
      {
        id: 'lounge-east',
        name: 'Poltrona Leste do Lounge',
        zoneId: 'lounge',
        worldPosition: { x: 5.4, z: 1.2 },
        gridCoordinate: { x: 10, z: 5 },
        preferredRotationY: -Math.PI / 2,
      },
      {
        id: 'lounge-west',
        name: 'Poltrona Oeste do Lounge',
        zoneId: 'lounge',
        worldPosition: { x: 1.8, z: 1.2 },
        gridCoordinate: { x: 7, z: 5 },
        preferredRotationY: Math.PI / 2,
      },
      {
        id: 'lounge-north',
        name: 'Frente ao Sofá do Lounge',
        zoneId: 'lounge',
        worldPosition: { x: 3.0, z: 1.2 },
        gridCoordinate: { x: 8, z: 5 },
        preferredRotationY: Math.PI,
      },
    ],
  },

  spawn: {
    id: 'spawn',
    name: 'Ponto de Entrada e Spawn',
    type: 'spawn',
    color: '#10b981',
    bounds: { minX: -1.5, maxX: 1.5, minZ: 2.0, maxZ: 4.8 },
    interactionPoints: [
      {
        id: 'spawn-main',
        name: 'Entrada Principal',
        zoneId: 'spawn',
        worldPosition: { x: -0.6, z: 0.0 },
        gridCoordinate: { x: 5, z: 4 },
        preferredRotationY: -Math.PI / 2,
      },
      {
        id: 'spawn-secondary',
        name: 'Recepção',
        zoneId: 'spawn',
        worldPosition: { x: 0.6, z: 0.0 },
        gridCoordinate: { x: 6, z: 4 },
        preferredRotationY: 0,
      },
    ],
  },

  walkable: {
    id: 'walkable',
    name: 'Corredores e Circulação Livre',
    type: 'walkable',
    color: '#94a3b8',
    bounds: { minX: -6.5, maxX: 6.5, minZ: -4.8, maxZ: 4.8 },
    interactionPoints: [
      {
        id: 'walk-corridor-center',
        name: 'Cruzamento Central do Escritório',
        zoneId: 'walkable',
        worldPosition: { x: 0.0, z: 0.0 },
        gridCoordinate: { x: 5, z: 4 },
        preferredRotationY: 0,
      },
      {
        id: 'walk-corridor-north',
        name: 'Corredor Norte (Acesso Reunião/Mesas)',
        zoneId: 'walkable',
        worldPosition: { x: 0.0, z: -2.4 },
        gridCoordinate: { x: 5, z: 2 },
        preferredRotationY: 0,
      },
      {
        id: 'walk-corridor-south',
        name: 'Corredor Sul (Acesso Café/Lounge)',
        zoneId: 'walkable',
        worldPosition: { x: 0.0, z: 1.2 },
        gridCoordinate: { x: 5, z: 5 },
        preferredRotationY: 0,
      },
    ],
  },
};

/**
 * Retorna os pontos de interação configurados para uma determinada zona.
 */
export function getZoneInteractionPoints(zoneId: ZoneType | string): ZoneInteractionPoint[] {
  const zone = OFFICE_ZONES[zoneId as ZoneType];
  return zone ? zone.interactionPoints : [];
}

/**
 * Seleciona o melhor ponto de interação disponível em uma zona para um agente.
 * Se houver um ponto especificamente atribuído ao agente (como mesas de trabalho), prioriza-o.
 * Caso contrário, escolhe o primeiro ponto que não esteja ocupado por outro agente.
 */
export function getAvailableInteractionPoint(
  zoneId: ZoneType | string,
  agentId: string,
  occupiedPointIds: Set<string>
): ZoneInteractionPoint | null {
  const points = getZoneInteractionPoints(zoneId);
  if (points.length === 0) return null;

  // 1. Procura ponto diretamente atribuído a este agente
  const assignedPoint = points.find(
    (p) => p.assignedAgentId === agentId && !occupiedPointIds.has(p.id)
  );
  if (assignedPoint) return assignedPoint;

  // 2. Procura ponto livre
  const freePoint = points.find((p) => !occupiedPointIds.has(p.id));
  if (freePoint) return freePoint;

  // 3. Fallback: retorna o primeiro ponto da zona
  return points[0];
}
